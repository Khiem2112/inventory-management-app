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
    Typography
} from '@mui/material';
import StatusBadge from "../status/statusBadge";
import RowActions from "./rowActions";

const ServerSideTable = ({ 
    data, 
    limit, 
    loading,
    columnsConfig, 
    onRowClick, 
    selectedId
}) => {

  // --- 1. Dynamic Alignment Logic ---
  // PO ID: Left | Numbers/Currency: Right | Others: Center
  const getAlignment = (col) => {
    if (col.key === 'purchase_order_id') return 'left';
    if (col.type === 'currency' || col.type === 'number') return 'right';
    return 'center';
  };

  // --- 2. Render Cell Content ---
  const RenderCellData = ({ item, colKey }) => {
    const column = columnsConfig.find(c => c.key === colKey);
    const value = item[colKey];

    if (column.type === 'currency') return `$${parseFloat(value || 0).toFixed(2)}`;
    if (column.type === 'status') return <StatusBadge status={value} />;
    if (colKey === 'create_date') return new Date(value).toLocaleDateString();
    if (column.type === 'actions') return <RowActions item={item} />;
    
    return value;
  };

  // Loading State
  if (loading) {
    return (
      <TableContainer component={Paper} elevation={0} sx={{ border: 'none', overflowY: 'hidden' }}>
        <Table>
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
    <TableContainer 
        component={Paper} 
        elevation={0} 
        sx={{ 
            borderRadius: 0, 
            overflowY: 'hidden', // Disable vertical overflow
            border: 'none',      // Remove container border
            bgcolor: 'transparent'
        }}
    >
      <Table stickyHeader size="medium" sx={{ border: 'none' }}>
        <TableHead>
          <TableRow sx={{ border: 'none' }}>
            {columnsConfig.map((col) => (
              <TableCell 
                key={col.key}
                align={getAlignment(col)}
                sx={{ 
                    bgcolor: '#f8f9fa', 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase', 
                    fontSize: '0.75rem',
                    color: 'text.secondary',
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
                    border: 'none', // Ensure row has no border
                    '&.Mui-selected': { 
                        bgcolor: 'rgba(33, 150, 243, 0.08)', // Soft blue for selection
                    },
                    '&.Mui-selected:hover': { 
                        bgcolor: 'rgba(33, 150, 243, 0.12)' 
                    },
                    '& .MuiTableCell-root': {
                        borderBottom: 'none' // Remove individual cell borders
                    }
                }}
              >
                {columnsConfig.map((col) => (
                  <TableCell 
                    key={col.key} 
                    align={getAlignment(col)}
                  >
                    <RenderCellData item={item} colKey={col.key} />
                  </TableCell>
                ))}
              </TableRow>
            );
          })}

          {/* Empty Filler Rows */}
          {emptyRowsCount > 0 && [...Array(emptyRowsCount)].map((_, index) => (
            <TableRow key={`empty-${index}`} sx={{ height: 60, border: 'none' }}>
              <TableCell colSpan={columnsConfig.length} sx={{ borderBottom: 'none' }} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ServerSideTable;