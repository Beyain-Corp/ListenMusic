import { create } from "zustand";
import { desktop } from "../lib/desktop";
import { en, type Messages } from "./en";
import { ta } from "./ta";

export type { Messages };
export type Lang = "en" | "ta";

/** Each language named in itself, as language pickers do. */
export const LANGUAGES: { id: Lang; name: string }[] = [
  { id: "en", name: "English" },
  { id: "ta", name: "தமிழ்" },
];

const MESSAGES: Record<Lang, Messages> = { en, ta };
const KEY = "listenmusic:lang";
const LEGACY_KEY = "musike:lang";

export const isLang = (v: unknown): v is Lang => v === "en" || v === "ta";

/** ListenMusic speaks English until the user picks another language in Settings. */
function readLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* private mode */
  }
  return "en";
}

function apply(lang: Lang) {
  document.documentElement.lang = lang;
  // The desktop shell shows its splash screen before the web app loads: tell it which language to use.
  desktop?.setLanguage?.(lang);
}

interface I18nState {
  lang: Lang;
  t: Messages;
  setLang: (lang: Lang) => void;
}

const initial = readLang();
apply(initial);

export const useI18n = create<I18nState>((set) => ({
  lang: initial,
  t: MESSAGES[initial],
  setLang: (lang) => {
    apply(lang);
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* private mode */
    }
    set({ lang, t: MESSAGES[lang] });
  },
}));

/** The current language's messages; re-renders when the language changes. */
export const useT = () => useI18n((s) => s.t);

/** For code outside React components (stores, the player): read at the moment of use. */
export const getT = () => useI18n.getState().t;
export const getLang = () => useI18n.getState().lang;
