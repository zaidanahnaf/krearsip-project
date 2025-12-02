# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- DB (Supabase) ---
    DATABASE_URL: str

    # --- Admin ---
    ADMIN_API_TOKEN: str = ""

    # --- JWT ---
    JWT_SECRET: str
    JWT_ISS: str = "creaproof"
    JWT_AUD: str = "creaproof-client"
    JWT_EXPIRE_MIN: int = 120
    JWT_ALGORITHM: str = "HS256"

    # --- SIWE ---
    SIWE_DOMAIN: str = "localhost"
    SIWE_URI: str = "http://localhost:3000"

    # --- RPC On-chain (untuk sync ke Sepolia) ---
    SEPOLIA_RPC: str
    KREARSIP_V2_ADDRESS: str
    REGISTRAR_PRIVATE_KEY: str
    REGISTRAR_ADDRESS: str
    CHAIN_ID: int = 11155111  # Sepolia


    # Pydantic v2 style: ganti class Config dengan model_config
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",  # kalau ada variable env lain, nggak bikin error
    )


settings = Settings()
