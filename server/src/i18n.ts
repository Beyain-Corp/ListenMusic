/**
 * Messages the server sends to people (errors, update progress), in every language the app speaks.
 * They are kept as keys and translated when sent, so each device gets its own language.
 */

export type Lang = "en" | "ta";
type Params = Record<string, string | number>;

const en = {
  invalidVideoId: "Invalid video ID.",
  emptyQuery: "Type something to search.",
  searchFailed: "Search is unavailable right now ({detail}). Try again in a moment.",
  missingTitle: "Give the song's title.",
  notBackup: "This file isn't a ListenMusic backup.",
  newerBackup: "This backup was made by a newer ListenMusic. Update the app to import it.",
  idMismatch: "The ID doesn't match.",
  tracksRequired: "Send a list of tracks.",
  invalidGenre: "Invalid genre.",
  invalidOffset: "Invalid position.",
  invalidArtist: "Invalid artist.",
  routeNotFound: "Route not found.",
  noFreePort: "No free port between {from} and {to}.",
  invalidTrack: "Invalid track.",
  playlistNotFound: "Playlist not found.",
  playlistNameRequired: "Give the playlist a name.",
  genresUnavailable: "Couldn't load the genres right now. Try again.",
  genreUnavailable: "Couldn't open this genre right now. Try again.",
  genreEmpty: "Nothing found for this genre.",
  artistUnavailable: "Couldn't open this artist right now. Try again.",
  artistNotFound: "Artist not found.",
  albumUnavailable: "Couldn't open this album right now. Try again.",
  albumNotFound: "Album not found.",
  invalidAlbum: "Invalid album.",
  ytdlpMissing: "yt-dlp wasn't found on this computer. Open Settings in ListenMusic to install it.",
  ytdlpTimeout: "yt-dlp took too long to answer.",
  ytdlpCantRun: "Couldn't run yt-dlp ({error}). Open Settings in ListenMusic.",
  botCheck: "YouTube is asking this connection to prove it's not a bot. If you're on a VPN, turn it off and try again.",
  videoUnavailable: "This video isn't available on YouTube.",
  ageRestricted: "Age-restricted video. It needs cookies from a signed-in account.",
  ytdlpFailed: "yt-dlp failed.",
  ytdlpOutdated: "{detail} YouTube may have changed: update yt-dlp in Settings.",
  noAudio: "No audio format available for this video.",
  noSdVideo: "This video has no combined SD version. Use HD.",
  streamRefused: "YouTube refused the stream (HTTP {status}). Try updating yt-dlp in Settings.",
  noWinget: "yt-dlp wasn't found and winget isn't available. Install it manually: https://github.com/yt-dlp/yt-dlp",
  installingYtdlp: "Installing yt-dlp",
  updatingYtdlp: "Updating yt-dlp",
  directUpdateFailed: "Direct update failed, trying winget",
  downloadingTools: "Downloading yt-dlp and Deno from GitHub",
  alreadyLatest: "Already on the latest version ({version})",
  ytdlpReady: "yt-dlp {version} is ready to use",
  updateFailed: "Couldn't update yt-dlp.",
  toolMissing: "{tool} wasn't found on this computer.",
  downloadFailed: "Downloading {tool} failed (HTTP {status}).",
  ffmpegPackage: "Unexpected FFmpeg package.",
};

export type MsgKey = keyof typeof en;

