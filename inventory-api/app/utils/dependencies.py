# app/dependencies.py

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.user_model import User as UserORM
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from typing import TypeVar, Type
import os
SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES'))
# This tells FastAPI to expect a token in the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/get-token")
def create_access_token (input_data: dict, time_delta: timedelta |None = None):
  # make a copy of input data
  input_data_copy = input_data.copy()
  # create a time delta
  if time_delta:
    expired_time = datetime.now(tz = timezone.utc) + time_delta
  else:
    expired_time = datetime.now(tz = timezone.utc) + timedelta(minutes=15)
  # Merge two dicts
  to_encoded_data = {**input_data_copy, **{'exp':expired_time}}
  # Generate access token
  access_token = jwt.encode(to_encoded_data, SECRET_KEY, ALGORITHM)
  return access_token
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get the user object from the database using the username from the token
    user = db.query(UserORM).filter(UserORM.Username == username).one_or_none()
    if user is None:
        raise credentials_exception
    return user

class FormBody:
    def __init__(self, model: Type[BaseModel]):
        self.model = model

    async def __call__(self, request: Request):
        try:
            data = await request.form()
            data_dict = data.as_dict()
            return self.model(**data_dict)
        except Exception as e:
            raise e