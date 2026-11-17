// Renders the Mac icons: assets/toni-mac.png (1024px Dock tile) and the
// menu-bar icons assets/tray-mac.png + tray-mac@2x.png.
// Run with: npx electron tools/make-mac-icons.js
// assets/toni.icns is then built from toni-mac.png with sips + iconutil.
const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");
const out = path.join(root, "assets");
const url = p => "file://" + path.join(root, "src", p);

const page = body => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${url("toni.css")}">
<style>html,body{margin:0;background:transparent;overflow:hidden}
.arm,.leg,.motion{display:none} .toni *{transition:none!important;animation:none!important}
.tile{position:absolute;left:100px;top:100px;width:824px;height:824px;border-radius:186px;overflow:hidden;
  background:linear-gradient(180deg,#f0623f 0%,#d43d22 100%);box-shadow:0 10px 24px rgba(0,0,0,.28)}
.tile svg{position:absolute;left:0;top:0;width:824px;height:824px}
.bar svg{width:144px;height:144px}</style></head>
<body><script src="${url("toni.js")}"></script><script>${body}</script></body></html>`;

const jobs = [
  { name: "dock", size: 1024, body: `const t=document.createElement("div");t.className="tile";const s=makeToni();
      s.setAttribute("viewBox","38 14 124 124");t.appendChild(s);document.body.appendChild(t);` },
  { name: "bar", size: 144, body: `document.body.className="bar";const s=makeToni();
      s.querySelector("[filter]").removeAttribute("filter");s.setAttribute("viewBox","53 27 94 94");document.body.appendChild(s);` },
];

async function render(job) {
  const tmp = path.join(app.getPath("temp"), `toni-${job.name}.html`);
  fs.writeFileSync(tmp, page(job.body));
  const win = new BrowserWindow({ width: job.size, height: job.size, show: false, transparent: true, frame: false,
    useContentSize: true, webPreferences: { offscreen: true } });
  await win.loadFile(tmp);
  await new Promise(r => setTimeout(r, 800));
  const img = (await win.webContents.capturePage()).resize({ width: job.size, height: job.size, quality: "best" });
  win.destroy();
  return img;
}

app.on("window-all-closed", () => {}); // keep going between renders
app.whenReady().then(async () => {
  fs.mkdirSync(out, { recursive: true });
  const dock = await render(jobs[0]);
  fs.writeFileSync(path.join(out, "toni-mac.png"), dock.toPNG());
  const bar = await render(jobs[1]);
  fs.writeFileSync(path.join(out, "tray-mac.png"), bar.resize({ width: 18, height: 18, quality: "best" }).toPNG());
  fs.writeFileSync(path.join(out, "tray-mac@2x.png"), bar.resize({ width: 36, height: 36, quality: "best" }).toPNG());
  console.log("icons written to", out);
  app.quit();
});
