CREATE TABLE [User] (
    [UserId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Username] NVARCHAR(255) NOT NULL UNIQUE, -- Added for login
    [PasswordHash] NVARCHAR(255) NOT NULL, -- Added for login
    [Name] NVARCHAR(255),
    [Phone] NVARCHAR(255),
    [RoleId] INT NOT NULL,
    [CreateDate] DATETIME NOT NULL
);
GO

CREATE TABLE [WarehouseZone] (
    [WarehouseZoneId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX), -- Changed from TEXT(65535)
    [Purpose] NVARCHAR(MAX)      -- Changed from TEXT(65535)
);
GO

CREATE TABLE [Product] (
    [ProductId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ProductName] NVARCHAR(255) NOT NULL,
    [Measurement] NVARCHAR(255) NOT NULL,
    [SellingPrice] DECIMAL(10, 2), -- Changed from INTEGER for precision
    [InternalPrice] DECIMAL(10, 2) NOT NULL -- Changed from INTEGER for precision
);
GO

CREATE TABLE [WarehouseCard] (
    [WarehouseCardId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ProductId] INT NOT NULL,
    [WarehouseZoneId] INT NOT NULL,
    [Quantity] INT,
    FOREIGN KEY([ProductId]) REFERENCES [Product]([ProductId]) ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY([WarehouseZoneId]) REFERENCES [WarehouseZone]([WarehouseZoneId]) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE [Supplier] (
    [SupplierId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [SupplierName] NVARCHAR(255),
    [Phone] NVARCHAR(255),
    [Email] NVARCHAR(255),
    [Address] NVARCHAR(255) NOT NULL,
    [ContactPerson] NVARCHAR(255)
);
GO

CREATE TABLE [PurchaseOrder] (
    [PurchaseOrderId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [CreateDate] DATETIME,
    [TotalPrice] DECIMAL(10, 2), -- Changed from INTEGER for precision
    [Status] NVARCHAR(255) NOT NULL,
    [SupplierId] INT NOT NULL,
    [PurchasePlanId] INT,
    [CreateUserId] INT NOT NULL,
    FOREIGN KEY([SupplierId]) REFERENCES [Supplier]([SupplierId]) ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY([CreateUserId]) REFERENCES [User]([UserId]) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE [PurchaseOrderItem] (
    [POItemId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ProductId] INT NOT NULL,
    [PurchaseOrderId] INT NOT NULL,
    [Quantity] INT NOT NULL,
    [Unit_Price] DECIMAL(10, 2) NOT NULL, -- Changed from INTEGER for precision
    [ItemDescription] NVARCHAR(MAX), -- Changed from TEXT(65535)
    FOREIGN KEY([ProductId]) REFERENCES [Product]([ProductId]) ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY([PurchaseOrderId]) REFERENCES [PurchaseOrder]([PurchaseOrderId]) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE [PurchasePlan] (
    [PurchasePlanId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [CreateUserId] INT NOT NULL,
    [ForecastId] INT, -- Assuming Forecast will be a table later, or remove if not needed
    [CreateDate] DATETIME NOT NULL,
    [Status] NVARCHAR(255) NOT NULL,
    [PPDescripton] NVARCHAR(MAX), -- Changed from TEXT(65535)
    FOREIGN KEY([CreateUserId]) REFERENCES [User]([UserId]) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE [PurchasePlanItem] (
    [PurchasePlanItemId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [ProductId] INT NOT NULL,
    [PurchasePlanId] INT NOT NULL,
    [Quantity] INT NOT NULL,
    [DesiredPrice] DECIMAL(10, 2), -- Changed from INTEGER for precision
    [Description] NVARCHAR(MAX), -- Changed from TEXT(65535)
    FOREIGN KEY([ProductId]) REFERENCES [Product]([ProductId]) ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY([PurchasePlanId]) REFERENCES [PurchasePlan]([PurchasePlanId]) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE [InventoryMovement] (
    [MovementId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [CreateUserId] INT NOT NULL,
    [CreateDate] DATETIME NOT NULL,
    [Reason] NVARCHAR(MAX), -- Changed from TEXT(65535)
    FOREIGN KEY([CreateUserId]) REFERENCES [User]([UserId]) ON UPDATE NO ACTION ON DELETE NO ACTION
);
GO

CREATE TABLE [InventoryMovementItem] (
    [MovementItemId] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [MovementId] INT NOT NULL,
    [ProductId] INT NOT NULL,
    [QuantityMoved] INT NOT NULL,
    [SourceZoneId] INT NOT NULL,
    [DesZoneId] INT NOT NULL,
    [MovePersonId] INT NOT NULL, -- Assuming this links to UserId, consider making it a FK
    [Note] NVARCHAR(MAX), -- Changed from TEXT(65535)
    FOREIGN KEY([MovementId]) REFERENCES [InventoryMovement]([MovementId]) ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY([ProductId]) REFERENCES [Product]([ProductId]) ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY([SourceZoneId]) REFERENCES [WarehouseZone]([WarehouseZoneId]) ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY([DesZoneId]) REFERENCES [WarehouseZone]([WarehouseZoneId]) ON UPDATE NO ACTION ON DELETE NO ACTION
    -- Consider adding FOREIGN KEY([MovePersonId]) REFERENCES [User]([UserId])
);
GO