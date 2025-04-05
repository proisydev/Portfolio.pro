import crypto from "crypto";

function generateSecretKey(length = 32) {
  return crypto.randomBytes(length).toString("hex");
}

const secretKey = generateSecretKey();
console.log("Your new secret key:", secretKey);

console.log("\nTo use this key:");
console.log("1. Copy the key above");
console.log(
  "2. Replace the existing secret key in your files (cv-download.js and cv-upload.js)",
);
console.log(
  "3. Ensure you keep this key secret and do not commit it to version control",
);
