import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const SITE_URL = process.argv[2] || process.env.SITE_URL;
if (!SITE_URL) {
  console.error("SITE_URL is not defined in .env file or as an argument");
  process.exit(1);
}

const vercelJsonPath = path.join(__dirname, "..", "vercel.json");

async function createVercelJson() {
  try {
    const vercelContent = {
      redirects: [
        {
          source: "/assets/images/open-graph/:title*.:path*.png",
          destination: "/api/image-open-graph?title=:title*&page=:path*",
        },
        {
          source: "/_view-source",
          destination: `https://redirect.${SITE_URL}/vercel/view-source?ref=proisy.me`,
          permanent: false,
        },
        {
          source: "/_hostinger",
          destination: `https://redirect.${SITE_URL}/hostinger/referral-code?ref=proisy.me`,
          permanent: false,
        },
        {
          source: "/_vercel",
          destination: `https://redirect.${SITE_URL}/vercel?ref=proisy.me`,
          permanent: false,
        },
        {
          source: "/_cv",
          destination: `https://${SITE_URL}/docs/curriculum_vitae.pdf`,
          permanent: false,
        },
        {
          source: "/_github/:username*/:path*",
          destination: "https://github.com/:username*/:path*?ref=proisy.me",
          permanent: false,
        },
        {
          source: "/_github-io/:username/:path*",
          destination: "https://:username.github.io/:path*?ref=proisy.me",
          permanent: false,
        },
        {
          source: "/projets",
          destination: `https://${SITE_URL}/projects`,
          permanent: false,
        },
      ],
    };

    await fs.writeFile(
      vercelJsonPath,
      JSON.stringify(vercelContent, null, 2),
      "utf-8",
    );
    console.log(`Created vercel.json`);
    console.log("vercel.json has been created successfully.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

createVercelJson();
