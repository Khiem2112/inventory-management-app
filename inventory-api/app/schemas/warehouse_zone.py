from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from app.schemas.base import AutoReadSchema, AutoWriteSchema

class ZoneBase (BaseModel):
  zone_id: Optional[int] = Field(default=None, description="Zone ID")
  zone_name: Optional[str] = Field(default=None, description="Name of Zone")
  description: Optional[str] = Field(default=None, description="Description for what that zone's responsibility")
  is_stockable: bool = Field(default=True, description="1 for stockable, 0 for non-stockable")
  is_security_cage: bool = Field(default=True, description="To show if that zone mostly support for high-value product")
  zone_type: str = Field (...,description="Type of Zone, including: Receiving, Storage and Quarantine area")
  zone_image_url :Optional[str] = Field(..., description="Image url for warehouse zone stored in cloudinary")
  
class ZoneUpdate (ZoneBase, AutoWriteSchema):
  pass
class ZonePublic (ZoneBase, AutoReadSchema):
  pass
