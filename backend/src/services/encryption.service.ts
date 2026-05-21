import crypto from "crypto";
import { logger } from "../utils/logger";

export class EncryptionService {
  private algorithm = "aes-256-gcm";
  private secretKey: Buffer;

  constructor() {
    const key = process.env.AES_SECRET_KEY;
    if (!key) {
      throw new Error("AES_SECRET_KEY not configured");
    }

    // Ensure key is 32 bytes (256 bits) for AES-256
    this.secretKey = crypto.createHash("sha256").update(key).digest();
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(data: string): string {
    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

      // Encrypt the data
      let encrypted = cipher.update(data, "utf8", "hex");
      encrypted += cipher.final("hex");

      // Get authentication tag
      const authTag = (cipher as any).getAuthTag();

      // Combine IV, auth tag, and encrypted data
      const result = {
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
        data: encrypted,
      };

      return JSON.stringify(result);
    } catch (error: any) {
      logger.error("Encryption error:", error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: string): string {
    try {
      // Parse encrypted data
      const { iv, authTag, data } = JSON.parse(encryptedData);

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.secretKey,
        Buffer.from(iv, "hex"),
      );

      // Set authentication tag
      (decipher as any).setAuthTag(Buffer.from(authTag, "hex"));

      // Decrypt the data
      let decrypted = decipher.update(data, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error: any) {
      logger.error("Decryption error:", error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a random salt
   */
  generateSalt(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Hash data using SHA-256
   */
  hash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Generate a secure random string
   */
  generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Verify hash
   */
  verifyHash(data: string, hash: string): boolean {
    const computedHash = this.hash(data);
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  }
}
