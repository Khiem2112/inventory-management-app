from celery import Celery

# Connects to your local RabbitMQ instance
celery_app = Celery(
  "inventory_worker",
  broker="amqp://guest:guest@localhost:5672//",
  include=['app.worker.tasks'] # Points to where your tasks live
)