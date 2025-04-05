import crypto from "crypto";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, ".env") });

const password = process.argv[2];
const iterations = parseInt(process.env.PWD_HASH_ITERATIONS, 10) || 100000;

if (!password) {
  console.error("Please provide a password as an argument");
  process.exit(1);
}

// Function to convert ArrayBuffer to hex string
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Generate a random salt
const salt = crypto.randomBytes(16).toString("hex");

// Derive key using PBKDF2
crypto.pbkdf2(password, salt, iterations, 32, "sha256", (err, derivedKey) => {
  if (err) throw err;

  const hash = bufferToHex(derivedKey);

  console.log("Here are your environment variables to update in .env:");
  console.log(`HASHED_PASSWORD="${hash}"`);
  console.log(`PWD_HASH_SALT="${salt}"`);
  console.log(`PWD_HASH_ITERATIONS=${iterations}`);
  console.log("\nMake sure to update these values in your .env file.");
});
