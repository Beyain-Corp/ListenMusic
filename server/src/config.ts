import { accessSync, constants, copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Folder of the server package (bundled builds pass every path through env instead).
const root = typeof import.meta.url === "string" ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") : process.cwd();

export function parseExtraArgs(raw: string | undefined): string[] {
  if (!raw) return [];
  const sanitized = raw.replace(/player_client=tv_samsung/g, "player_client=web");
  const matches = sanitized.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  return matches
    .map((arg) => {
      let a = arg.trim();
      if ((a.startsWith('"') && a.endsWith('"')) || (a.startsWith("'") && a.endsWith("'"))) {
        a = a.slice(1, -1);
      }
      return a;
    })
    .filter(Boolean);
}

export function normalizeNetscapeCookies(raw: string): string {
  let text = raw.trim();
  // Check if JSON cookie array (exported by Cookie-Editor / EditThisCookie)
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const items = JSON.parse(text);
      if (Array.isArray(items) && items.length > 0 && items[0].name && items[0].value) {
        const lines = ["# Netscape HTTP Cookie File", "# https://curl.se/docs/http-cookies.html", ""];
        for (const item of items) {
          const domain = item.domain || ".youtube.com";
          const isSub = domain.startsWith(".") ? "TRUE" : "FALSE";
          const path = item.path || "/";
          const secure = item.secure ? "TRUE" : "FALSE";
          const expiry = Math.floor(item.expirationDate || item.expiry || Date.now() / 1000 + 365 * 86400);
          const prefix = item.httpOnly ? "#HttpOnly_" : "";
          lines.push(`${prefix}${domain}\t${isSub}\t${path}\t${secure}\t${expiry}\t${item.name}\t${item.value}`);
        }
        return lines.join("\n") + "\n";
      }
    } catch {
      /* not valid JSON */
    }
  }

  // Check if raw HTTP Cookie header (e.g. "NAME1=val1; NAME2=val2")
  if (!text.includes("\t") && text.includes("=") && text.includes(";")) {
    const pairs = text.replace(/^cookie:\s*/i, "").split(";").map((p) => p.trim()).filter(Boolean);
    const validPairs = pairs.map((p) => {
      const eq = p.indexOf("=");
      return eq > 0 ? [p.slice(0, eq).trim(), p.slice(eq + 1).trim()] : null;
    }).filter(Boolean) as [string, string][];
    if (validPairs.length > 1) {
      const lines = ["# Netscape HTTP Cookie File", "# https://curl.se/docs/http-cookies.html", ""];
      const expiry = Math.floor(Date.now() / 1000 + 365 * 86400);
      for (const [name, val] of validPairs) {
        lines.push(`.youtube.com\tTRUE\t/\tTRUE\t${expiry}\t${name}\t${val}`);
      }
      return lines.join("\n") + "\n";
    }
  }

  const lines = text.split(/\r?\n/);
  const normalized: string[] = ["# Netscape HTTP Cookie File", "# https://curl.se/docs/http-cookies.html", ""];
  let hasValid = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || (trimmed.startsWith("#") && !trimmed.startsWith("#HttpOnly_"))) continue;
    const parts = trimmed.split(/\t+|\s{2,}/);
    if (parts.length >= 7) {
      hasValid = true;
      normalized.push(parts.slice(0, 7).join("\t"));
    }
  }
  return hasValid ? normalized.join("\n") + "\n" : raw;
}

