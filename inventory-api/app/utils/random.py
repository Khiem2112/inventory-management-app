import random
import uuid

# --- Simple Random Integer ---
def generate_random_int(min_val, max_val):
  return random.randint(min_val, max_val)

# --- Random String/Mixed Serial ---
def generate_random_serial(length=10, prefix="SN"):
  chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  random_part = ''.join(random.choice(chars) for _ in range(length))
  return f"{prefix}-{random_part}"

# --- Universally Unique Identifier (UUID) ---
def generate_uuid_serial():
  return str(uuid.uuid4()).replace('-', '') # Removes hyphens

# Example Usage:
# print(generate_random_serial(12, "PROD")) # e.g., PROD-X9A3B2C7D1E0
# print(generate_uuid_serial()) # e.g., a1b2c3d4e5f678901234567890abcdef
