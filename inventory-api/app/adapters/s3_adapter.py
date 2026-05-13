import boto3
from botocore.client import Config

class S3StorageAdapter:
  def __init__(self):
    # In production, these come from your .env file
    self.s3 = boto3.client(
      's3',
      endpoint_url='http://localhost:9000',
      aws_access_key_id='admin',
      aws_secret_access_key='password123',
      config=Config(signature_version='s3v4')
    )
    self.bucket_name = "inventory-imports"
    self._ensure_bucket_exists()

  def _ensure_bucket_exists(self):
    try:
      self.s3.head_bucket(Bucket=self.bucket_name)
    except:
      self.s3.create_bucket(Bucket=self.bucket_name)

  def upload_stream(self, filename: str, file_stream) -> str:
    # Streams directly to MinIO without loading to RAM
    self.s3.upload_fileobj(file_stream, self.bucket_name, filename)
    
    # Return a presigned URL valid for 1 hour for the Celery worker
    return self.s3.generate_presigned_url(
      'get_object',
      Params={'Bucket': self.bucket_name, 'Key': filename},
      ExpiresIn=3600
    )