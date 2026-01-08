# Helper function
from enum import Enum
class LocationID(Enum):
  AVAILABLE = 1
  IN_RECEIVING = 2
  IN_TRANSIT = 3
  AWAITING_QC = 4
  COMMITTED = 5
  DISABLED = 6
  REJECTED_DOCK = 7 
  QUARANTINE = 8
  VENDOR = 1007 # Example
class ZoneID(Enum):
  QUARANTINE = 14
  DEFAULT_STORAGE = 7

class AssetStatus(Enum):
  Available = "Available"
  InTransit = "In Transit"
  AwaitingQC = "Awaiting QC"
  Rejected = "Rejected"