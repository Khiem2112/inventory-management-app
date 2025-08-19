from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.user_model import User as UserORM
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.schemas.user import UserLogin
from app.utils.dependencies import get_current_user
import os
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

@router.post('/login')
def login_user(UserLogin: UserLogin, db:Session = Depends(get_db)):
  # Get to user first
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
    
  payload = {
          'sub': found_user.Username,
          'user_id': found_user.UserId}
  time_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  access_token = create_access_token(input_data= payload, time_delta=time_delta)
  return {'access_token': access_token,
          'is_accept': True,
          'message':'Login successfully',
          'token_type': "bearer"}
  
@router.post('/get-token')
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db:Session = Depends(get_db)):
  # Get to user first
  Username = form_data.username
  Password = form_data.password
  query  = db.query(UserORM).filter(UserORM.Username ==Username)
  found_user = query.one_or_none()
  # Check if user exists
  if not found_user:
    raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Not found user",
        )
  if not pwd_context.verify(Password, found_user.PasswordHash):
    raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
  payload = {
          'sub': found_user.Username}
  time_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  access_token = create_access_token(input_data= payload, time_delta=time_delta)
  return {'access_token': access_token,
          'user_id': found_user.UserId,
          'is_accept': True,
          'message':'Login successfully',
          'token_type': "bearer"}
@router.get('/validate', status_code= status.HTTP_200_OK)
async def validate_token(current_user : UserORM= Depends(get_current_user)):
  """
    Checks if the provided JWT token is valid.
    """
  return {
    "message": "Token is valid",
    "username": current_user.Username,
    "is_active": True
  }