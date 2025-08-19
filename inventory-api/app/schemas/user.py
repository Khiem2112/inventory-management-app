# app/schemas/user.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Base schema for common user attributes
class UserBase(BaseModel):
    Username: str = Field(..., max_length=255, description='username that use to register')
    Name: Optional[str] = Field(None, max_length=255) # Use Optional[str] for clarity when it can be None
    Phone: Optional[str] = Field(None, max_length=255) # Use Optional[str] for clarity when it can be None
    RoleId: int = Field(...) # Make RoleId required in base if NOT NULL in DB

# Schema for creating a new user (client sends this)
class UserCreate(UserBase):
    Password: str = Field(..., max_length=255, min_length=8, description='password') # Added min_length for password strength
class UserLogin(BaseModel):
    Username: str = Field(..., max_length=255, description='username that use to login')
    Password: Optional[str] = Field(None, max_length=255, description='password to login')
# Schema for updating an existing user (all fields optional for partial update)
class UserUpdate(BaseModel): # Inherit from BaseModel directly to avoid UserBase's required fields for updates
    # Only include fields that can be updated. Username is often immutable.
    # If Username can be updated, make it Optional and allow None.
    Username: Optional[str] = Field(None, max_length=255, description='username that use to register')
    Name: Optional[str] = Field(None, max_length=255)
    Phone: Optional[str] = Field(None, max_length=255)
    RoleId: Optional[int] = Field(None) # RoleId can be optional for update
    Password: Optional[str] = Field(None, min_length=8) # Allow password update if needed, but often separate API

# Schema for user data as stored in the database (including ID and internal fields)
class UserInDB(UserBase): # Inherit from UserBase as it contains core required fields
    UserId: int
    PasswordHash: str # The hashed password from the DB (never send directly to frontend)
    CreateDate: datetime # From the DB

    class Config:
        from_attributes = True

# Schema for public display (e.g., when fetching a list of users)
# This omits sensitive data like PasswordHash
class UserPublic(UserBase): # Inherit from UserBase
    UserId: int
    CreateDate: datetime

    class Config:
        from_attributes = True
        
    