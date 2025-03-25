const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/zdravotnickydenik", async (req, res) => {
  try {
    // Dynamicky nájde cestu ku Chromiumu
    const cacheDir = path.join(__dirname, ".cache", "puppeteer", "chrome");
    const chromePath = findChromeExecutable(cacheDir);

    if (!chromePath) {
      throw new Error("Chrome executable not found");
    }

    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto("https://www.zdravotnickydenik.cz", { timeout: 60000 });

    // Skús kliknúť na cookie banner
    try {
      await page.waitForSelector("#didomi-notice-agree-button", { timeout: 5000 });
      await page.click("#didomi-notice-agree-button");
      console.log("✅ Cookie banner odkliknutý");
    } catch {
      console.log("ℹ️ Cookie banner sa nenašiel alebo netreba");
    }

    const articles = await page.evaluate(() => {
      const blocks = Array.from(document.querySelectorAll(".td-module-thumb a"));
      return blocks.slice(0, 5).map(el => ({
        title: el.getAttribute("title") || el.innerText,
        url: el.href,
      }));
    });

    await browser.close();
    console.log(`📰 Našiel som ${articles.length} článkov`);
    res.json({
      source: "ZdravotnickyDenik.cz",
      count: articles.length,
      articles,
    });

  } catch (err) {
    console.error("❌ Chyba pri scrapovaní:", err);
    res.status(500).json({
      error: "Chyba pri scrapovaní",
      detail: err.message,
    });
  }
});

// 🔍 Funkcia na dynamické vyhľadanie Chrome spustiteľného súboru
function findChromeExecutable(baseDir) {
  try {
    const versions = fs.readdirSync(baseDir);
    for (const version of versions) {
      const fullPath = path.join(baseDir, version, "chrome-linux64", "chrome");
      if (fs.existsSync(fullPath)) {
        console.log("✅ Chrome nájdený:", fullPath);
        return fullPath;
      }
    }
  } catch (e) {
    console.log("⚠️ Chrome executable path not found");
  }
  return null;
}

app.listen(PORT, () => {
  console.log(`🚀 Scraper beží na http://localhost:${PORT}`);
});
