// Lightweight i18n. We ship Arabic + English catalogues and resolve the
// current locale from device settings (expo-localization). Users can override
// from the Settings screen; override is persisted in SecureStore.
//
// Why not react-i18next: smaller surface, no runtime config, trivial to port
// strings between web (lib/i18n.ts) and mobile.

import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { I18nManager } from 'react-native';
import en from '../i18n/en.json';
import ar from '../i18n/ar.json';

export type Locale = 'en' | 'ar';
export const SUPPORTED: Locale[] = ['en', 'ar'];
const CATALOGUES = { en, ar } as const;
const PREF_KEY = 'constructhub.locale';

let current: Locale = 'en';

export function direction(locale: Locale = current): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function detectDefaultLocale(): Locale {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return code === 'ar' ? 'ar' : 'en';
}

export async function initLocale(): Promise<Locale> {
  try {
    const saved = (await SecureStore.getItemAsync(PREF_KEY)) as Locale | null;
    current = saved && SUPPORTED.includes(saved) ? saved : detectDefaultLocale();
  } catch {
    current = detectDefaultLocale();
  }
  applyDirection();
  return current;
}

export async function setLocale(next: Locale): Promise<void> {
  if (!SUPPORTED.includes(next)) return;
  await SecureStore.setItemAsync(PREF_KEY, next);
  current = next;
  applyDirection();
}

function applyDirection() {
  const shouldRtl = direction(current) === 'rtl';
  if (I18nManager.isRTL !== shouldRtl) {
    I18nManager.allowRTL(shouldRtl);
    I18nManager.forceRTL(shouldRtl);
    // Note: on native, this takes effect after reload. Settings screen asks
    // the user to restart.
  }
}

export function getLocale(): Locale {
  return current;
}

type Dict = Record<string, string>;

export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = (CATALOGUES[current] as Dict) ?? en;
  const fallback = (en as Dict)[key];
  let text = dict[key] ?? fallback ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}
