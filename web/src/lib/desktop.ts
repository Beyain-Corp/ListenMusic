/** Bridge exposed by the Electron preload script when ListenMusic runs as the desktop app. */
interface DesktopBridge {
  platform: string;
  setTheme: (theme: "dark" | "light") => void;
  /** Missing in desktop builds older than 1.2. */
  setLanguage?: (lang: string) => void;
  retry?: () => void;
}

const win = window as Window & { listenmusicDesktop?: DesktopBridge; musikeDesktop?: DesktopBridge };
export const desktop = win.listenmusicDesktop ?? win.musikeDesktop;

if (desktop) {
  document.documentElement.dataset.desktop = "true";
  // Match the native window buttons to the theme picked before this script ran.
  desktop.setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
}
