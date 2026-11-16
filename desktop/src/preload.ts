import { contextBridge, ipcRenderer } from "electron";

const bridge = {
  platform: process.platform,
  setTheme: (theme: "dark" | "light") => {
    ipcRenderer.send("listenmusic:theme", theme);
    ipcRenderer.send("musike:theme", theme);
  },
  setLanguage: (lang: string) => {
    ipcRenderer.send("listenmusic:lang", lang);
    ipcRenderer.send("musike:lang", lang);
  },
  retry: () => {
    ipcRenderer.send("listenmusic:retry");
    ipcRenderer.send("musike:retry");
  },
};

// The only bridge between the web app and the desktop shell.
contextBridge.exposeInMainWorld("listenmusicDesktop", bridge);
contextBridge.exposeInMainWorld("musikeDesktop", bridge);
