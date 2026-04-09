const path = require('path');
const puppeteer = require(path.resolve(__dirname, '..', '..', 'IAM', 'backend-node', 'node_modules', 'puppeteer'));

(async () => {
  const pdfPath = path.resolve(__dirname, '..', '..', 'docs', 'Checklist 69 - นักวิจัยใหม่.pdf');
  const pdfUrl = 'file:///' + pdfPath.replace(/\\\\/g, '/');

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    html,body{margin:0;height:100%;}
    #wrap{position:relative;width:210mm;height:297mm;}
    #pdf{position:absolute;inset:0;width:100%;height:100%;border:0;}
    #overlay{position:absolute;left:150mm;top:120mm;font-size:24px;font-weight:700;color:red;z-index:10;}
  </style></head><body><div id="wrap"><iframe id="pdf" src="${pdfUrl}"></iframe><div id="overlay">✓</div></div></body></html>`;

  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-gpu', '--window-size=1000,1400'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 1400, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 3500));

  const outPng = path.resolve(__dirname, '..', '..', 'docs', '_pdf_refs', 'embed-test.png');
  await page.screenshot({ path: outPng, fullPage: true, fromSurface: false });

  await browser.close();
  console.log(JSON.stringify({ outPng }));
})().catch((e) => { console.error(e); process.exit(1); });
