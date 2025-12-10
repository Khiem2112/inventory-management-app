# app/schemas/base.py
from pydantic import BaseModel, ConfigDict, AliasGenerator, Field
from typing import Optional

# --- UTILITY: The Converter ---
def to_pascal(snake: str) -> str:
    """Converts 'user_id' -> 'UserId'"""
    return "".join(word.capitalize() for word in snake.split("_"))

# --- LAYER 1: WRITING TO DB (Inputs) ---
class AutoWriteSchema(BaseModel):
    """
    Intermediate layer for Input Schemas (Create/Update).
    It contains the logic to map itself to a PascalCase ORM object.
    """
    model_config = ConfigDict(populate_by_name=True)

    def to_orm_dict(self, exclude_unset=True) -> dict:
        """
        Converts the Pydantic model to a dictionary with PascalCase keys.
        """
        # 1. Dump the snake_case data
        data = self.model_dump(exclude_unset=exclude_unset)
        
        # 2. Convert keys to PascalCase (user_name -> UserName)
        return {to_pascal(key): value for key, value in data.items()}

    def apply_to_orm(self, orm_obj):
        """
        Applies fields to the ORM object, automatically handling PascalCase mapping.
        """
        pascal_data = self.to_orm_dict()
        for field, value in pascal_data.items():
            if hasattr(orm_obj, field):
                setattr(orm_obj, field, value)
        return orm_obj

# --- LAYER 2: READING FROM DB (Outputs) ---
class AutoReadSchema(BaseModel):
    """
    Intermediate layer for Output Schemas (Public).
    It automatically reads PascalCase DB columns into snake_case fields.
    """
    model_config = ConfigDict(
        alias_generator=AliasGenerator(validation_alias=to_pascal),
        populate_by_name=True,
        from_attributes=True
    )
class StandardResponse(BaseModel):
    message: Optional[str] = Field(default=None, description = "Overall description for the endpoint response")