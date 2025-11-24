from pydantic import BaseModel, Field, ConfigDict

class PaginationMetaData(BaseModel):
  current_page: int = Field(..., description="Current page")
  total_page: int = Field(..., description="Total number of pages")
  limit: int = Field(..., description="Total of item in a page")
  model_config = ConfigDict(populate_by_name=True)