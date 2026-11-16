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
    "https://raw.githubusercontent.com/MusicPlay/listenmusic/main/mobile/streaming.json",
  /** HTTP for youtubei.js; the platform's own fetch here (the Android app passes its native one). */
  fetch: undefined as typeof fetch | undefined,
};
