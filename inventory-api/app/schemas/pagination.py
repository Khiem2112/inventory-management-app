from pydantic import BaseModel, Field, ConfigDict

class PaginationMetaData(BaseModel):
  current_page: int = Field(..., description="Current page")
  total_pages: int = Field(..., description="Total number of pages")
  limit: int = Field(..., description="Total of item in a page")
  total_records: int = Field(..., description="Total purchase order records in database")
  model_config = ConfigDict(populate_by_name=True)