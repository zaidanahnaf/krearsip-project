from pydantic import BaseModel, Field

class NonceReq(BaseModel):
    alamat_wallet: str = Field(..., description="0x... address")

class NonceRes(BaseModel):
    nonce: str

class VerifyReq(BaseModel):
    alamat_wallet: str
    message: str  # SIWE message
    signature: str

class TokenRes(BaseModel):
    access_token: str
    token_type: str = "bearer"

class MeResponse(BaseModel):
    id: str
    wallet_address: str
    name: str | None = None
    peran: str | None = None