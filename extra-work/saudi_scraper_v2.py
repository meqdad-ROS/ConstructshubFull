from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import pandas as pd
import re
import time
import random
from urllib.parse import quote_plus, urlparse, urljoin
import json
import os
import requests
import base64

class GoogleScraperV2:
    def __init__(self, headless=True):
        self.options = Options()
        if headless:
            self.options.add_argument("--headless=new")
        self.options.add_argument("--no-sandbox")
        self.options.add_argument("--disable-dev-shm-usage")
        self.options.add_argument("--disable-blink-features=AutomationControlled")
        self.options.add_argument("--window-size=1920,1080")
        self.options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        self.options.add_experimental_option("excludeSwitches", ["enable-automation"])
        self.options.add_experimental_option("useAutomationExtension", False)

        self.driver = webdriver.Chrome(options=self.options)
        self.driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined})
            """
        })
        self.results = []
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def search_google(self, query):
        url = f"https://www.google.com/search?q={quote_plus(query)}&num=10&hl=en"
        print(f"  URL: {url}")
        self.driver.get(url)
        WebDriverWait(self.driver, 10).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        time.sleep(random.uniform(3, 6))

        page_source = self.driver.page_source
        with open(f"debug_{hash(query) % 10000}.html", "w") as f:
            f.write(page_source)
        return page_source

    def parse_search_results(self, html):
        soup = BeautifulSoup(html, "html.parser")
        results = []

        selectors = [
            "div.g",
            "div[data-sokoban-container]",
            "div[class*='g ']",
            "div.MjjYud",
            "div.tF2Cxc",
        ]

        containers = []
        for sel in selectors:
            containers = soup.select(sel)
            if containers:
                print(f"  Found containers with selector: {sel}")
                break

        for container in containers:
            anchor = container.find("a", href=True)
            if not anchor:
                continue

            url = anchor.get("href", "")

            title_el = container.find("h3")
            title_text = title_el.get_text(strip=True) if title_el else "N/A"

            snippet_el = container.find("div", {"data-sncf": "1"})
            if not snippet_el:
                snippet_el = container.find("span", class_="aCOpRe")
            if not snippet_el:
                snippet_el = container.find("div", style=lambda x: x and "-webkit-line-clamp" in x)
            snippet = snippet_el.get_text(strip=True) if snippet_el else "N/A"

            if "/url?q=" in url:
                url = url.split("/url?q=")[1].split("&")[0]

            if url and not url.startswith("https://www.google") and not url.startswith("https://accounts.google") and not url.startswith("https://support.google"):
                results.append({
                    "title": title_text,
                    "url": url,
                    "snippet": snippet,
                })

        return results

    def download_image(self, img_url, company_name, material_name, images_dir):
        if not img_url or img_url.startswith("data:"):
            if img_url and img_url.startswith("data:"):
                try:
                    header, encoded = img_url.split(",", 1)
                    extension = "png"
                    if "image/jpeg" in header:
                        extension = "jpg"
                    elif "image/webp" in header:
                        extension = "webp"
                    elif "image/gif" in header:
                        extension = "gif"
                    img_data = base64.b64decode(encoded)
                    safe_company = re.sub(r'[^\w\s-]', '', company_name)[:30]
                    safe_material = re.sub(r'[^\w\s-]', '', material_name)[:30]
                    filename = f"{safe_company}_{safe_material}.{extension}"
                    filepath = os.path.join(images_dir, filename)
                    with open(filepath, "wb") as f:
                        f.write(img_data)
                    return filepath
                except:
                    return None
            return None

        try:
            if img_url.startswith("//"):
                img_url = "https:" + img_url

            response = self.session.get(img_url, timeout=10)
            if response.status_code == 200 and len(response.content) > 5000:
                content_type = response.headers.get("Content-Type", "")
                if "image" in content_type:
                    extension = "jpg"
                    if "png" in content_type:
                        extension = "png"
                    elif "webp" in content_type:
                        extension = "webp"
                    elif "gif" in content_type:
                        extension = "gif"

                    safe_company = re.sub(r'[^\w\s-]', '', company_name)[:30]
                    safe_material = re.sub(r'[^\w\s-]', '', material_name)[:30]
                    filename = f"{safe_company}_{safe_material}.{extension}"
                    filepath = os.path.join(images_dir, filename)

                    with open(filepath, "wb") as f:
                        f.write(response.content)
                    return filepath
        except:
            pass
        return None

    def scrape_materials_with_images(self, url, company_name, images_dir):
        materials_with_images = []

        product_keywords = ["product", "catalog", "material", "gallery", "item", "offer", "shop"]

        product_urls = []
        try:
            self.driver.set_page_load_timeout(10)
            self.driver.get(url)
            time.sleep(random.uniform(2, 4))
            soup = BeautifulSoup(self.driver.page_source, "html.parser")
            base_url = url

            product_links = soup.find_all("a", href=True)
            for link in product_links:
                href = link.get("href", "")
                text = link.get_text(strip=True).lower()
                full_url = urljoin(base_url, href)

                if any(kw in text for kw in product_keywords) or any(kw in full_url.lower() for kw in product_keywords):
                    if full_url.startswith(base_url) and full_url != base_url:
                        product_urls.append(full_url)

            product_urls = list(dict.fromkeys(product_urls))[:5]

            if not product_urls:
                product_urls = [url]

        except:
            product_urls = [url]

        for prod_url in product_urls:
            try:
                self.driver.set_page_load_timeout(10)
                self.driver.get(prod_url)
                time.sleep(random.uniform(2, 4))
                soup = BeautifulSoup(self.driver.page_source, "html.parser")
                page_url = self.driver.current_url

                text_content = soup.get_text(separator=" ", strip=True)

                materials_keywords = [
                    "cement", "steel", "pipes", "tiles", "bricks", "concrete", "insulation",
                    "paint", "lumber", "timber", "glass", "aluminum", "marble", "granite",
                    "sand", "gravel", "rebar", "gypsum", "plywood", "roofing", "scaffolding",
                    "wire mesh", "doors", "windows", "flooring", "ceramic", "porcelain",
                    "electrical", "plumbing", "hvac", "fasteners", "bolts", "nails", "screws",
                    "waterproofing", "adhesive", "sealant", "aggregate", "ready mix", "blocks"
                ]

                found_materials = set()
                for keyword in materials_keywords:
                    if keyword.lower() in text_content.lower():
                        found_materials.add(keyword)

                headings = soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])
                for heading in headings:
                    heading_text = heading.get_text(strip=True)
                    for keyword in materials_keywords:
                        if keyword.lower() in heading_text.lower():
                            found_materials.add(keyword)

                img_tags = soup.find_all("img")

                for img in img_tags:
                    img_src = img.get("src", "") or img.get("data-src", "") or img.get("data-lazy-src", "") or img.get("data-original", "")

                    if not img_src:
                        continue

                    if img_src.startswith("//"):
                        img_src = "https:" + img_src
                    elif img_src.startswith("/"):
                        parsed_url = urlparse(page_url)
                        img_src = f"{parsed_url.scheme}://{parsed_url.netloc}{img_src}"
                    elif not img_src.startswith("http"):
                        img_src = urljoin(page_url, img_src)

                    alt_text = img.get("alt", "").strip()
                    title_attr = img.get("title", "").strip()
                    parent = img.parent
                    parent_text = ""
                    if parent:
                        sibling = parent.find_next_sibling("p")
                        if sibling:
                            parent_text = sibling.get_text(strip=True)
                        else:
                            parent_text = parent.get_text(strip=True)

                    material_name = alt_text or title_attr or parent_text
                    if not material_name:
                        for keyword in found_materials:
                            if keyword.lower() in img_src.lower():
                                material_name = keyword.capitalize()
                                break

                    if not material_name and found_materials:
                        material_name = list(found_materials)[0].capitalize()

                    if not material_name or len(material_name) < 2:
                        continue

                    width = img.get("width", 0)
                    height = img.get("height", 0)
                    try:
                        width = int(width)
                        height = int(height)
                    except:
                        width = 0
                        height = 0

                    if width and width < 50:
                        continue

                    filepath = self.download_image(img_src, company_name, material_name, images_dir)

                    if filepath:
                        materials_with_images.append({
                            "name": material_name,
                            "image_path": filepath,
                            "image_url": img_src,
                        })

                seen = set()
                unique_materials = []
                for m in materials_with_images:
                    if m["name"].lower() not in seen:
                        seen.add(m["name"].lower())
                        unique_materials.append(m)
                materials_with_images = unique_materials[:20]

            except Exception as e:
                print(f"  Error scraping products page {prod_url}: {e}")

        return materials_with_images

    def scrape_company_page(self, url, images_dir):
        company_data = {
            "url": url,
            "phone": "",
            "email": "",
            "address": "",
            "materials": "",
            "materials_with_images": [],
        }

        try:
            self.driver.set_page_load_timeout(10)
            self.driver.get(url)
            time.sleep(random.uniform(2, 4))
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, "html.parser")

            text = soup.get_text(separator=" ", strip=True)

            phone_patterns = [
                r"\+966\s?\d{1,2}[\s-]?\d{3}[\s-]?\d{4}",
                r"\+966\d{9}",
                r"\+\d{2}[\s-]?\d{2,3}[\s-]?\d{3}[\s-]?\d{4}",
                r"\d{3}[\s-]\d{3}[\s-]\d{4}",
            ]
            for pattern in phone_patterns:
                phones = re.findall(pattern, text)
                if phones:
                    company_data["phone"] = "; ".join(phones[:3])
                    break

            email_pattern = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
            emails = re.findall(email_pattern, text)
            valid_emails = [e for e in emails if "example" not in e.lower()]
            if valid_emails:
                company_data["email"] = "; ".join(valid_emails[:3])

            address_keywords = ["address", "location", "p.o.", "po box", "box no", "street", "district", "riyadh", "jeddah", "dammam", "khobar"]
            for keyword in address_keywords:
                regex = rf"(?:[^.\n]*?{keyword}[^.\n]{{0,60}})"
                matches = re.findall(regex, text, re.IGNORECASE)
                if matches:
                    company_data["address"] = matches[0].strip()[:150]
                    break

            materials_keywords = [
                "cement", "steel", "pipes", "tiles", "bricks", "concrete", "insulation",
                "paint", "lumber", "timber", "glass", "aluminum", "marble", "granite",
                "sand", "gravel", "rebar", "lumber"
            ]
            found_materials = []
            for keyword in materials_keywords:
                if keyword.lower() in text.lower():
                    found_materials.append(keyword)
            company_data["materials"] = "; ".join(found_materials) if found_materials else ""

            company_name_for_images = company_data.get("url", "unknown").split("/")[-2] if company_data.get("url") else "unknown"
            company_data["materials_with_images"] = self.scrape_materials_with_images(url, company_name_for_images, images_dir)

        except Exception as e:
            print(f"  Error scraping {url}: {e}")

        return company_data

    def scrape(self, search_queries=None, delay_range=(3, 6)):
        images_dir = "company_images"
        os.makedirs(images_dir, exist_ok=True)

        if search_queries is None:
            search_queries = [
                "building materials suppliers Saudi Arabia",
                "construction materials companies Riyadh",
                "steel suppliers Saudi Arabia",
                "cement companies Saudi Arabia",
            ]

        for query in search_queries:
            print(f"\nSearching: {query}")
            try:
                html = self.search_google(query)
            except Exception as e:
                print(f"  Search failed: {e}")
                continue

            if html:
                search_results = self.parse_search_results(html)
                print(f"  Found {len(search_results)} results")

                for result in search_results:
                    print(f"  Scraping: {result['title']}")
                    company_data = self.scrape_company_page(result["url"], images_dir)

                    material_names = [m["name"] for m in company_data["materials_with_images"]]
                    image_paths = [m["image_path"] for m in company_data["materials_with_images"]]

                    entry = {
                        "Company Name": result["title"],
                        "Website": company_data["url"],
                        "Phone": company_data["phone"],
                        "Email": company_data["email"],
                        "Address": company_data["address"],
                        "Materials": company_data["materials"],
                        "Material Names (with images)": "; ".join(material_names),
                        "Material Images": "; ".join(image_paths),
                        "Description": result["snippet"],
                    }

                    existing_names = [r["Company Name"] for r in self.results]
                    if entry["Company Name"] not in existing_names and entry["Website"] not in [r["Website"] for r in self.results]:
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
        print(f"\nSaved {len(self.results)} companies to {filename}")

        materials_df = []
        for company in self.results:
            for material in company.get("materials_with_images_data", []):
                materials_df.append({
                    "Company Name": company["Company Name"],
                    "Website": company["Website"],
                    "Material Name": material["name"],
                    "Image Path": material["image_path"],
                    "Image URL": material["image_url"],
                })

        if materials_df:
            materials_df_path = filename.replace(".xlsx", "_materials.xlsx")
            materials_df_obj = pd.DataFrame(materials_df)
            materials_df_obj.to_excel(materials_df_path, index=False, engine="openpyxl")
            print(f"Saved {len(materials_df)} materials to {materials_df_path}")

        return filename

    def close(self):
        self.driver.quit()


def main():
    scraper = GoogleScraperV2(headless=True)

    try:
        results = scraper.scrape()

        if results:
            scraper.save_to_excel()
            print(f"\nTotal companies scraped: {len(results)}")
        else:
            print("No results found. Check debug_*.html files to see what Google returned.")
    finally:
        scraper.close()


if __name__ == "__main__":
    main()
