const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("toni", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  on: (channel, cb) => ipcRenderer.on(channel, (_e, data) => cb(data)),
});
