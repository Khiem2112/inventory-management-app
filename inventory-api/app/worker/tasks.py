from app.worker.celery_app import celery_app
from app.database.connection import engine # Your SQLAlchemy session maker
from app.services.product.import_usecase import ProductImportUseCase
import app.database
from sqlalchemy.orm import Session

@celery_app.task(name="import_csv_task")
def process_bulk_import(file_url: str, user_id: int, job_id: str):
  # 1. Manually open DB session for this separate process
  db = Session(engine)
  try:
    # 2. Delegate immediately to the Use Case (Hexagonal pattern)
    use_case = ProductImportUseCase(db)
    use_case.execute(file_url=file_url, user_id=user_id, job_id=job_id)
    return {"status": "success", "user_id": user_id}
  except Exception as e:
    # 3. Native error handling
    db.rollback()
    raise e
  finally:
    # 4. Always close the session
    db.close()