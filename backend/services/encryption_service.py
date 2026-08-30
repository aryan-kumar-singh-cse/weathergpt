"""
WeatherGPT Encryption Service
Secure encryption/decryption for storing user API keys
"""

import os
import base64
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    Service for encrypting and decrypting sensitive user data (API keys).
    Uses Fernet (symmetric encryption) with a server secret.
    """

    def __init__(self):
        # Get encryption key from environment or generate one
        secret = os.getenv("API_SECRET_KEY", "default-secret-key-change-in-production")

        # Derive a proper encryption key from the secret
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'weathergpt_salt_v1',  # Fixed salt for consistency
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
        self.cipher = Fernet(key)

        logger.info("Encryption service initialized")

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a string (e.g., API key).

        Args:
            plaintext: String to encrypt

        Returns:
            Base64-encoded encrypted string
        """
        if not plaintext:
            return None

        try:
            encrypted_bytes = self.cipher.encrypt(plaintext.encode())
            return encrypted_bytes.decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise

    def decrypt(self, encrypted: str) -> str:
        """
        Decrypt an encrypted string.

        Args:
            encrypted: Base64-encoded encrypted string

        Returns:
            Original plaintext string
        """
        if not encrypted:
            return None

        try:
            decrypted_bytes = self.cipher.decrypt(encrypted.encode())
            return decrypted_bytes.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise


# Global instance
encryption_service = EncryptionService()


if __name__ == "__main__":
    # Test the service
    test_key = "sk-test-api-key-12345"

    encrypted = encryption_service.encrypt(test_key)
    print(f"Encrypted: {encrypted}")

    decrypted = encryption_service.decrypt(encrypted)
    print(f"Decrypted: {decrypted}")

    assert test_key == decrypted, "Encryption/decryption mismatch!"
    print("✓ Encryption service working correctly")
