import mysql from "mysql2/promise";

// Création d'un pool de connexions vers la base MySQL distante
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  port: Number(process.env.MYSQL_PORT),
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = "https://api-free.deepl.com/v2";
const AUTO_TRANSLATE_ENABLED = process.env.AUTO_TRANSLATE_ENABLED || "true";

/**
 * Ensures that the translations table exists in the database.
 * The table is created with charset utf8mb4 and collation utf8mb4_general_ci.
 */
async function ensureTranslationsTableExists(): Promise<void> {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS translations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        translated_text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
        source_lang VARCHAR(5) NOT NULL,
        target_lang VARCHAR(5) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`,
    );
    console.log("✅ [translate] Ensured translations table exists.");
  } catch (err) {
    console.error(
      "❌ [translate] Error ensuring translations table exists:",
      err,
    );
  }
}

interface CachedTranslation {
  translated_text: string;
  created_at: Date;
}

/**
 * Retrieves a stored translation from the database if it exists.
 *
 * @param {string} text - The original text.
 * @param {string} sourceLang - The source language code (e.g., "EN").
 * @param {string} targetLang - The target language code (e.g., "FR").
 * @returns {Promise<CachedTranslation | null>} - The translated text and timestamp if found; otherwise, null.
 */
async function getStoredTranslation(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<CachedTranslation | null> {
  try {
    const [rows]: any[] = await pool.query(
      `SELECT translated_text, created_at FROM translations 
       WHERE original_text = ? AND source_lang = ? AND target_lang = ? 
       LIMIT 1`,
      [text, sourceLang.toUpperCase(), targetLang.toUpperCase()],
    );
    if (rows.length > 0) {
      console.log("✅ [translate] Using stored translation from database.");
      return {
        translated_text: rows[0].translated_text,
        created_at: rows[0].created_at,
      };
    }
    return null;
  } catch (err) {
    console.error("❌ [translate] Error fetching stored translation:", err);
    return null;
  }
}

/**
 * Stores a new translation in the database.
 *
 * @param {string} text - The original text.
 * @param {string} translatedText - The translated text.
 * @param {string} sourceLang - The source language code.
 * @param {string} targetLang - The target language code.
 * @returns {Promise<void>}
 */
async function storeTranslation(
  text: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO translations (original_text, translated_text, source_lang, target_lang, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [
        text,
        translatedText,
        sourceLang.toUpperCase(),
        targetLang.toUpperCase(),
      ],
    );
    console.log("✅ [translate] Translation stored in database.");
  } catch (err) {
    console.error("❌ [translate] Error storing translation:", err);
  }
}

/**
 * Automatically translates a text using the DeepL API.
 *
 * This function first checks a flag to see if auto translation is enabled.
 * It then ensures the translations table exists. Afterwards, it checks if a translation
 * for the given text already exists in the database. If found, it returns the cached translation
 * (with the caching timestamp). Otherwise, it checks the current character usage via the `/usage`
 * endpoint of DeepL, and if within quota, proceeds to translate the text, stores the result in the database,
 * and returns the translated text.
 *
 * @param {string} text - The text to translate.
 * @param {string} sourceLang - The source language code (e.g., "EN").
 * @param {string} targetLang - The target language code (e.g., "FR").
 * @returns {Promise<string>} - The translated text with a notice, or the original text in case of error/quota exceeded.
 */
export async function autoTranslate(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  try {
    // If the translation function is disabled, return the original text.
    if (AUTO_TRANSLATE_ENABLED.toLowerCase() !== "true") {
      console.warn("⚠️ [translate] Auto translation is disabled.");
      return text;
    }

    // Ensure the translations table exists before proceeding.
    await ensureTranslationsTableExists();

    if (!text) {
      throw new Error("❌ [translate] The text is empty or undefined");
    }

    // Attempt to retrieve a stored translation
    const cached = await getStoredTranslation(text, sourceLang, targetLang);
    if (cached) {
      const cachedDate = new Date(cached.created_at).toLocaleString();
      return `${cached.translated_text} 
<span class="hidden">Translation cached on: ${cachedDate}</span>`;
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

    // Proceed with translation using DeepL API
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

    // Store the translation for future use
    await storeTranslation(text, translatedText, sourceLang, targetLang);

    return `${translatedText}`;
  } catch (error) {
    console.error("❌ [translate] Error during translation:", error);
    return text;
  }
}
