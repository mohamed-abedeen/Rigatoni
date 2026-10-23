const { app, BrowserWindow, Tray, Menu, ipcMain, screen, powerMonitor, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");

if (!app.requestSingleInstanceLock()) { app.quit(); return; }
app.setAppUserModelId("com.toni.rigatoni");

const CARD_WIDTH = 480;
const SNOOZE_MIN = 5;
const asset = name => path.join(__dirname, "assets", name);

// ---------- settings ----------
const settingsFile = path.join(app.getPath("userData"), "settings.json");
const today = () => new Date().toDateString();
let cfg = { interval: 20, sound: true, index: 0, stats: { day: today(), total: 0, by: {} } };
try { cfg = { ...cfg, ...JSON.parse(fs.readFileSync(settingsFile, "utf8")) }; } catch {}
const save = () => { try { fs.writeFileSync(settingsFile, JSON.stringify(cfg, null, 2)); } catch {} };
function rollDay() {
  if (cfg.stats.day !== today()) { cfg.stats = { day: today(), total: 0, by: {} }; save(); }
}

const run = { nextAt: 0, paused: false, pausedLeft: 0, cardUp: false, quitting: false };
const schedule = (mins = cfg.interval) => { run.nextAt = Date.now() + mins * 60000; broadcast(); };

// ---------- start with Windows ----------
function loginOptions() {
  // in dev, electron.exe needs the app folder as its first argument
  return app.isPackaged
    ? { path: process.execPath, args: ["--hidden"] }
    : { path: process.execPath, args: [path.resolve(__dirname), "--hidden"] };
}
const openAtLogin = () => app.getLoginItemSettings(loginOptions()).openAtLogin;
const setOpenAtLogin = on => app.setLoginItemSettings({ openAtLogin: on, ...loginOptions() });

// ---------- windows ----------
let mainWin = null, cardWin = null, tray = null;
const prefs = { preload: path.join(__dirname, "preload.js"), backgroundThrottling: false, autoplayPolicy: "no-user-gesture-required" };

function createMain(show) {
  mainWin = new BrowserWindow({
    width: 440, height: 740, minWidth: 380, minHeight: 600, show: false,
    title: "Toni the Rigatoni", icon: asset("toni.ico"), backgroundColor: "#ecebe8",
    autoHideMenuBar: true, webPreferences: prefs,
  });
  mainWin.loadFile(path.join(__dirname, "src", "app.html"));
  mainWin.on("close", e => { if (!run.quitting) { e.preventDefault(); mainWin.hide(); } });
  if (show) mainWin.once("ready-to-show", () => mainWin.show());
}

function createCard() {
  cardWin = new BrowserWindow({
    width: CARD_WIDTH, height: 180, show: false, frame: false, transparent: true, hasShadow: false,
    resizable: false, movable: false, minimizable: false, maximizable: false, fullscreenable: false,
    skipTaskbar: true, focusable: false, alwaysOnTop: true, backgroundColor: "#00000000",
    webPreferences: prefs,
  });
  // "screen-saver" keeps the card above normal windows and most full-screen apps
  cardWin.setAlwaysOnTop(true, "screen-saver");
  cardWin.loadFile(path.join(__dirname, "src", "card.html"));
}

function showMain() {
  if (!mainWin) createMain(true);
  mainWin.show(); mainWin.focus();
}

function placeCard(height) {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const wa = display.workArea;
  cardWin.setBounds({ x: wa.x + wa.width - CARD_WIDTH, y: wa.y + 4, width: CARD_WIDTH, height: Math.round(height) });
}

function remind() {
  if (run.cardUp) return;
  rollDay();
  run.cardUp = true; run.nextAt = 0;
  placeCard(cardWin.getBounds().height);
  cardWin.showInactive();
  cardWin.setAlwaysOnTop(true, "screen-saver");
  cardWin.webContents.send("card:show", { index: cfg.index, sound: cfg.sound, stats: cfg.stats });
  cfg.index++; save(); broadcast();
}

// ---------- state for the main window and tray ----------
function state() {
  return { interval: cfg.interval, sound: cfg.sound, stats: cfg.stats, paused: run.paused, pausedLeft: run.pausedLeft, nextAt: run.nextAt, openAtLogin: openAtLogin() };
}
function broadcast() {
  if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send("state", state());
  refreshTray();
}

function minutesLeft() {
  if (run.paused) return "Paused";
  if (!run.nextAt) return "Stretch time!";
  const m = Math.max(1, Math.ceil((run.nextAt - Date.now()) / 60000));
  return `Next stretch in ${m} min`;
}

function refreshTray() {
  if (!tray) return;
  tray.setToolTip(`Toni the Rigatoni\n${minutesLeft()}`);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: minutesLeft(), enabled: false },
    { type: "separator" },
    { label: "Stretch now", click: remind },
    { label: run.paused ? "Resume" : "Pause", click: () => setSettings({ paused: !run.paused }) },
    { label: "Remind me", submenu: [20, 30, 45, 60].map(m => ({
      label: `Every ${m} minutes`, type: "radio", checked: cfg.interval === m, click: () => setSettings({ interval: m }),
    })) },
    { label: "Sound", type: "checkbox", checked: cfg.sound, click: () => setSettings({ sound: !cfg.sound }) },
    { label: "Start with Windows", type: "checkbox", checked: openAtLogin(), click: () => setSettings({ openAtLogin: !openAtLogin() }) },
    { type: "separator" },
    { label: "Open Toni", click: showMain },
    { label: "Quit", click: () => { run.quitting = true; app.quit(); } },
  ]));
}

