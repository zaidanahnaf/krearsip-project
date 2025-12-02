from datetime import datetime
from app.db.models import Base
from sqlalchemy import Column, String, Text, BigInteger, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
import uuid

class User(Base):
    __tablename__ = "pengguna"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama = Column(String(255), nullable=True)
    email = Column(String(255), nullable=False, unique=True)
    wallet_address = Column(String(42), nullable=True, unique=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)