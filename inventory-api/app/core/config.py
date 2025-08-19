# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

# Ensure .env is loaded from the project root.
# This makes sure dotenv finds the .env file regardless of where this script is called from.
# It navigates up from app/core/ to app/ to inventory-api/ and looks for .env there.
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

class Settings(BaseSettings):
    # This field will automatically be populated from the DATABASE_URL environment variable
    # (which `python-dotenv` loads from your .env file).
    DATABASE_URL: str

    # Configuration for BaseSettings itself
    model_config = SettingsConfigDict(
        env_file='.env', # Look for variables in .env file
        extra='ignore'   # Ignore variables in .env that are not defined in this class
    )

# Create an instance of the Settings class to be imported and used throughout your application.
settings = Settings()