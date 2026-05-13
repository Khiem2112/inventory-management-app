from fastapi import APIRouter, UploadFile, File, Depends
from app.adapters.s3_adapter import S3StorageAdapter
from app.worker.tasks import process_bulk_import
from app.utils.dependencies import get_current_user, get_db
from app.database.user_model import User as UserORM
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import uuid
router = APIRouter()
storage_adapter = S3StorageAdapter()
@router.post("/bulk_import", status_code=202)
async def upload_bulk_product_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Validate File Format
    if not file.filename.endswith('.csv'):
      raise HTTPException(status_code=400, detail="Only .csv files are supported")

    # Generate the JobId (The glue for your system)
    job_id = str(uuid.uuid4())

    try:
      # Stream to MinIO and get the internal URL
      # We pass the file stream directly to keep RAM usage low
      file_url = storage_adapter.upload_stream(file.filename, file.file)

      # ASSIGN TASK TO CELERY
      # We pass the job_id here so the worker can use it for the Quarantine table
      process_bulk_import.delay(
          file_url=file_url, 
          user_id=1, # Replace with current_user.Id from your auth logic
          job_id=job_id
      )

      # Return the JobId immediately to the frontend
      return {
        "message": "Import process started",
        "jobId": job_id,
        "fileName": file.filename
      }

    except Exception as e:
      # Log error and inform user if the initial upload/queue failed
      raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
        detail=f"Failed to initiate import: {str(e)}"
      )
  