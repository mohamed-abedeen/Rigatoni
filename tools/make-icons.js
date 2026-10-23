// Renders Toni's face to assets/tray.png and assets/toni.ico.
// Run with: npx electron tools/make-icons.js
const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");
const out = path.join(root, "assets");

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="file:///${path.join(root, "src", "toni.css").replace(/\\/g, "/")}">
<style>html,body{margin:0;background:transparent;overflow:hidden}
svg.toni{width:256px;height:256px} .arm{display:none} .toni *{transition:none!important;animation:none!important}</style></head>
<body><script src="file:///${path.join(root, "src", "toni.js").replace(/\\/g, "/")}"></script>
<script>const s=makeToni(); s.setAttribute("viewBox","38 22 124 124"); document.body.appendChild(s);</script></body></html>`;

function ico(pngs) {
  // ICO container holding PNG images
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach(({ size, data }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o); dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(data.length, o + 8); dir.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...pngs.map(p => p.data)]);
}

app.whenReady().then(async () => {
  const tmp = path.join(app.getPath("temp"), "toni-icon.html");
  fs.writeFileSync(tmp, html);
  const win = new BrowserWindow({ width: 256, height: 256, show: false, transparent: true, frame: false,
    useContentSize: true, webPreferences: { offscreen: true } });
  win.webContents.setFrameRate(10);
  let done = false;
  win.webContents.on("paint", async (_e, _dirty, image) => {
    if (done) return;
    await new Promise(r => setTimeout(r, 400)); // let the font/filters settle
    done = true;
    const big = (await win.webContents.capturePage()).resize({ width: 256, height: 256, quality: "best" });
    fs.mkdirSync(out, { recursive: true });
    const sizes = [16, 24, 32, 48, 64, 256];
    const pngs = sizes.map(size => ({ size, data: big.resize({ width: size, height: size, quality: "best" }).toPNG() }));
    fs.writeFileSync(path.join(out, "toni.ico"), ico(pngs));
    fs.writeFileSync(path.join(out, "tray.png"), big.resize({ width: 32, height: 32, quality: "best" }).toPNG());
    fs.writeFileSync(path.join(out, "toni.png"), big.toPNG());
    console.log("icons written to", out);
    app.quit();
  });
  win.loadFile(tmp);
});
