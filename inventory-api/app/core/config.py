# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import ValidationError
import os
import cloudinary
import sys

# Ensure .env is loaded from the project root.
# This makes sure dotenv finds the .env file regardless of where this script is called from.
# It navigates up from app/core/ to app/ to inventory-api/ and looks for .env there.
from dotenv import load_dotenv
IS_PRODUCTION = os.environ.get('SERVICE_TYPE') is not None

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
try:
    settings = Settings()
    print("✅ Configuration loaded successfully.")
except ValidationError as e:
    print("="*60)
    print("❌ CRITICAL ERROR: MISSING ENVIRONMENT VARIABLES")
    print("="*60)
    
    # Loop through errors to find missing fields
    for error in e.errors():
        field_name = error['loc'][0]
        error_type = error['type']
        
        if error_type == 'missing':
            print(f"  - MISSING: {field_name}")
        else:
            # Handle other validation errors (like wrong type)
            print(f"  - INVALID: {field_name} ({error['msg']})")
            
    print("="*60)
    print("Please set these variables in Cloud Run 'Variables & Secrets'.")
    print("="*60)
    
    # Exit the application with an error code so Cloud Run knows it failed
    sys.exit(1)
# Setting for cloudinary instances
cloudinary.config(
  cloud_name = settings.CLOUDINARY_CLOUD_NAME, 
  api_key = settings.CLOUDINARY_API_KEY, 
  api_secret = settings.CLOUDINARY_API_SECRET, 
  secure = True
)