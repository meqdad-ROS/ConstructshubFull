from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup
import pandas as pd
import re
import time
import random
import os
import json
from urllib.parse import urljoin, urlparse

class SaudiMaterialsScraper:
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

        print("Starting browser...")
        self.driver = webdriver.Chrome(options=self.options)
        self.driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        })
        self.results = []
        self.images_dir = "company_images"
        os.makedirs(self.images_dir, exist_ok=True)

    def safe_get(self, url, timeout=15):
        try:
            self.driver.set_page_load_timeout(timeout)
            self.driver.get(url)
            time.sleep(random.uniform(2, 4))
            return True
        except TimeoutException:
            print(f"  Timeout loading {url}")
            return False
        except Exception as e:
            print(f"  Error loading {url}: {e}")
            return False

    def scrape_yellowpages_sa(self):
        print("\n=== Scraping Yellow Pages Saudi Arabia ===")
        
        queries = [
            "building-materials",
            "construction-materials",
            "steel-suppliers",
            "cement-manufacturers",
            "tiles-ceramics",
            "plumbing-supplies",
            "hardware-supplies",
        ]

        for query in queries:
            url = f"https://www.yellowpages.com.sa/en/q/{query}"
            print(f"\nSearching: {query}")
            
            if not self.safe_get(url):
                continue

            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
            except:
                continue

            html = self.driver.page_source
            soup = BeautifulSoup(html, "html.parser")
            
            companies = soup.find_all("div", class_="business-card")
            if not companies:
                companies = soup.find_all("li", class_=re.compile(".*business.*"))
            if not companies:
                companies = soup.find_all("div", class_=re.compile(".*listing.*"))
            if not companies:
                companies = soup.find_all("div", class_=re.compile(".*company.*"))
            if not companies:
                companies = soup.find_all("div", id=re.compile(".*business.*"))

            if not companies:
                print("  No companies found on page")
                continue

            print(f"  Found {len(companies)} companies on page")

            for company in companies[:10]:
                try:
                    company_data = self.parse_company_card(company)
                    if company_data and company_data.get("name"):
                        print(f"  Scraping: {company_data['name']}")
                        if company_data.get("website"):
                            self.scrape_company_website(company_data)
                        self.results.append(company_data)
                        time.sleep(random.uniform(2, 4))
                except Exception as e:
                    print(f"  Error parsing company: {e}")
                    continue

            time.sleep(random.uniform(3, 5))

    def parse_company_card(self, card):
        data = {
            "name": "",
            "website": "",
            "phone": "",
            "email": "",
            "address": "",
            "description": "",
            "materials": "",
            "materials_with_images": [],
        }

        name_el = card.find(["h2", "h3", "h4"]) or card.find("a", class_=re.compile(".*name.*"))
        if name_el:
            data["name"] = name_el.get_text(strip=True)
        else:
            link = card.find("a")
            if link:
                data["name"] = link.get_text(strip=True)

        website_el = card.find("a", href=True)
        if website_el:
            href = website_el["href"]
            if "http" in href and "yellowpages" not in href:
                data["website"] = href

        phone_els = card.find_all(string=re.compile(r"\d{7,}"))
        for phone_el in phone_els:
            text = phone_el.strip()
            if re.search(r"\+?\d[\d\s-]{7,}", text):
                data["phone"] = text
                break

        desc_el = card.find("p") or card.find("div", class_=re.compile(".*description.*"))
        if desc_el:
            data["description"] = desc_el.get_text(strip=True)[:200]

        return data

    def scrape_company_website(self, company_data):
        url = company_data["website"]
        print(f"    Visiting website: {url}")
        
        if not self.safe_get(url, timeout=10):
            return

        try:
            soup = BeautifulSoup(self.driver.page_source, "html.parser")
            text = soup.get_text(separator=" ", strip=True)

            phone_patterns = [
                r"\+966\s?\d{1,2}[\s-]?\d{3}[\s-]?\d{4}",
                r"\+966\d{9}",
            ]
            for pattern in phone_patterns:
                phones = re.findall(pattern, text)
                if phones:
                    company_data["phone"] = phones[0]
                    break

            emails = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
            if emails:
                company_data["email"] = "; ".join(emails[:3])

            address_keywords = ["address", "location", "p.o.", "po box", "riyadh", "jeddah", "dammam", "khobar"]
            for keyword in address_keywords:
                matches = re.findall(rf"[^.\n]*?{keyword}[^.\n]{{0,60}}", text, re.IGNORECASE)
                if matches:
                    company_data["address"] = matches[0].strip()[:150]
                    break

            materials_keywords = [
                "cement", "steel", "pipes", "tiles", "bricks", "concrete", "insulation",
                "paint", "lumber", "timber", "glass", "aluminum", "marble", "granite",
                "sand", "gravel", "rebar", "gypsum", "plywood", "roofing", "doors", "windows"
            ]
            found = [kw for kw in materials_keywords if kw.lower() in text.lower()]
            company_data["materials"] = "; ".join(found)

            self.scrape_materials_images(url, company_data)

        except Exception as e:
            print(f"    Error scraping website: {e}")

    def scrape_materials_images(self, base_url, company_data):
        print(f"    Scraping material images...")
        
        try:
            soup = BeautifulSoup(self.driver.page_source, "html.parser")
            img_tags = soup.find_all("img")

            product_keywords = ["product", "material", "catalog", "gallery", "item", "service"]
            
            for img in img_tags:
                img_src = img.get("src") or img.get("data-src") or img.get("data-lazy-src") or ""
                if not img_src:
                    continue

                if img_src.startswith("//"):
                    img_src = "https:" + img_src
                elif not img_src.startswith("http"):
                    img_src = urljoin(base_url, img_src)

                alt_text = img.get("alt", "").strip()
                title = img.get("title", "").strip()

                material_name = alt_text or title
                if not material_name:
                    parent_text = img.parent.get_text(strip=True)[:50] if img.parent else ""
                    if parent_text:
                        material_name = parent_text

                if not material_name or len(material_name) < 3:
                    continue

                width = img.get("width", "0")
                try:
                    if int(width) < 50:
                        continue
                except:
                    pass

                file_path = self.download_image(img_src, company_data.get("name", "unknown"), material_name)
                
                if file_path:
                    company_data["materials_with_images"].append({
                        "name": material_name,
                        "image_path": file_path,
                        "image_url": img_src,
                    })

                if len(company_data["materials_with_images"]) >= 10:
                    break

        except Exception as e:
            print(f"    Error scraping images: {e}")

    def download_image(self, img_url, company_name, material_name):
        import requests as req
        
        try:
            if img_url.startswith("data:"):
                return None

            response = req.get(img_url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
            
            if response.status_code != 200:
                return None

            content_type = response.headers.get("Content-Type", "")
            if "image" not in content_type:
                return None

            if len(response.content) < 5000:
                return None

            ext = "jpg"
            if "png" in content_type:
                ext = "png"
            elif "webp" in content_type:
                ext = "webp"
            elif "gif" in content_type:
                ext = "gif"

            safe_company = re.sub(r'[^\w\s-]', '', company_name)[:25].strip()
            safe_material = re.sub(r'[^\w\s-]', '', material_name)[:25].strip()
            filename = f"{safe_company}_{safe_material}.{ext}".replace(" ", "_")
            filepath = os.path.join(self.images_dir, filename)

            with open(filepath, "wb") as f:
                f.write(response.content)

            return filepath

        except Exception as e:
            return None

    def scrape_google_business(self):
        print("\n=== Scraping Google Business Results ===")
        
        queries = [
            "building materials company Riyadh site:google.com/maps",
            "construction materials Jeddah site:yellowpages.com.sa",
        ]

        for query in queries:
            print(f"\nSearching: {query}")
            search_url = f"https://www.google.com/search?q={query}&num=5"
            
            if not self.safe_get(search_url, timeout=10):
                continue

            html = self.driver.page_source
            soup = BeautifulSoup(html, "html.parser")
            
            links = soup.find_all("a", href=True)
            for link in links:
                href = link["href"]
                if "/url?q=" in href:
                    actual_url = href.split("/url?q=")[1].split("&")[0]
                    if "yellowpages.com.sa" in actual_url or "saudibusinessdirectory.com" in actual_url:
                        print(f"  Found business URL: {actual_url}")
                        if not self.safe_get(actual_url, timeout=10):
                            continue
                        
                        soup = BeautifulSoup(self.driver.page_source, "html.parser")
                        self.parse_directory_page(soup, actual_url)
                        
                        time.sleep(random.uniform(3, 5))

    def parse_directory_page(self, soup, url):
        companies = soup.find_all("div", class_=re.compile(".*company.*|.*business.*|.*listing.*"))
        
        for company in companies[:5]:
            data = {
                "name": "",
                "website": url,
                "phone": "",
                "email": "",
                "address": "",
                "description": "",
                "materials": "",
                "materials_with_images": [],
            }

            name_el = company.find(["h2", "h3", "h4"]) or company.find("a")
            if name_el:
                data["name"] = name_el.get_text(strip=True)

            text = company.get_text(strip=True)
            emails = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
            if emails:
                data["email"] = "; ".join(emails[:3])

            phones = re.findall(r"\+966[\d\s-]{8,}", text)
            if phones:
                data["phone"] = phones[0]

            if data["name"]:
                print(f"  Found company: {data['name']}")
                self.results.append(data)

    def scrape_direct_companies(self):
        print("\n=== Scraping Known Building Materials Companies ===")
        
        companies_urls = [
            {
                "name": "Saudi Building Materials Co",
                "url": "https://www.sabancenter.com",
            },
            {
                "name": "Yamama Cement Company",
                "url": "https://www.yamamacement.com",
            },
            {
                "name": "Saudi Ceramics",
                "url": "https://www.saudiceramics.com",
            },
            {
                "name": "Zamil Steel",
                "url": "https://www.zamilsteel.com",
            },
            {
                "name": "SABIC",
                "url": "https://www.sabic.com",
            },
        ]

        for company in companies_urls:
            print(f"\nScraping: {company['name']}")
            
            if not self.safe_get(company["url"], timeout=10):
                continue

            try:
                soup = BeautifulSoup(self.driver.page_source, "html.parser")
                text = soup.get_text(separator=" ", strip=True)

                data = {
                    "name": company["name"],
                    "website": company["url"],
                    "phone": "",
                    "email": "",
                    "address": "",
                    "description": soup.find("meta", attrs={"name": "description"})
                    if soup.find("meta", attrs={"name": "description"}) else "",
                    "materials": "",
                    "materials_with_images": [],
                }

                if data["description"]:
                    data["description"] = data["description"].get("content", "")

                emails = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
                if emails:
                    data["email"] = "; ".join(emails[:3])

                phones = re.findall(r"\+966[\d\s-]{8,}", text)
                if phones:
                    data["phone"] = phones[0]

                materials_keywords = [
                    "cement", "steel", "pipes", "tiles", "bricks", "concrete", "insulation",
                    "paint", "lumber", "timber", "glass", "aluminum", "marble", "granite",
                    "ceramic", "plywood", "roofing", "doors", "windows", "gypsum"
                ]
                found = [kw for kw in materials_keywords if kw.lower() in text.lower()]
                data["materials"] = "; ".join(found)

                self.scrape_materials_images(company["url"], data)

                self.results.append(data)
                print(f"  Scraped {data['name']} - {len(data['materials_with_images'])} materials found")

                time.sleep(random.uniform(3, 5))

            except Exception as e:
                print(f"  Error: {e}")
                continue

    def scrape(self):
        self.scrape_direct_companies()
        self.scrape_yellowpages_sa()
        self.scrape_google_business()
        return self.results

    def save_results(self):
        if not self.results:
            print("No data to save")
            return

        output_data = []
        for company in self.results:
            material_names = [m["name"] for m in company.get("materials_with_images", [])]
            image_paths = [m["image_path"] for m in company.get("materials_with_images", [])]

            output_data.append({
                "Company Name": company.get("name", ""),
                "Website": company.get("website", ""),
                "Phone": company.get("phone", ""),
                "Email": company.get("email", ""),
                "Address": company.get("address", ""),
                "Materials": company.get("materials", ""),
                "Material Names": "; ".join(material_names),
                "Material Images": "; ".join(image_paths),
                "Description": company.get("description", ""),
            })

        df = pd.DataFrame(output_data)
        filename = "saudi_building_materials.xlsx"
        df.to_excel(filename, index=False, engine="openpyxl")
        print(f"\n✓ Saved {len(self.results)} companies to {filename}")

        materials_data = []
        for company in self.results:
            for material in company.get("materials_with_images", []):
                materials_data.append({
                    "Company Name": company.get("name", ""),
                    "Material Name": material["name"],
                    "Image Path": material["image_path"],
                    "Image URL": material["image_url"],
                })

        if materials_data:
            materials_df = pd.DataFrame(materials_data)
            materials_filename = "saudi_building_materials_products.xlsx"
            materials_df.to_excel(materials_filename, index=False, engine="openpyxl")
            print(f"✓ Saved {len(materials_data)} materials to {materials_filename}")

        return filename

    def close(self):
        self.driver.quit()


def main():
    scraper = SaudiMaterialsScraper(headless=True)

    try:
        print("Starting scraper...")
        results = scraper.scrape()

        if results:
            scraper.save_results()
            print(f"\nTotal companies scraped: {len(results)}")
            print(f"Images saved to: company_images/")
        else:
            print("No results found")
    finally:
        scraper.close()


if __name__ == "__main__":
    main()
