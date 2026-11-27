import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadJSON, saveJSON } from '../lib/storage';
import { HI } from './hi';

export type Lang = 'en' | 'hi';
export const LANG_KEY = 'language-v1';

// The current language is also kept in a plain variable so non-component code (status labels, voice replies, share text) can translate.
let current: Lang = 'en';
export const getLang = () => current;

/** English text is the key. Hindi comes from the dictionary; anything missing falls back to English. {name} placeholders are filled from vars. */
export function tr(key: string, vars?: Record<string, string | number>): string {
  let s = current === 'hi' ? HI[key] ?? key : key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return s;
}

type Ctx = { lang: Lang; chosen: boolean; ready: boolean; setLang: (l: Lang) => void; t: typeof tr };
const LangContext = createContext<Ctx>({ lang: 'en', chosen: true, ready: true, setLang: () => {}, t: tr });
export const useLang = () => useContext(LangContext);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [chosen, setChosen] = useState(true);
  const [ready, setReady] = useState(false);
  current = lang; // set while rendering so every child below sees the new language
  useEffect(() => {
    loadJSON<Lang | null>(LANG_KEY, null).then((l) => {
      if (l === 'en' || l === 'hi') { current = l; setLangState(l); setChosen(true); } else setChosen(false);
      setReady(true);
    });
  }, []);
  const value = useMemo<Ctx>(() => ({
    lang, chosen, ready, t: tr,
    setLang: (l) => { current = l; setLangState(l); setChosen(true); saveJSON(LANG_KEY, l); },
  }), [lang, chosen, ready]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const LANGUAGES: { key: Lang; label: string }[] = [{ key: 'en', label: 'English' }, { key: 'hi', label: 'हिन्दी' }];

const HI_DAYS = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const HI_DAYS_SHORT = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const dayName = (d: number, short = false) => (current === 'hi' ? (short ? HI_DAYS_SHORT : HI_DAYS)[d] : short ? EN_DAYS[d].slice(0, 3) : EN_DAYS[d]);

/** Minutes after midnight as a clock time: "6 pm" in English, "शाम 6 बजे" in Hindi. */
export function clock(min: number): string {
  const h24 = Math.floor(min / 60) % 24, m = min % 60;
  if (current === 'hi') {
    const h = h24 % 12 === 0 ? 12 : h24 % 12;
    const part = h24 < 4 ? 'रात' : h24 < 12 ? 'सुबह' : h24 < 16 ? 'दोपहर' : h24 < 19 ? 'शाम' : 'रात';
    return `${part} ${h}${m ? `:${String(m).padStart(2, '0')}` : ''} बजे`;
  }
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h24 < 12 ? 'am' : 'pm'}`;
}
