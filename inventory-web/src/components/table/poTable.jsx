import React from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Skeleton,
    Box,
    Typography,
    useTheme
} from '@mui/material';
import { alpha } from '@mui/material';
import StatusBadge from "../status/statusBadge";
import RowActions from "./rowActions";

// --- 1. Dynamic Alignment Logic ---
// PO ID: Left | Numbers/Currency: Right | Others: Center
const getAlignment = (col) => {
  if (col.key === 'purchase_order_id') return 'left';
  if (col.type === 'currency' || col.type === 'number') return 'right';
  return 'center';
};

// --- 2. Render Cell Content ---
const RenderCellData = ({ columnsConfig, item, colKey }) => {
  const column = columnsConfig.find(c => c.key === colKey);
  const value = item[colKey];

  if (column.type === 'currency') return `$${parseFloat(value || 0).toFixed(2)}`;
  if (column.type === 'status') return <StatusBadge status={value} />;
  if (colKey === 'create_date') return new Date(value).toLocaleDateString();
  if (column.type === 'actions') return <RowActions item={item} />;
  
  return value;
};

const ServerSideTable = ({ 
    data, 
    limit, 
    loading,
    columnsConfig, 
    onRowClick, 
    selectedId
}) => {

  const theme = useTheme()

  // Loading State
  if (loading) {
    return (
      <TableContainer component={Paper} elevation={0} sx={{ border: 'none', overflowY: 'hidden' }}>
        <Table
        sx ={{
          overflow: 'hidden'
        }}
        >
          <TableBody>
            {[...Array(limit)].map((_, i) => (
              <TableRow key={i} sx={{ border: 'none' }}>
                <TableCell colSpan={columnsConfig.length} sx={{ border: 'none' }}>
                  <Skeleton variant="text" height={40} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Empty State
  if (!data || data.length === 0) {
    return (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', border: 'none' }}>
            <Typography color="text.secondary">No Purchase Orders found.</Typography>
        </Box>
    );
  }

  const emptyRowsCount = Math.max(0, limit - data.length);

  return (
    // Add a Paper to set border
       <TableContainer 
          component={Paper} 
          elevation={0} 
          sx={{ 
              borderRadius: 0, 
              overflow: 'auto', 
              border: 'none',      
              bgcolor: 'transparent',
              flexGrow: 1,
              scrollbarWidth: 'none', 
    
              // Hide Scrollbar for Chrome, Safari, Edge
              '&::-webkit-scrollbar': {
                display: 'none',
              }

          }}
      >
        <Table 
        stickyHeader 
        size="medium" 
        sx={{ 
          border: 'none' ,
          tableLayout: 'fixed',
          overflow: 'auto'
          }}>
          <TableHead>
            <TableRow sx={{ border: 'none' }}>
              {columnsConfig.map((col) => (
                <TableCell 
                  key={col.key}
                  align={getAlignment(col)}
                  sx={{ 
                      bgcolor: 'primary.main', 
                      fontWeight: 'bold', 
                      fontSize: '0.85rem',
                      color: 'white',
                      borderBottom: 'none', // Remove header bottom border
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => {
              const isSelected = String(item.purchase_order_id) === String(selectedId);
              return (
                <TableRow 
                  key={item.purchase_order_id || index}
                  hover
                  onClick={() => onRowClick && onRowClick(item)}
                  selected={isSelected}
                  sx={{ 
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&.Mui-selected': { 
                          bgcolor: alpha(theme.palette.primary.main, 0.08), // Theme-aware selection
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) }
                      },
                      border: 'none',
                      height: 70
                  }}
                >
                  {columnsConfig.map((col) => (
                    <TableCell 
                      key={col.key} 
                      align={getAlignment(col)}
                    >
                      <RenderCellData columnsConfig={columnsConfig} item={item} colKey={col.key} />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}

            {/* Empty Filler Rows */}
            {emptyRowsCount > 0 && [...Array(emptyRowsCount)].map((_, index) => (
              <TableRow key={`empty-${index}`} sx={{ height: 70, border: 'none' }}>
                <TableCell colSpan={columnsConfig.length} sx={{ borderBottom: 'none' }} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
   
  );
};

export default ServerSideTable;