export const config = {
  port: Number(process.env.PORT ?? 4180),
  host: process.env.HOST ?? "0.0.0.0",
  /** Explicit yt-dlp executable. When unset it is located automatically (see tools.ts). */
  ytdlpPath: process.env.YTDLP_PATH || null,
  // Extra yt-dlp flags, e.g. YTDLP_EXTRA_ARGS="--cookies-from-browser firefox"
  ytdlpExtraArgs: parseExtraArgs(process.env.YTDLP_EXTRA_ARGS),
  dataDir: process.env.LISTENMUSIC_DATA_DIR ?? process.env.MUSIKE_DATA_DIR ?? path.join(root, "data"),
  cacheDir: process.env.LISTENMUSIC_CACHE_DIR ?? process.env.MUSIKE_CACHE_DIR ?? path.join(root, "cache"),
  /** HD video cache limit; least recently played videos are evicted first. */
  cacheMaxBytes: Number(process.env.LISTENMUSIC_CACHE_MAX_MB ?? process.env.MUSIKE_CACHE_MAX_MB ?? 2048) * 1024 * 1024,
  webDist: process.env.LISTENMUSIC_WEB_DIST ?? process.env.MUSIKE_WEB_DIST ?? path.resolve(root, "..", "web", "dist"),
  /**
   * Private folder for yt-dlp, Deno and FFmpeg downloaded by ListenMusic itself (the desktop app sets it).
   * Searched before the system PATH, and where "Instalar" puts the tools when set.
   */
  binDir: process.env.LISTENMUSIC_BIN_DIR ?? process.env.MUSIKE_BIN_DIR ?? null,
  /** YouTube Music language when a request doesn't say (the app always does). */
  lang: process.env.LISTENMUSIC_LANG ?? process.env.MUSIKE_LANG ?? "en",
  location: process.env.LISTENMUSIC_LOCATION ?? process.env.MUSIKE_LOCATION ?? "IN",
  /** Optional auth token to protect the API when exposed to networks. */
  authToken: process.env.LISTENMUSIC_AUTH_TOKEN ?? process.env.MUSIKE_AUTH_TOKEN ?? null,
  /** URL to fetch updated YouTube clients list from. */
  streamingUrl:
    process.env.LISTENMUSIC_STREAMING_URL ??
    process.env.MUSIKE_STREAMING_URL ??
    "https://raw.githubusercontent.com/Beyain-Corp/ListenMusic/main/mobile/streaming.json",
  /** HTTP for youtubei.js; the platform's own fetch here (the Android app passes its native one). */
  fetch: undefined as typeof fetch | undefined,
};

/**
 * Returns path to cookies file if provided explicitly via YOUTUBE_COOKIES env var,
 * in YTDLP_EXTRA_ARGS, or if cookies.txt exists in the data directory or app root.
 */
export function getCookiesFilePath(): string | null {
  const envCookies = process.env.YOUTUBE_COOKIES ?? process.env.COOKIES_CONTENT ?? process.env.COOKIES_DATA;
  if (envCookies) {
    const tmpEnvCookie = path.join(os.tmpdir(), "listenmusic-env-cookies.txt");
    try {
      let content = envCookies.trim();
      // Unwrap surrounding quotes if any
      if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith("'") && content.endsWith("'"))) {
        content = content.slice(1, -1).trim();
      }
      // Check if base64 encoded
      if (
        (content.startsWith("ey") || !content.includes("\t")) &&
        /^[A-Za-z0-9+/=\s]+$/.test(content)
      ) {
        try {
          const decoded = Buffer.from(content.replace(/\s+/g, ""), "base64").toString("utf-8");
          if (decoded.includes("\t") || decoded.includes("#")) content = decoded;
        } catch {
          /* not base64 */
        }
      }
      // Unescape literal \r\n, \n and \t from web environment inputs
      if (content.includes("\\n")) {
        content = content.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
      }
      if (content.includes("\\t")) {
        content = content.replace(/\\t/g, "\t");
      }
      content = normalizeNetscapeCookies(content);
      writeFileSync(tmpEnvCookie, content, { encoding: "utf-8", mode: 0o666 });
      return tmpEnvCookie;
    } catch {
      /* fallback */
    }
  }
  for (let i = 0; i < config.ytdlpExtraArgs.length; i++) {
    const arg = config.ytdlpExtraArgs[i];
    if (arg === "--cookies" && i + 1 < config.ytdlpExtraArgs.length) {
      const p = config.ytdlpExtraArgs[i + 1];
      if (existsSync(p)) return p;
    }
    if (arg.startsWith("--cookies=")) {
      const p = arg.slice(10);
      if (existsSync(p)) return p;
    }
  }
  const dataCookie = path.join(config.dataDir, "cookies.txt");
  if (existsSync(dataCookie)) return dataCookie;
  const rootCookie = path.join(root, "cookies.txt");
  if (existsSync(rootCookie)) return rootCookie;
  return null;
}

