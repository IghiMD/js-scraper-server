const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/zdravotnickydenik", async (req, res) => {
  console.log("👉 Spúšťam scraping zdravotnickydenik.cz");

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto("https://www.zdravotnickydenik.cz/rubrika/zpravy/", {
      waitUntil: "networkidle2",
    });

    // Ak je cookie banner, klikni na „Souhlasím“
    try {
      await page.waitForSelector("#didomi-notice-agree-button", { timeout: 5000 });
      await page.click("#didomi-notice-agree-button");
      console.log("🍪 Cookie banner odkliknutý");
    } catch {
      console.log("ℹ️ Cookie banner sa nenašiel alebo netreba");
    }

    const articles = await page.evaluate(() => {
      const blocks = Array.from(document.querySelectorAll(".td-module-thumb a"));
      return blocks.slice(0, 5).map((el) => ({
        title: el.getAttribute("title") || el.innerText,
        url: el.href,
      }));
    });

    await browser.close();

    console.log(`✅ Našiel som ${articles.length} článkov`);
    res.json({
      source: "ZdravotnickyDenik.cz",
      count: articles.length,
      articles,
    });
  } catch (err) {
    console.error("❌ Chyba pri scrapovaní:", err);
    res.status(500).json({ error: "Chyba pri scrapovaní", detail: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("🧠 JS Scraper beží. Použi /zdravotnickydenik");
});

app.listen(PORT, () => {
  console.log(`🚀 Scraper server beží na porte ${PORT}`);
});
