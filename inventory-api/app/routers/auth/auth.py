from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import sqlalchemy
from sqlalchemy.exc import IntegrityError
from app.database.connection import get_db
from app.database.user_model import User as UserORM, RefreshToken as RefreshTokenORM
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.schemas.user import UserLogin
from app.schemas.refresh_token import RefreshToken
from app.utils.random_string import generate_random_string
from app.utils.dependencies import get_current_user
import os
import secrets
# from app.schemas.user import UserLogin
# Declare the router
router = APIRouter(
  prefix='/auth',
  tags =['auth']
)
# Declare the Encrypt model
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") 
# The JWT settings
# Automatically generate a token
SECRET_KEY = os.getenv('SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES'))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv('REFRESH_TOKEN_EXPIRE_DAYS'))

# Create the JWT access token, those steps involved:
# Merge the main data (like user data) with time data (expired time)
# Create access token with Secret key and type of algorithm

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

def create_refresh_token(user_id: int):
  jti = secrets.token_hex(18)
  expires_delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
  expires_at = datetime.now(timezone.utc) + expires_delta

  to_encode = {"UserId": user_id, "Jti": jti, "exp": expires_at}
  refresh_token = jwt.encode(to_encode, SECRET_KEY, ALGORITHM)
  return refresh_token, jti, expires_at

@router.post('/login')
def login_user(UserLogin: UserLogin, db:Session = Depends(get_db)):
  # Get to user first
  try:
    Username = UserLogin.Username
    Password = UserLogin.Password
    query  = db.query(UserORM).filter(UserORM.Username ==Username)
    found_user = query.one_or_none()
    # Check if user exists
    if not found_user:
      raise HTTPException(
              status_code=status.HTTP_401_UNAUTHORIZED,
              detail="Incorrect username or password",
          )
    if not pwd_context.verify(Password, found_user.PasswordHash):
      raise HTTPException(
              status_code=status.HTTP_401_UNAUTHORIZED,
              detail="Incorrect username or password",
          )
    # Create access token and refresh token for user
    
    ## access token
    access_token_payload = {
            'sub': found_user.Username,
            'user_id': found_user.UserId}
    time_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(input_data= access_token_payload, time_delta=time_delta)
    
    refresh_token, refresh_token_jti, expires_at = create_refresh_token(user_id=found_user.UserId)
    # Save new refresh token to database
    new_refresh_token_record = RefreshTokenORM (
      Jti = refresh_token_jti,
      TokenHash = refresh_token,
      UserId = found_user.UserId,
      ExpiresAt = expires_at
    )
    db.add(new_refresh_token_record)
    db.commit()
    db.refresh(new_refresh_token_record)
  except IntegrityError as e:
    db.rollback() # Rollback on error
    # Catch the specific error for a duplicate username
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Cannot create the new refresh_token record: {e}"
    )
  except sqlalchemy.exc.SQLAlchemyError as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f"Database error: {e}")
  return {
    'access_token': access_token,
    'refresh_token': refresh_token,
    'is_accept': True,
    'message':'Login successfully',
    'token_type': "bearer"
    }
  
@router.post('/get-token')
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db:Session = Depends(get_db)):
  # Get to user first
  try:
    Username = form_data.username
    Password = form_data.password
    query  = db.query(UserORM).filter(UserORM.Username ==Username)
    found_user = query.one_or_none()
    # Check if user exists
    if not found_user:
      raise HTTPException(
              status_code=status.HTTP_401_UNAUTHORIZED,
              detail="Incorrect username or password",
          )
    if not pwd_context.verify(Password, found_user.PasswordHash):
      raise HTTPException(
              status_code=status.HTTP_401_UNAUTHORIZED,
              detail="Incorrect username or password",
          )
    # Create access token and refresh token for user
    
    ## access token
    access_token_payload = {
            'sub': found_user.Username,
            'user_id': found_user.UserId}
    time_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(input_data = access_token_payload, time_delta=time_delta)
    
    refresh_token, refresh_token_jti, expires_at = create_refresh_token(user_id=found_user.UserId)
    # Save new refresh token to database
    new_refresh_token_record = RefreshTokenORM (
      Jti = refresh_token_jti,
      TokenHash = refresh_token,
      UserId = found_user.UserId,
      ExpiresAt = expires_at
    )
    db.add(new_refresh_token_record)
    db.commit()
    db.refresh(new_refresh_token_record)
  except IntegrityError as e:
    db.rollback() # Rollback on error
    # Catch the specific error for a duplicate username
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail=f"Cannot create the new refresh_token record {e}"
    )
  except sqlalchemy.exc.SQLAlchemyError as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=f"Database error: {e}")
  return {
    'access_token': access_token,
    'refresh_token': refresh_token,
    'is_accept': True,
    'message':'Login successfully',
    'token_type': "bearer"
    }
  
# Get new access token from refresh token
@router.post('refresh-token', status_code=status.HTTP_202_ACCEPTED)
def refresh_token(refresh_token: RefreshToken, db: Session = Depends(get_db)):
  # try to decode refresh token
    # if fail throw error that refresh token is not valid
    # if succeed continue to check if received refresh token match with old refresh token in db
      # if not throw error that in matching refresh token
        # then delete old refresh token
      # if success give user new access token and refresh token
  pass