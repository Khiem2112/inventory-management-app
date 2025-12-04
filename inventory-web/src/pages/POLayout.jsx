import { PurchaseOrderDetail } from "../components/PurchaseOrderDetail"
import { Box } from "@mui/material"

export const POLayout = () => {
  return (
    <>
      <Box 
        className="po-master-detail-container" 
        sx={{
          display: "flex",
          flexDirection: 'row',
          // width:'100%'
        }}
      >
        <Box 
        className="po-list-panel"
        sx={{
          width:'30%'
        }}
        
        >
          {/* List content goes here */}
        </Box>
        <Box 
        className="po-detail-view"
        sx={{
          width:'70%'
        }}
        >
          {/* FIX: You can remove the unnecessary surrounding braces here */}
          <PurchaseOrderDetail/>
        </Box>
      </Box>
    </>
  )
}