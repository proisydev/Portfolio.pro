import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const SITE_URL = process.env.SITE_URL;
if (!SITE_URL) {
  console.error("SITE_URL is not defined in .env file");
  process.exit(1);
}

const BUILD_DIR = path.join(__dirname, "..", "dist"); // Adjust this path if your build directory is different

async function updateSitemaps() {
  try {
    const files = await fs.readdir(BUILD_DIR);
    const sitemapFiles = files.filter(
      (file) => file.startsWith("sitemap-") && file.endsWith(".xml"),
    );

    for (const file of sitemapFiles) {
      const filePath = path.join(BUILD_DIR, file);
      let content = await fs.readFile(filePath, "utf-8");

      // Replace all occurrences of https://mysite.com with the SITE_URL
      content = content.replace(/https:\/\/mysite\.com/g, SITE_URL);

      await fs.writeFile(filePath, content, "utf-8");
      console.log(`Updated ${file}`);
    }

    console.log("All sitemaps have been updated successfully.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

updateSitemaps();
