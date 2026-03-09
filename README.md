# Digital Device Inventory Management System

A production-ready, full-stack inventory platform designed to digitize hardware procurement, dock receiving, and quality control workflows. Built with React, FastAPI, and SQL Server.

## Noticeable UI Features

### (1) Master-Detail PO Items View
Simultaneous high-level metrics and granular data investigation. 

<img width="2559" height="1333" alt="image" src="https://github.com/user-attachments/assets/60e21531-eea5-4536-a68e-13a993a301e8" />

### (2) Dynamic Data Tables
Engineered for dense data environments, allowing users to toggle column visibility dynamically to reduce cognitive load.

<img width="2559" height="1332" alt="image" src="https://github.com/user-attachments/assets/d191c1dd-2b6c-44dd-8657-59d502ef5081" />

### (3) Smart Data Entry
Relational data creation made seamless. The UI utilizes an advanced autocomplete feature to query and select product metadata instantly during procurement.

<img width="2559" height="1328" alt="image" src="https://github.com/user-attachments/assets/0ab33744-9e4d-427f-98a3-a747594e930e" />

If user intent to leave the PO not create or drafted, it warns them

<img width="2559" height="1331" alt="image" src="https://github.com/user-attachments/assets/c316b3aa-d40a-4a45-92c6-80b23883c919" />


### (4) Multi-Step Form Wizard
A guided, state-retaining wizard that ensures complex receiving manifests are built accurately before submission. 
*Flow: (1) Search PO -> (2) Add Manifest Info -> (3) Success Confirmation*

![ezgif com-animated-gif-maker](https://github.com/user-attachments/assets/c9089a95-d192-49d7-a34d-e3b4e6c700cf)

### (5) Dock Receiving & Bulk Verification
Optimized for warehouse operations. Users can scan, accept, or reject multiple serial numbers in the client-side UI before committing the final bulk payload to the backend.

1. Search for shipment manifest

![Uploading image.png…]()


### (6) Master Data Management
Comprehensive product creation interface integrating directly with Cloudinary for immediate visual asset management and previewing.

<img width="2559" height="1330" alt="image" src="https://github.com/user-attachments/assets/6a4be36e-89de-40ae-9947-4ec6333d67b7" />

---

## (2) Business Logic Diagrams

### (1) Entity-Relationship Diagram (ERD)
Strict relational integrity mapping the procurement lifecycle.

```mermaid
erDiagram
    Supplier {
        int SupplierId PK
        string SupplierName
        string ContactName
        string Status
    }
    PurchaseOrder {
        string PoNumber PK
        int SupplierId FK
        date OrderDate
        string Status
        float TotalAmount
        int CreatedBy FK
    }
    PoLineItem {
        int LineItemId PK
        string PoNumber FK
        int ProductId FK
        int QuantityOrdered
    }
    Product {
        int ProductId PK
        string Sku
        string Name
        string Category
    }
    ShipmentManifest {
        int ManifestId PK
        string PoNumber FK
        string CarrierName
        string Status
    }
    GoodReceipt {
        int ReceiptId PK
        string PoNumber FK
        int ManifestId FK
        int ReceivedBy FK
        date ReceiptDate
    }
    Asset {
        int AssetId PK
        int ProductId FK
        string SerialNumber
        int ReceiptId FK
        int ZoneId FK
        string Status
    }
    WarehouseZone {
        int ZoneId PK
        string ZoneName
        int Capacity
        int CurrentLoad
    }

    Supplier ||--o{ PurchaseOrder : "supplies"
    PurchaseOrder ||--|{ PoLineItem : "contains"
    Product ||--o{ PoLineItem : "defines"
    PurchaseOrder ||--o{ ShipmentManifest : "tracks via"
    ShipmentManifest ||--o{ GoodReceipt : "verified in"
    GoodReceipt ||--|{ Asset : "logs"
    Product ||--o{ Asset : "categorizes"
    WarehouseZone ||--o{ Asset : "stores"
```
### (2) JWT Auto-Refresh Sequence
Strict relational integrity mapping the procurement lifecycle.
Secure, seamless session management ensuring continuous warehouse operations without sudden logouts.
```mermaid
sequenceDiagram
    participant Client as React App
    participant API as FastAPI Backend
    participant DB as SQL Server
    
    Client->>API: Request with expired Access Token
    API-->>Client: 401 Unauthorized (Token Expired)
    Client->>API: POST /auth/refresh (with HTTP-only Refresh Token)
    API->>DB: Validate Refresh Token
    DB-->>API: Token Valid
    API-->>Client: 200 OK (New Access Token)
    Client->>API: Retry original request with new token
    API-->>Client: 200 OK (Data returned)
```
### (3) PO Lifecycle State Machine
Strict state transitions preventing invalid procurement actions.
```mermaid
stateDiagram-v2
    [*] --> Draft : Created
    Draft --> Issued : Approved by Manager
    Issued --> Partially_Received : Manifest Created (Incomplete)
    Partially_Received --> Fully_Received : All Line Items Matched
    Issued --> Fully_Received : All Line Items Matched
    Draft --> Cancelled : Aborted
```
### (4) Shipment Manifest Creation Flow
Backend validation ensuring physical shipments do not exceed requested procurement totals.
```mermaid
flowchart TD
    A[Client Submits Manifest] --> B{Check PO Status}
    B -- Not Issued --> C[Reject: Invalid State]
    B -- Issued --> D{Validate Quantities}
    D -- Exceeds PO Request --> E[Reject: Quantity Mismatch]
    D -- Valid --> F[Generate Manifest Record]
    F --> G[Update PO State]
```
### (5) Asset Verification Flow
Decoupled client-side scanning and state management to minimize database transaction locks until final commit.
```mermaid
sequenceDiagram
    participant Scanner as Barcode Scanner / User
    participant UI as @AssetSerialNumberDialog.jsx
    participant API as FastAPI Bulk Save

    Scanner->>UI: Scan Serial Number
    UI->>UI: Local validation (Regex/Format)
    UI->>UI: Add to "Pending Verification" Client State
    Scanner->>UI: Scan Next Serial
    UI->>UI: Update Client State (Accept/Reject categories)
    Note over UI: User finalizes physical count
    UI->>API: POST /assets/bulk (JSON Array of all states)
    API-->>UI: 200 OK (Transaction Committed)
```
