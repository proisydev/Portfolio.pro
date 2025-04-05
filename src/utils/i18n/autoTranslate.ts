/**
 * Automatically translates a text using the DeepL API.
 *
 * This function first checks the current character usage via the `/usage` endpoint.
 * If the limit is reached or exceeded, it returns the original text without translating.
 * Otherwise, it proceeds with translating the text and appends a notice.
 *
 * @param {string} text - The text to translate.
 * @param {string} sourceLang - The source language code (e.g., "EN").
 * @param {string} targetLang - The target language code (e.g., "FR").
 * @returns {Promise<string>} - The translated text with a notice, or the original text in case of error or quota exceeded.
 */
export async function autoTranslate(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
  const DEEPL_API_URL = "https://api-free.deepl.com/v2";

  try {
    if (!text) {
      throw new Error("❌ [translate] The text is empty or undefined");
    }

    // Check current character usage
    const usageResponse = await fetch(`${DEEPL_API_URL}/usage`, {
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      },
    });

    if (!usageResponse.ok) {
      throw new Error(
        `❌ [translate] HTTP error ${usageResponse.status}: ${usageResponse.statusText}`,
      );
    }

    const usageData = await usageResponse.json();
    const { character_count, character_limit } = usageData;

    // Ensure translation doesn't exceed the limit
    if (character_count + text.length > character_limit) {
      console.warn(
        "⚠️ [translate] Character limit reached. Translation canceled.",
      );
      return text;
    }

    // Proceed with translation
    const translateResponse = await fetch(`${DEEPL_API_URL}/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [text],
        source_lang: sourceLang.toUpperCase(),
        target_lang: targetLang.toUpperCase(),
      }),
    });

    if (!translateResponse.ok) {
      throw new Error(
        `❌ [translate] HTTP error ${translateResponse.status}: ${translateResponse.statusText}`,
      );
    }

    const translateData = await translateResponse.json();
    const translatedText = translateData.translations[0]?.text;

    if (!translatedText) {
      throw new Error("❌ [translate] Invalid translation data received");
    }

    console.log("✅ [translate] Translation successful");
    return `${translatedText} [Auto-Traduction par DeepL]`;
  } catch (error) {
    console.error("❌ [translate] Error during translation:", error);
    return text;
  }
}
