# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
import cloudinary

# Ensure .env is loaded from the project root.
# This makes sure dotenv finds the .env file regardless of where this script is called from.
# It navigates up from app/core/ to app/ to inventory-api/ and looks for .env there.
from dotenv import load_dotenv
IS_PRODUCTION = os.environ.get('K_SERVICE') is not None

# Only load the .env file if we are NOT in production
if not IS_PRODUCTION:
    env_dir = os.path.dirname(os.path.dirname(__file__))
    env_path = os.path.join(env_dir,'.env')
    load_dotenv(env_path)

class Settings(BaseSettings):
    DATABASE_NAME: str
    DATABASE_HOSTNAME: str
    DATABASE_PORT: int
    DATABASE_USERNAME: str
    DATABASE_PASSWORD: str
    
    # Cloudinary credentials
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # Configuration for BaseSettings itself
    model_config = SettingsConfigDict(
        env_file=None, # Look for variables in .env file
        extra='ignore'   # Ignore variables in .env that are not defined in this class
    )

# Create an instance of the Settings class to be imported and used throughout your application.
settings = Settings()
# Setting for cloudinary instances
cloudinary.config(
  cloud_name = settings.CLOUDINARY_CLOUD_NAME, 
  api_key = settings.CLOUDINARY_API_KEY, 
  api_secret = settings.CLOUDINARY_API_SECRET, 
  secure = True
)