const puppeteer = require('puppeteer');

(async () => {
  const browserFetcher = puppeteer.createBrowserFetcher({
    path: '/tmp/chromium'
  });

  const revisionInfo = await browserFetcher.download('1270585');
  console.log('✅ Chrome bol nainštalovaný na:', revisionInfo.executablePath);
})();
