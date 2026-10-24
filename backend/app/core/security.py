import datetime
from typing import Any, Dict, Optional, Union
import bcrypt
import jwt
from cryptography.fernet import Fernet
from app.core.config import settings

# Initialize Fernet cipher
try:
    _fernet = Fernet(settings.ENCRYPTION_KEY.encode())
except Exception:
    # Fallback to a newly generated valid key if the setting is malformed
    _fallback_key = Fernet.generate_key()
    _fernet = Fernet(_fallback_key)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(subject: Union[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return decoded
    except jwt.PyJWTError:
        return None

def encrypt_secret(secret_text: str) -> str:
    """Encrypt sensitive OAuth tokens or API keys at rest."""
    if not secret_text:
        return ""
    return _fernet.encrypt(secret_text.encode('utf-8')).decode('utf-8')

def decrypt_secret(cipher_text: str) -> str:
    """Decrypt sensitive OAuth tokens or API keys."""
    if not cipher_text:
        return ""
    try:
        return _fernet.decrypt(cipher_text.encode('utf-8')).decode('utf-8')
    except Exception:
        return ""
