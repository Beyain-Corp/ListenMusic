import { existsSync, readFileSync } from "node:fs";
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
 * Returns path to cookies file if provided explicitly in YTDLP_EXTRA_ARGS
 * or if cookies.txt exists in the data directory or app root.
 */
export function getCookiesFilePath(): string | null {
  for (let i = 0; i < config.ytdlpExtraArgs.length; i++) {
    const arg = config.ytdlpExtraArgs[i];
    if (arg === "--cookies" && i + 1 < config.ytdlpExtraArgs.length) {
      return config.ytdlpExtraArgs[i + 1];
    }
    if (arg.startsWith("--cookies=")) {
      return arg.slice(10);
    }
  }
  const dataCookie = path.join(config.dataDir, "cookies.txt");
  if (existsSync(dataCookie)) return dataCookie;
  const rootCookie = path.join(root, "cookies.txt");
  if (existsSync(rootCookie)) return rootCookie;
  return null;
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
