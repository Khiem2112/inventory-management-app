# app/schemas/user.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.base import AutoReadSchema, AutoWriteSchema

# Base schema for common user attributes
class UserBase(BaseModel):
    username: str = Field(..., max_length=255, description='username that use to register')
    name: Optional[str] = Field(None, max_length=255) # Use Optional[str] for clarity when it can be None
    phone: Optional[str] = Field(None, max_length=255) # Use Optional[str] for clarity when it can be None
    role_id: int = Field(...) # Make RoleId required in base if NOT NULL in DB

# Schema for creating a new user (client sends this)
class UserCreate(UserBase, AutoWriteSchema):
    password: str = Field(..., max_length=255, min_length=8, description='password') # Added min_length for password strength
class UserLogin(AutoWriteSchema):
    username: str = Field(..., max_length=255, description='username that use to login')
    password: Optional[str] = Field(None, max_length=255, description='password to login')
# Schema for updating an existing user (all fields optional for partial update)
class UserUpdate(AutoWriteSchema): # Inherit from BaseModel directly to avoid UserBase's required fields for updates
    # Only include fields that can be updated. Username is often immutable.
    # If Username can be updated, make it Optional and allow None.
    username: Optional[str] = Field(None, max_length=255, description='username that use to register')
    name: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=255)
    role_id: Optional[int] = Field(None) # RoleId can be optional for update
    password: Optional[str] = Field(None, min_length=8) # Allow password update if needed, but often separate API
    def apply_to_orm(self, orm_obj, pwd_context=None):
        # 1. Run the standard PascalCase conversion (username -> Username)
        orm_obj = super().apply_to_orm(orm_obj)
        
        # 2. Handle the specific mismatch (password -> PasswordHash)
        if self.password and pwd_context:
            orm_obj.PasswordHash = pwd_context.hash(self.password)
        return orm_obj

# Schema for user data as stored in the database (including ID and internal fields)
class UserInDB( UserBase,AutoReadSchema): # Inherit from UserBase as it contains core required fields
    user_id: int = Field(...)
    password_hash: str = Field(...)# The hashed password from the DB (never send directly to frontend)
    create_date: datetime = Field(...) # From the DB

    class Config:
        from_attributes = True

# 4. PUBLIC (DB -> Output)
class UserPublic(UserBase, AutoReadSchema): # Inherit from UserBase
    user_id: int = Field(...)
    create_date: datetime = Field(...)

    class Config:
        from_attributes = True
        
    