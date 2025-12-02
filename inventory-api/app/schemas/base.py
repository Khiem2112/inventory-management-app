# app/schemas/core.py
from pydantic import BaseModel, ConfigDict, AliasGenerator

def to_pascal(snake: str) -> str:
    return "".join(word.capitalize() for word in snake.split("_"))

# This config is ONLY for reading/writing to the PascalCase Database
class DBSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=AliasGenerator(validation_alias=to_pascal),
        from_attributes=True,
        populate_by_name=True 
    )

# This config is for the API (Pure Snake Case)
class APISchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,  # Allows reading from the DBModel or ORM if names match
        # No alias generator here! We want pure snake_case.
    )