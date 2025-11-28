// src/components/ServerSideTable/ServerSideTable.jsx
import StatusBadge from "../status/statusBadge";
import './poTable.css'
import TablePagination from '@mui/material/TablePagination';// ... other imports for filter, pagination icons

const ServerSideTable = ({ data, meta, loading, onPageChange, onLimitChange, columnsConfig }) => {
  const totalRecords = meta?.total_records || 0;
  const currentPage = meta?.current_page || 1;
  const totalPages = meta?.total_pages || 1;
  const limit = 20; // Assuming default limit for display calculation

  // Loading State (on_load)
  if (loading) {
    return (
      <div className="table-container table-container--loading">
        {/* Placeholder/Skeleton Rows (visual_states: on_load) */}
        {[...Array(limit)].map((_, index) => (
          <div key={index} className="table__skeleton-row" />
        ))}
        <p>Loading Purchase Orders...</p>
      </div>
    );
  }

  // Empty State (on_empty)
  if (data?.length === 0) {
    return (
      <div className="table-container table-container--empty">
        {/* Replace with actual illustration */}
        <div className="empty-state__illustration"></div>
        <p className="empty-state__message">No Purchase Orders found matching your criteria.</p>
      </div>
    );
  }

  const RenderCellData = ({ item, colKey }) => {
        const column = columnsConfig.find(c => c.key === colKey);
        const value = item[colKey];

        // Custom render logic based on type (defined in config)
        if (column.type === 'currency') {
            // Assumes total_price is a string and formats it
            return <span>${parseFloat(value).toFixed(2)}</span>;
        }
        if (column.type === 'status') {
            return <StatusBadge status={value} />;
        }
        if (colKey === 'create_date') {
             // Simple date format for demo
            const date = new Date(value);
            return <span>{date.toLocaleDateString()}</span>;
        }
        
        // Default rendering
        return <span>{value}</span>;
    };

  return (
        <div className="table-container">
            <table className="data-table">
                <thead className="data-table__header">
                    <tr>
                        {/* Iterate directly over the pre-filtered config */}
                        {columnsConfig.map(col => (
                            <th key={col.key} className={`header__cell header__cell--${col.key}`}>
                                {col.label} 
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="data-table__body">
                    {data.map((item, index) => (
                        <tr key={item.purchase_order_id || index} className="body__row">
                            {/* Iterate directly over the pre-filtered config */}
                            {columnsConfig.map(col => (
                                <td key={col.key} className={`body__cell body__cell--${col.key}`}>
                                    <RenderCellData item={item} colKey={col.key} /> 
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* --- MUI Pagination Footer --- */}
            <TablePagination
                component="div"
                count={totalRecords}
                page={currentPage - 1} // TRANSLATION: Backend(1-based) -> MUI(0-based)
                onPageChange={(event, newPage) => {
                    onPageChange(newPage + 1); // TRANSLATION: MUI(0-based) -> Backend(1-based)
                }}
                rowsPerPage={limit}
                onRowsPerPageChange={(event) => {
                    onLimitChange(parseInt(event.target.value, 10));
                }}
                rowsPerPageOptions={[10, 20, 50]} // Options for the dropdown
                labelRowsPerPage="Rows:" // Optional customization
            />
        </div>
    );
};

export default ServerSideTable;