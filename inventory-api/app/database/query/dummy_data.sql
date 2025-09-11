-- DUMMY DATA FOR InventoryDB

-- Insert into [User] table
-- RoleId: Assuming 1 for Admin, 2 for Regular User, etc. You might want to create a [Role] table later.
INSERT INTO [User] (Username, PasswordHash, Name, Phone, RoleId, CreateDate) VALUES
('adminuser', 'hashed_admin_password_123', 'Alice Smith', '123-456-7890', 1, GETDATE()),
('warehouse_manager', 'hashed_warehouse_pass_456', 'Bob Johnson', '987-654-3210', 2, GETDATE()),
('sales_rep', 'hashed_sales_pass_789', 'Charlie Brown', '555-123-4567', 3, GETDATE());
GO

-- Insert into [WarehouseZone] table
INSERT INTO [WarehouseZone] (Name, Description, Purpose) VALUES
('Receiving Dock', 'Area for incoming goods inspection.', 'Initial staging for new inventory.'),
('Main Storage A', 'Primary long-term storage for general goods.', 'Bulk storage for popular items.'),
('Hazardous Materials', 'Secure, temperature-controlled zone for chemicals.', 'Storage for volatile or dangerous goods.'),
('Shipping Area', 'Area for outgoing orders to be packed and shipped.', 'Final staging for dispatch.');
GO

-- Insert into [Product] table
INSERT INTO [Product] (ProductName, Measurement, SellingPrice, InternalPrice) VALUES
('Laptop Pro', 'Units', 1200.00, 950.00),
('Wireless Mouse', 'Units', 25.50, 15.00),
('USB-C Cable (2m)', 'Units', 8.99, 4.00),
('External SSD 1TB', 'Units', 150.00, 110.00),
('Thermal Paste (5g)', 'Grams', 12.00, 6.00);
GO

-- Insert into [WarehouseCard] table
-- Links Products to WarehouseZones, representing current stock levels in each zone.
INSERT INTO [WarehouseCard] (ProductId, WarehouseZoneId, Quantity) VALUES
(1, 2, 50),  -- Laptop Pro in Main Storage A
(2, 2, 200), -- Wireless Mouse in Main Storage A
(3, 2, 500), -- USB-C Cable in Main Storage A
(4, 1, 15),  -- External SSD 1TB in Receiving Dock (newly arrived)
(5, 3, 10),  -- Thermal Paste in Hazardous Materials
(1, 4, 5);   -- Laptop Pro in Shipping Area (ready for dispatch)
GO

-- Insert into [Supplier] table
INSERT INTO [Supplier] (SupplierName, Phone, Email, Address, ContactPerson) VALUES
('Tech-Supply Inc.', '111-222-3333', 'contact@techsupply.com', '123 Tech Blvd, Silicon Valley', 'Sarah Lee'),
('Global Parts Co.', '444-555-6666', 'info@globalparts.net', '456 Industrial Way, Metropol', 'John Doe'),
('ConnectAll Ltd.', '777-888-9999', 'support@connectall.org', '789 Cable St, Port City', 'Emily White');
GO

-- Insert into [PurchasePlan] table
-- CreateUserId refers to UserId from the [User] table
INSERT INTO [PurchasePlan] (CreateUserId, ForecastId, CreateDate, Status, PPDescripton) VALUES
(1, NULL, GETDATE(), 'Pending Approval', 'Quarterly stock replenishment plan for electronics.'),
(2, NULL, GETDATE(), 'Approved', 'Urgent order for low-stock cables and mice.'),
(1, NULL, GETDATE(), 'Draft', 'New supplier evaluation for SSDs.');
GO

-- Insert into [PurchasePlanItem] table
INSERT INTO [PurchasePlanItem] (ProductId, PurchasePlanId, Quantity, DesiredPrice, Description) VALUES
(1, 1, 100, 920.00, 'Need to stock up on new laptops.'),
(2, 1, 300, 14.50, 'Standard replenishment for wireless mice.'),
(3, 2, 200, 3.80, 'Critical stock for USB-C cables.'),
(4, 3, 50, 105.00, 'Evaluating pricing from a new SSD supplier.');
GO

-- Insert into [PurchaseOrder] table
-- SupplierId refers to SupplierId, CreateUserId refers to UserId, PurchasePlanId refers to PurchasePlanId
INSERT INTO [PurchaseOrder] (CreateDate, TotalPrice, Status, SupplierId, PurchasePlanId, CreateUserId) VALUES
(GETDATE(), 10000.00, 'Issued', 1, 1, 1), -- Order for laptops and mice based on PP1
(GETDATE(), 800.00, 'Received', 3, 2, 2);  -- Order for cables based on PP2
GO

-- Insert into [PurchaseOrderItem] table
INSERT INTO [PurchaseOrderItem] (ProductId, PurchaseOrderId, Quantity, Unit_Price, ItemDescription) VALUES
(1, 1, 10, 950.00, 'Laptop Pro Batch 1'),
(2, 1, 50, 15.00, 'Wireless Mouse Bulk'),
(3, 2, 200, 4.00, 'USB-C Cable Lot A');
GO

-- Insert into [InventoryMovement] table
-- CreateUserId refers to UserId
INSERT INTO [InventoryMovement] (CreateUserId, CreateDate, Reason) VALUES
(2, GETDATE(), 'Transfer from Receiving to Main Storage'),
(2, GETDATE(), 'Stock adjustment due to damage'),
(1, GETDATE(), 'Preparation for shipping order #1234');
GO

-- Insert into [InventoryMovementItem] table
-- MovementId refers to InventoryMovementId, ProductId refers to ProductId
-- SourceZoneId, DesZoneId refer to WarehouseZoneId, MovePersonId refers to UserId
INSERT INTO [InventoryMovementItem] (MovementId, ProductId, QuantityMoved, SourceZoneId, DesZoneId, MovePersonId, Note) VALUES
(1, 4, 15, 1, 2, 2, 'Moving recently received SSDs to main storage.'),
(2, 2, 5, 2, 2, 2, '5 damaged wireless mice removed from stock.'), -- Note: same source and dest zone indicates internal adjustment
(3, 1, 2, 2, 4, 1, 'Two Laptop Pros moved for customer order fulfillment.');
GO