const ta: Record<MsgKey, string> = {
  invalidVideoId: "செல்லுபடியாகாத வீடியோ ஐடி.",
  emptyQuery: "தேட எதையாவது தட்டச்சு செய்யவும்.",
  searchFailed: "தேடல் தற்போது கிடைக்கவில்லை ({detail}). சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.",
  missingTitle: "பாடலின் தலைப்பை வழங்கவும்.",
  notBackup: "இந்தக் கோப்பு ListenMusic காப்புநகல் அல்ல.",
  newerBackup: "இந்தக் காப்புநகல் புதிய ListenMusic பதிப்பால் உருவாக்கப்பட்டது. இறக்குமதி செய்ய பயன்பாட்டைப் புதுப்பிக்கவும்.",
  idMismatch: "ஐடி பொருந்தவில்லை.",
  tracksRequired: "பாடல்களின் பட்டியலை அனுப்பவும்.",
  invalidGenre: "செல்லுபடியாகாத வகை.",
  invalidOffset: "செல்லுபடியாகாத நிலை.",
  invalidArtist: "செல்லுபடியாகாத கலைஞர்.",
  routeNotFound: "பாதை கிடைக்கவில்லை.",
  noFreePort: "{from} மற்றும் {to} இடையே போர்ட் எதுவும் காலியாக இல்லை.",
  invalidTrack: "செல்லுபடியாகாத பாடல்.",
  playlistNotFound: "பிளேலிஸ்ட் கிடைக்கவில்லை.",
  playlistNameRequired: "பிளேலிஸ்ட்டிற்கு ஒரு பெயரை வழங்கவும்.",
  genresUnavailable: "இசை வகைகளை இப்போது ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  genreUnavailable: "இந்த வகையை இப்போது திறக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  genreEmpty: "இந்த வகைக்கு எதுவும் கிடைக்கவில்லை.",
  artistUnavailable: "இந்தக் கலைஞரை இப்போது திறக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  artistNotFound: "கலைஞர் கிடைக்கவில்லை.",
  albumUnavailable: "இந்த ஆல்பத்தை இப்போது திறக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  albumNotFound: "ஆல்பம் கிடைக்கவில்லை.",
  invalidAlbum: "செல்லுபடியாகாத ஆல்பம்.",
  ytdlpMissing: "yt-dlp கிடைக்கவில்லை. நிறுவ ListenMusic அமைப்புகளைத் திறக்கவும்.",
  ytdlpTimeout: "yt-dlp பதிலளிக்க அதிக நேரம் எடுத்தது.",
  ytdlpCantRun: "yt-dlp-ஐ இயக்க முடியவில்லை ({error}). ListenMusic அமைப்புகளைத் திறக்கவும்.",
  botCheck: "YouTube இந்த இணைப்பை ஒரு ரோபோ அல்ல என்பதை உறுதிப்படுத்தக் கேட்கிறது. VPN-ல் இருந்தால் அணைத்துவிட்டு மீண்டும் முயற்சிக்கவும்.",
  videoUnavailable: "இந்த வீடியோ YouTube-ல் கிடைக்கவில்லை.",
  ageRestricted: "வயது வரம்பிற்குட்பட்ட வீடியோ. இதற்கு உள்நுழைந்த கணக்கின் குக்கீகள் தேவை.",
  ytdlpFailed: "yt-dlp தோல்வியடைந்தது.",
  ytdlpOutdated: "{detail} YouTube மாறியிருக்கலாம்: அமைப்புகளில் yt-dlp-ஐப் புதுப்பிக்கவும்.",
  noAudio: "இந்த வீடியோவிற்கு ஆடியோ வடிவம் எதுவும் கிடைக்கவில்லை.",
  noSdVideo: "இந்த வீடியோவிற்கு ஒருங்கிணைந்த SD பதிப்பு இல்லை. HD-ஐப் பயன்படுத்தவும்.",
  streamRefused: "YouTube ஸ்ட்ரீமை மறுத்துவிட்டது (HTTP {status}). அமைப்புகளில் yt-dlp-ஐப் புதுப்பிக்க முயற்சிக்கவும்.",
  noWinget: "yt-dlp கிடைக்கவில்லை, winget கிடைக்கவில்லை. கைமுறையாக நிறுவவும்: https://github.com/yt-dlp/yt-dlp",
  installingYtdlp: "yt-dlp நிறுவப்படுகிறது",
  updatingYtdlp: "yt-dlp புதுப்பிக்கப்படுகிறது",
  directUpdateFailed: "நேரடி புதுப்பித்தல் தோல்வியடைந்தது, winget மூலம் முயற்சிக்கிறது",
  downloadingTools: "GitHub-லிருந்து yt-dlp மற்றும் Deno பதிவிறக்கப்படுகிறது",
  alreadyLatest: "ஏற்கனவே சமீபத்திய பதிப்பில் உள்ளது ({version})",
  ytdlpReady: "yt-dlp {version} பயன்படுத்தத் தயாராக உள்ளது",
  updateFailed: "yt-dlp-ஐப் புதுப்பிக்க முடியவில்லை.",
  toolMissing: "{tool} கிடைக்கவில்லை.",
  downloadFailed: "{tool} பதிவிறக்கம் தோல்வியடைந்தது (HTTP {status}).",
  ffmpegPackage: "எதிர்பாராத FFmpeg தொகுப்பு.",
};

const CATALOG: Record<Lang, Record<MsgKey, string>> = { en, ta };

/** A message translated when it is sent: a key plus the values for its {placeholders}. */
export interface Msg {
  key: MsgKey;
  params?: Params;
}

/** Something to show a person: a message to translate, or text that needs none (tool output). */
export type Text = Msg | string;

export const msg = (key: MsgKey, params?: Params): Msg => ({ key, params });

export function tr(lang: Lang, text: Text): string {
  if (typeof text === "string") return text;
  return CATALOG[lang][text.key].replace(/\{(\w+)\}/g, (all, name: string) => String(text.params?.[name] ?? all));
}

export const isLang = (v: unknown): v is Lang => v === "en" || v === "ta";

/** The language a request asked for. The app always says; anything else (media elements, curl) gets English. */
export function langOf(req: { headers: Record<string, string | string[] | undefined> }): Lang {
  const asked = req.headers["x-listenmusic-lang"] ?? req.headers["x-musike-lang"];
  return isLang(asked) ? asked : "en";
}

/** The code YouTube Music uses for its own words (genre names, artist bios). */
export const youtubeLang = (lang: Lang) => (lang === "ta" ? "ta" : "en");
