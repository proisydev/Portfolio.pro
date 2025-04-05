// src/utils/i18n/locale.js

// List of authorized languages
export const allowedLocales = ["en", "fr"];

/**
 * Generates a localized URL for a given route.
 * @param {string} locale - The locale (e.g. “en”, “fr”)
 * @param {string} path - The route (e.g. “/contact”)
 * @returns {string} URL generated
 */
export function getLocalizedUrl(locale, path = "/") {
  // If locale is not enabled, use default language
  if (!allowedLocales.includes(locale)) {
    locale = allowedLocales[0]; // for example "en"
  }

  // Make sure path begins with “/”.
  const normalizedPath = path.startsWith("/") ? path : "/" + path;
  return `/${locale}${normalizedPath === "/" ? "" : normalizedPath}`;
}

/**
 * Validates that the locale is authorized.
 * @param {string} locale - The locale to test
 * @returns {boolean}
 */
export function isValidLocale(locale) {
  return allowedLocales.includes(locale);
}

export function getAlternateLocales(currentLocale) {
  return allowedLocales.filter((locale) => locale !== currentLocale);
}

export function getLocalizedHref(currentPath, newLang) {
  // Replaces the language segment at the start of the URL (/en or /fr) with the new code
  return currentPath.replace(/^\/(fr|en)/, `/${newLang}`);
}
