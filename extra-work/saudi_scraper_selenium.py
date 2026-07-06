from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import pandas as pd
import re
import time
import random
from urllib.parse import quote_plus

class GoogleScraperSelenium:
    def __init__(self, headless=True):
        self.options = Options()
        if headless:
            self.options.add_argument("--headless")
        self.options.add_argument("--no-sandbox")
        self.options.add_argument("--disable-dev-shm-usage")
        self.options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        self.driver = webdriver.Chrome(options=self.options)
        self.results = []

    def search_google(self, query):
        url = f"https://www.google.com/search?q={quote_plus(query)}&num=10"
        self.driver.get(url)
        time.sleep(random.uniform(3, 6))
        return self.driver.page_source

    def parse_search_results(self, html):
        soup = BeautifulSoup(html, "html.parser")
        results = []

        for g in soup.find_all("div", class_="g"):
            anchor = g.find("a", href=True)
            if anchor:
                url = anchor.get("href", "")
                title_el = g.find("h3")
                title_text = title_el.text.strip() if title_el else "N/A"

                snippet_div = g.find("div", style="-webkit-line-clamp:2")
                if not snippet_div:
                    snippet_div = g.find("div", class_="VwiC3b")
                snippet = snippet_div.get_text(strip=True) if snippet_div else "N/A"

                if "/url?q=" in url:
                    url = url.split("/url?q=")[1].split("&")[0]

                if url and not url.startswith("https://www.google"):
                    results.append({
                        "title": title_text,
                        "url": url,
                        "snippet": snippet,
                    })

        return results

    def scrape_company_page(self, url):
        company_data = {
            "url": url,
            "phone": "",
            "email": "",
            "address": "",
            "materials": "",
        }

        try:
            self.driver.get(url)
            time.sleep(random.uniform(2, 4))
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, "html.parser")

            text = soup.get_text()

            phone_patterns = [
                r"\+?\d{2}[\s-]?\d{2,3}[\s-]?\d{3}[\s-]?\d{4}",
                r"\+\d{1,3}\s?\d{7,10}",
            ]
            for pattern in phone_patterns:
                phones = re.findall(pattern, text)
                if phones:
                    company_data["phone"] = "; ".join(phones[:3])
                    break

            email_pattern = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
            emails = re.findall(email_pattern, text)
            if emails:
                company_data["email"] = "; ".join(emails[:3])

            address_keywords = ["address", "location", "p.o.", "p.o box", "po box", "box no", "street", "district"]
            for keyword in address_keywords:
                address_pattern = rf"(?:[A-Za-z\s]+,?\s+)?(?:{keyword})[^\.!\n]{{0,80}}"
                matches = re.findall(address_pattern, text, re.IGNORECASE)
                if matches:
                    company_data["address"] = matches[0].strip()[:150]
                    break

            materials_keywords = ["cement", "steel", "pipes", "tiles", "bricks", "concrete", "insulation", "paint", "lumber", "timber", "glass", "aluminum", "marble", "granite"]
            found_materials = []
            for keyword in materials_keywords:
                if keyword.lower() in text.lower():
                    found_materials.append(keyword)
            company_data["materials"] = "; ".join(found_materials) if found_materials else ""

        except Exception as e:
            print(f"  Error scraping {url}: {e}")

        return company_data

    def scrape(self, search_queries=None, delay_range=(2, 5)):
        if search_queries is None:
            search_queries = [
                "building materials suppliers Saudi Arabia",
                "construction materials companies Riyadh",
                "steel suppliers Saudi Arabia",
                "cement companies Saudi Arabia",
                "tiles and ceramics suppliers Saudi Arabia",
                "plumbing materials Saudi Arabia",
                "electrical supplies Saudi Arabia",
                "hardware materials distributors Saudi Arabia",
                "paint suppliers Saudi Arabia",
                "insulation materials Saudi Arabia",
            ]

        for query in search_queries:
            print(f"Searching: {query}")
            html = self.search_google(query)

            if html:
                search_results = self.parse_search_results(html)
                print(f"  Found {len(search_results)} results")

                for result in search_results:
                    print(f"  Scraping: {result['title']}")
                    company_data = self.scrape_company_page(result["url"])

                    entry = {
                        "Company Name": result["title"],
                        "Website": company_data["url"],
                        "Phone": company_data["phone"],
                        "Email": company_data["email"],
                        "Address": company_data["address"],
                        "Materials": company_data["materials"],
                        "Description": result["snippet"],
                    }

                    if entry["Company Name"] not in [r["Company Name"] for r in self.results]:
                        self.results.append(entry)

                    time.sleep(random.uniform(delay_range[0], delay_range[1]))

            time.sleep(random.uniform(delay_range[0], delay_range[1]))

        return self.results

    def save_to_excel(self, filename="saudi_building_materials.xlsx"):
        if not self.results:
            print("No data to save")
            return

        df = pd.DataFrame(self.results)
        df.to_excel(filename, index=False, engine="openpyxl")
        print(f"Saved {len(self.results)} companies to {filename}")
        return filename

    def close(self):
        self.driver.quit()


def main():
    scraper = GoogleScraperSelenium(headless=False)

    try:
        results = scraper.scrape()

        if results:
            scraper.save_to_excel()
            print(f"\nTotal companies scraped: {len(results)}")
        else:
            print("No results found.")
    finally:
        scraper.close()


if __name__ == "__main__":
    main()
