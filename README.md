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

<img width="2559" height="1331" alt="image" src="https://github.com/user-attachments/assets/0e1b98a0-0633-44c4-875e-b84355f1ba95" />

If user intent to leave the PO not create or drafted, it warns them

<img width="2559" height="1330" alt="image" src="https://github.com/user-attachments/assets/31713374-51ab-43b5-884b-18f211410c43" />


### (4) Create Shipment Manifest Flow: Multi-Step Form Wizard
A guided, state-retaining wizard that ensures complex receiving manifests are built accurately before submission. 
*Flow: (1) Search PO -> (2) Add Manifest Info -> (3) Success Confirmation -> (4) Create new Manifest

![ezgif com-animated-gif-maker (1)](https://github.com/user-attachments/assets/360a5738-4536-434a-8648-3d254d7770c8)

### (5) Dock Receiving & Bulk Verification
Optimized for warehouse operations. Users can scan, accept, or reject multiple serial numbers in the client-side UI before committing the final bulk payload to the backend.

1. Search for shipment manifest

![ezgif com-animated-gif-maker (2)](https://github.com/user-attachments/assets/9072abbc-141a-4bc0-bb53-8a2ecccdc58b)

2. Tab Lite 8: Scan 5 received assets and accept them (supplier didn't declared their serial number so you don't need to check them)

![ezgif com-animated-gif-maker (7)](https://github.com/user-attachments/assets/bd833535-d20f-43ae-8cf8-3f156ec1525f)

3. ProBook X1: Scan received assets and reject them

![ezgif com-animated-gif-maker (6)](https://github.com/user-attachments/assets/92e52f43-a9dc-46ce-a4b6-616e70f4102c)


### (6) Master Data Management
Comprehensive product creation interface integrating directly with Cloudinary for immediate visual asset management and previewing.

<img width="2559" height="1330" alt="image" src="https://github.com/user-attachments/assets/6a4be36e-89de-40ae-9947-4ec6333d67b7" />

---

## (2) Business Logic Diagrams

### (1) Entity-Relationship Diagram (ERD)
Strict relational integrity mapping the procurement lifecycle.

```mermaid
erDiagram
    ShipmentManifest {
        int Id PK
        int SupplierId
        int PurchaseOrderId
        string TrackingNumber
        string CarrierName
        date EstimatedArrival
        string Status
        int CreatedByUserId
    }
    ShipmentManifestLine {
        int Id PK
        int ShipmentManifestId
        string SupplierSerialNumber
        string SupplierSKU
        int QuantityDeclared
        int PurchaseOrderItemId
    }
    PurchaseOrder {
        int PurchaseOrderId PK
        date CreatedDate
        decimal TotalPrice
        string Status
        int SupplierId
        int PurchasePlanId
        int CreatedUserId
        date ExpectedDeliveryDate
        int ApprovedByUserId
    }
    PurchaseOrderItem {
        int POItemId PK
        int ProductId
        int PurchaseOrderId
        int Quantity
        decimal UnitPrice
    }
    Supplier {
        int SupplierId PK
        string SupplierName
        string Phone
        string Email
        string Address
        string ContactPerson
    }
    Product {
        int ProductId PK
        string ProductName
        string Measurement
        decimal SellingPrice
        decimal InternalPrice
        string ProductImageUrl
        string ProductImagePath
        string ModelNumber
        string SKU
        string Manufacturer
        string ProductSeries
        string Category
        int SafetyStock
        decimal PackageWeight_KG
        decimal Dimensions_L_CM
        decimal Dimensions_W_CM
        decimal Dimensions_H_CM
    }
    Asset {
        int AssetId PK
        string SerialNumber
        int ProductId
        int CurrentLocationId
        string AssetStatus
        int ReceivingDocumentId
        date LastMovementDate
        int ShipmentManifestLineId
    }
    GoodsReceipt {
        int ReceiptId PK
        string ReceiptNumber
        date ReceivedDate
        int ReceivedByUserId
        string TrackingNumber
    }
    StockMove {
        int StockMoveId PK
        int PurchaseOrderId
        int Quantity
        date MovementDate
        int SourceLocationId
        int DestinationLocationId
        int GoodsReceiptId
    }
    Location {
        int Id PK
        string Name
        string Description
    }
    StockMove_Asset_Rel {
        int AssetId PK, FK
        int StockMoveId PK, FK
    }
    User {
        int UserId PK
        string Username
        string PasswordHash
        string Name
        string Phone
        string RoleId
    }
    RefreshToken {
        int Id PK
        string JTI
        string TokenHash
        int UserId
    }

    Supplier ||--o{ PurchaseOrder : "receives"
    Supplier ||--o{ ShipmentManifest : "ships"
    PurchaseOrder ||--|{ PurchaseOrderItem : "contains"
    Product ||--o{ PurchaseOrderItem : "listed in"
    Product ||--o{ Asset : "instantiates as"
    PurchaseOrder ||--o{ ShipmentManifest : "includes"
    PurchaseOrderItem ||--o{ ShipmentManifestLine : "fulfilled by"
    ShipmentManifest ||--|{ ShipmentManifestLine : "contains"
    ShipmentManifestLine ||--o{ Asset : "defines"
    GoodsReceipt ||--o{ Asset : "receives"
    GoodsReceipt ||--o{ StockMove : "triggers"
    PurchaseOrder ||--o{ StockMove : "directs"
    Asset ||--|{ StockMove_Asset_Rel : "junction"
    StockMove ||--|{ StockMove_Asset_Rel : "junction"
    User ||--o{ ShipmentManifest : "creates"
    User ||--o{ PurchaseOrder : "creates"
    User ||--o{ GoodsReceipt : "signs"
    User ||--o{ RefreshToken : "has"
    Location ||--o{ StockMove : "is source for"
    Location ||--o{ StockMove : "is destination for"
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
    API-->>Client: 401 Unauthorized
    Client->>API: POST /auth/refresh (with current Refresh Token)
    API->>DB: Validate & DESTROY current Refresh Token
    DB-->>API: Token Invalidated
    API->>DB: Generate & Store NEW Refresh Token
    API-->>Client: 200 OK (New Access Token + New Refresh Token)
    Client->>API: Retry original request with new token
```
### (3) PO Lifecycle State Machine
Strict state transitions preventing invalid procurement actions.
```mermaid
stateDiagram
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
    A[Create Shipment Manifest] --> B[Process Manifest Lines]
    B --> C{Line Item Type?}
    C -- Asset Specified --> D[Map pre-defined Serial Numbers from Supplier]
    C -- Quantity Declared --> E["Log expected Quantity (No Serials yet)"]
    D --> F[Generate Manifest Record]
    E --> F
    F --> G[Instantiate ASSET records in Database]
    G --> H["Set ASSET status to 'In Transit'"]
```
### (5) Asset Verification Flow in Dock Receiving
Decoupled client-side scanning and state management to minimize database transaction locks until final commit.
```mermaid
sequenceDiagram
    participant UI as Client UI
    participant API as FastAPI Backend
    participant DB as SQL Server

    Note over UI: User scans/types serial number
    UI->>UI: Validate Serial is not duplicated in current UI payload
    UI->>API: POST /manifest/lines/verify_asset_uniqueness
    
    alt Line Type: Asset Specified
        API->>DB: Query: Does Serial exist AND Status == 'In Transit' AND matches this SM Line?
        DB-->>API: Match Result
    else Line Type: Quantity Declared
        API->>DB: Query: Is Serial globally unique across ALL records?
        DB-->>API: Uniqueness Result
    end
    
    API-->>UI: Return Verification State (Valid / Invalid)
    Note over UI: User completes scanning
    UI->>API: POST Bulk Receive Payload
```