function setSettings(s) {
  if ("interval" in s) { cfg.interval = s.interval; if (!run.cardUp) { run.paused = false; schedule(); } }
  if ("sound" in s) cfg.sound = s.sound;
  if ("openAtLogin" in s) setOpenAtLogin(s.openAtLogin);
  if ("paused" in s) {
    if (s.paused && !run.paused && run.nextAt) { run.paused = true; run.pausedLeft = run.nextAt - Date.now(); }
    else if (!s.paused && run.paused) { run.paused = false; run.nextAt = Date.now() + run.pausedLeft; }
  }
  save(); broadcast();
}

// ---------- IPC ----------
ipcMain.handle("state:get", () => state());
ipcMain.on("set", (_e, s) => setSettings(s));
ipcMain.on("remind:now", remind);
ipcMain.on("card:resize", (_e, h) => { if (cardWin) { const b = cardWin.getBounds(); cardWin.setBounds({ ...b, height: Math.round(h) }); } });
ipcMain.handle("card:done", (_e, id) => {
  rollDay();
  cfg.stats.total++;
  cfg.stats.by[id] = (cfg.stats.by[id] || 0) + 1;
  save(); schedule();
  return cfg.stats;
});
ipcMain.on("card:snooze", () => schedule(SNOOZE_MIN));
ipcMain.on("card:hidden", () => {
  cardWin.hide(); run.cardUp = false;
  if (!run.nextAt && !run.paused) schedule();
});

// ---------- app ----------
// "Toni.exe --remind-now" pops the card right away, even if Toni is already running
app.on("second-instance", (_e, argv) => argv.includes("--remind-now") ? remind() : showMain());
app.on("before-quit", () => { run.quitting = true; });
app.on("window-all-closed", e => e.preventDefault());

app.whenReady().then(() => {
  createCard();
  createMain(!process.argv.includes("--hidden"));

  tray = new Tray(nativeImage.createFromPath(asset("tray.png")));
  tray.on("click", showMain);

  schedule();
  if (process.argv.includes("--remind-now")) cardWin.webContents.once("did-finish-load", () => setTimeout(remind, 500));
  setInterval(() => {
    rollDay();
    if (!run.paused && !run.cardUp && run.nextAt && Date.now() >= run.nextAt) remind();
  }, 1000);
  setInterval(refreshTray, 30000);

  // a fresh interval after the PC wakes up or you come back to it
  powerMonitor.on("resume", () => { if (!run.paused && !run.cardUp) schedule(); });
  powerMonitor.on("unlock-screen", () => { if (!run.paused && !run.cardUp) schedule(); });
});
