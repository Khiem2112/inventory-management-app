import { useState } from "react";
import './PurchaseOrderDetail.css'

export const PurchaseOrderDetail = (purchaseOrder) => {


  
let purchaseOrderHeader= {
    PurchaseOrderId: 10,
    CreateDate: "2025-08-02 14:00:00.000",
    TotalPrice: 23839.77, // Calculated based on the items below
    Status: "Issued",
    SupplierId: 2,
    SupplierName: "Global Parts Co.",
    PurchasePlanId: 1,
    CreateUserId: 1,
    Createuser: "Cho Khiem"
  };

// (2) List of items associated with that PO
let items= [
  {
    // (3) Field names: line_id, product_name, quantity, unit_price, item_description
    line_id: 1,
    product_name: "Pro Wireless Earbuds",
    quantity: 9,
    unit_price: 159.99,
    item_description: "Pro Wireless Earbuds - ACC-EB-PRO"
  },
  {
    line_id: 2,
    product_name: "Gamer Rig Z",
    quantity: 3,
    unit_price: 2499.99,
    item_description: "Gamer Rig Z - LTP-GR-Z-01"
  },
  {
    line_id: 3,
    product_name: "ProBook X1",
    quantity: 9,
    unit_price: 1499.99,
    item_description: "ProBook X1 - LTP-X1-P001"
  },
  {
    line_id: 4,
    product_name: "EconBook 13",
    quantity: 2,
    unit_price: 699.99,
    item_description: "EconBook 13 - LTP-EB-13-A"
  }
];

let POItemMetadata = [
  {id:"line_id", label: "Line ID", isVisible:true},
  {id:"product_name", label: "Product Name", isVisible:true},
  {id:"quantity", label: "Quantity", isVisible:true},
  {id:"unit_price", label: "Unit Price", isVisible:true},
  {id:"item_description", label: "Item Description", isVisible:true},
];

  const [POHeader, setPOHeader] = useState(purchaseOrderHeader)
  const [itemMetadata, setItemMetadata] = useState(POItemMetadata)
  const [POItems, setPOItems] = useState(items)
  return (
    <div className="purchase-order-container">
      <section className="po-header">

        <section id="po-creation-field-group">
          <label>Status: {POHeader.Status} </label>
          <label>Create Date: {POHeader.CreateDate}</label>
          <label>Create User: {POHeader.Createuser}</label>
        </section>

        <section id="po-reference-field-group">
          <label>Purchase Plan Reference: {POHeader.PurchaseOrderId}</label>
          <label>Supplier: {POHeader.SupplierName}</label>
        </section>

        <section id="po-header-total-price">
          <label>Net Price: {POHeader.TotalPrice}</label>
        </section>

      </section>

      <section className="po-item">
        <table>
          <thead>
            <tr>
            {itemMetadata.map(column => {
              if (column.isVisible)
              return (
              <th key={column.id}>{column.label}</th>
            )
            }
            
            )}
            </tr>

          </thead>

          <tbody>
            {POItems.map(item=> {
              // Handle each purchase order item
              return (
                <tr key={item.line_id}>
                  {itemMetadata.map(column => {
                    // Handle each column in a purchase order item
                    if (column.isVisible)
                    return (
                      <td>
                        {item[column.id]}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>

          
        </table>

      </section>

    </div>
  )
}