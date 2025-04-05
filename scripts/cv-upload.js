import fs from "fs";
import path from "path";
import crypto from "crypto";
import FormData from "form-data";
import axios from "axios";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
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
  phpUrl: `https://api.${SITE_URL}/cv_upload.php`,
  filePath: path.join(process.cwd(), "public", "docs", "curriculum_vitae.pdf"),
  secretKey: secretKey,
};

function generateToken() {
  const timestamp = Date.now().toString();
  const hash = crypto
    .createHmac("sha256", config.secretKey)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${hash}`;
}

async function uploadFile() {
  const token = generateToken();
  const form = new FormData();
  form.append("token", token);
  form.append("cv_file", fs.createReadStream(config.filePath));

  try {
    const response = await axios.post(config.phpUrl, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    console.log("Server response :", response.data);
  } catch (error) {
    console.error("Upload error :", error.message);
  }
}

uploadFile();
