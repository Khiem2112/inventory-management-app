# logger_config.py

import logging
from colorlog import ColoredFormatter

def setup_logger():
  """Returns a logger with a specific format and colored output."""
  
  # Create the logger
  logger = logging.getLogger("my_app_logger")
  logger.setLevel(logging.DEBUG)  # Set the minimum logging level

  # Create the console handler
  console_handler = logging.StreamHandler()
  console_handler.setLevel(logging.DEBUG)

  # Define the log format
  log_format = (
    "%(white)s%(asctime)s%(reset)s - "
    "%(blue)s%(filename)s%(reset)s - "
    "%(yellow)s%(funcName)s%(reset)s - "
    "%(log_color)s%(levelname)s%(reset)s: "
    "%(message)s"
  )

  # Create the colored formatter
  formatter = ColoredFormatter(
    log_format,
    datefmt="%Y-%m-%d %H:%M:%S",
    log_colors={
      'DEBUG':    'cyan',
      'INFO':     'green',
      'WARNING':  'yellow',
      'ERROR':    'red',
      'CRITICAL': 'bold_red',
    }
  )

  # Add the formatter to the handler and the handler to the logger
  console_handler.setFormatter(formatter)
  
  # Check if the logger already has handlers to prevent duplicate output
  if not logger.handlers:
    logger.addHandler(console_handler)

  return logger