import { accessSync, constants, copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Folder of the server package (bundled builds pass every path through env instead).
const root = typeof import.meta.url === "string" ? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") : process.cwd();

export const config = {
  port: Number(process.env.PORT ?? 4180),
  host: process.env.HOST ?? "0.0.0.0",
  /** Explicit yt-dlp executable. When unset it is located automatically (see tools.ts). */
  ytdlpPath: process.env.YTDLP_PATH || null,
  // Extra yt-dlp flags, e.g. YTDLP_EXTRA_ARGS="--cookies-from-browser firefox"
  ytdlpExtraArgs: (process.env.YTDLP_EXTRA_ARGS ?? "").split(" ").filter(Boolean),
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
  location: process.env.LISTENMUSIC_LOCATION ?? process.env.MUSIKE_LOCATION ?? "BR",
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
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const parts = line.split("\t");
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
