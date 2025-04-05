import https from "https";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { exit } from "process";

// Configuration des chemins et environnement
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const secretKey = process.argv[2] || process.env.CV_API_SECRET_KEY;
if (!secretKey) {
  console.error("secretKey is not defined in .env file or as an argument");
  process.exit(1);
}

const SITE_URL = process.argv[3] || process.env.SITE_URL;
if (!SITE_URL) {
  console.error("SITE_URL is not defined in .env file or as an argument");
  process.exit(1);
}

const config = {
  phpUrl: `https://api.${SITE_URL}/cv_download.php`,
  outputPath: path.join(
    process.cwd(),
    "public",
    "docs",
    "curriculum_vitae.pdf",
  ),
  secretKey: `${secretKey}`,
};

// Génération du token
function generateToken() {
  const timestamp = Date.now().toString();
  const hash = crypto
    .createHmac("sha256", config.secretKey)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${hash}`;
}

// Fonction de téléchargement
function downloadFile() {
  const token = generateToken();
  const url = `${config.phpUrl}?token=${encodeURIComponent(token)}`;
  const options = {
    headers: {
      "User-Agent": "cv-downloader", // Ajout d'un user-agent minimal
    },
  };

  https
    .get(url, options, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(config.outputPath);
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          console.log("Download successfully completed.");
          exit(0);
        });
      } else {
        console.error(
          `Error while downloading. Status code : ${response.statusCode}.`,
        );
        response.setEncoding("utf8");
        response.on("data", (chunk) => console.error(chunk));
        exit(1);
      }
    })
    .on("error", (err) => {
      console.error("Query error:", err.message);
      exit(1);
    });

  console.log("Generated token:", generateToken());
}

downloadFile();