/**
 * Ensures yt-dlp has a writable cookie file so it never fails on exit with PermissionError [Errno 13].
 * If the original cookie file is not writable by the current process user, it copies it to /tmp.
 */
export function getWritableCookiesFile(): string | null {
  const file = getCookiesFilePath();
  if (!file) return null;
  try {
    accessSync(file, constants.W_OK);
    return file;
  } catch {
    const tmpCookie = path.join(os.tmpdir(), "listenmusic-cookies.txt");
    try {
      copyFileSync(file, tmpCookie);
      return tmpCookie;
    } catch {
      return file;
    }
  }
}

/**
 * Reads and formats Netscape cookies.txt into standard Cookie header format for Innertube.
 */
export function getCookieHeader(): string | undefined {
  const filePath = getCookiesFilePath();
  if (!filePath) return undefined;
  try {
    const content = readFileSync(filePath, "utf-8");
    const pairs: string[] = [];
    for (const rawLine of content.split("\n")) {
      let line = rawLine.trim();
      if (!line || (line.startsWith("#") && !line.startsWith("#HttpOnly_"))) continue;
      if (line.startsWith("#HttpOnly_")) line = line.slice(10);
      const parts = line.split(/\t+|\s{2,}/);
      if (parts.length >= 7) {
        const name = parts[5].trim();
        const value = parts[6].trim();
        if (name) pairs.push(`${name}=${value}`);
      }
    }
    return pairs.length > 0 ? pairs.join("; ") : undefined;
  } catch {
    return undefined;
  }
}

export interface CookieDiagnostic {
  loaded: boolean;
  path: string | null;
  count: number;
  loggedIn: boolean;
  hasLoginInfo: boolean;
  names: string[];
  statusMessage: string;
}

export function getCookieDiagnostic(): CookieDiagnostic {
  const filePath = getCookiesFilePath();
  if (!filePath || !existsSync(filePath)) {
    return {
      loaded: false,
      path: null,
      count: 0,
      loggedIn: false,
      hasLoginInfo: false,
      names: [],
      statusMessage: "No cookie file found. Required for datacenter IPs.",
    };
  }
  try {
    const content = readFileSync(filePath, "utf-8");
    const names = new Set<string>();
    for (const rawLine of content.split("\n")) {
      let line = rawLine.trim();
      if (!line || (line.startsWith("#") && !line.startsWith("#HttpOnly_"))) continue;
      if (line.startsWith("#HttpOnly_")) line = line.slice(10);
      const parts = line.split(/\t+|\s{2,}/);
      if (parts.length >= 7) {
        const name = parts[5].trim();
        if (name) names.add(name);
      }
    }
    const hasLoginInfo = names.has("LOGIN_INFO");
    const hasSapisid =
      names.has("SAPISID") ||
      names.has("__Secure-3PAPISID") ||
      names.has("__Secure-1PAPISID");
    const loggedIn = hasLoginInfo && hasSapisid;
    let statusMessage = "Valid authenticated YouTube session";
    if (names.size === 0) {
      statusMessage = "0 cookies parsed from file";
    } else if (!hasLoginInfo) {
      statusMessage =
        "LOGIN_INFO is missing! Cookies appear to be from google.com instead of youtube.com. Export from https://www.youtube.com while logged in.";
    } else if (!hasSapisid) {
      statusMessage =
        "SAPISID is missing! YouTube requires both LOGIN_INFO and SAPISID for authentication.";
    }

    return {
      loaded: true,
      path: filePath,
      count: names.size,
      loggedIn,
      hasLoginInfo,
      names: Array.from(names).slice(0, 15),
      statusMessage,
    };
  } catch {
    return {
      loaded: true,
      path: filePath,
      count: 0,
      loggedIn: false,
      hasLoginInfo: false,
      names: [],
      statusMessage: "Error reading cookie file",
    };
  }
}
