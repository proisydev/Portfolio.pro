import en from "./translate/en.json";
import fr from "./translate/fr.json";

const translations = { en, fr };

/**
 * Factory function that returns a translation function
 * based on the supplied locale.
 */
export function createTranslator(locale) {
  return function t(key) {
    return (
      key.split(".").reduce((obj, k) => obj?.[k], translations[locale]) || key
    );
  };
}
