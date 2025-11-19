// src/components/ServerSideTable/ServerSideTable.jsx
import StatusBadge from "../status/statusBadge";
import './poTable.css'
// ... other imports for filter, pagination icons

const columns = [
  { key: 'po_id', label: 'PO Number', isVisible: true },
  { key: 'vendor_name', label: 'Vendor', isVisible: true },
  { key: 'created_date', label: 'Created Date', isVisible: true },
  { key: 'status', label: 'Status', isVisible: true },
  { key: 'total_amount', label: 'Total Amount', isVisible: true },
  { key: 'creator_name', label: 'Creator Name', isVisible: true },
  // 'Balance Due' would be added here but omitted for brevity/API matching
];

const RowData = ({ item, colKey }) => {
  const value = item[colKey];
  
  if (colKey === 'total_amount') {
    return <span>${value.toFixed(2)}</span>;
  }
  if (colKey === 'status') {
    return <StatusBadge status={value} />;
  }
  if (colKey === 'created_date') {
      // Simple date format for demo
      const date = new Date(value);
      return <span>{date.toLocaleDateString()}</span>;
  }
  return <span>{value}</span>;
};

const ServerSideTable = ({ data, meta, loading, onPageChange, onLimitChange, visibleColumns }) => {
  const visibleCols = columns.filter(col => visibleColumns.includes(col.key));
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

  return (
    <div className="table-container">
      <table className="data-table">
        <thead className="data-table__header">
          <tr>
            {visibleCols.map(col => (
              <th 
                key={col.key} 
                className={`header__cell header__cell--${col.key}`}
              >
                {col.label}
                {/* Add sort indicator here */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="data-table__body">
          {data.map((item, index) => (
            <tr key={item.po_id || index} className="body__row">
              {visibleCols.map(col => (
                <td 
                  key={col.key} 
                  className={`body__cell body__cell--${col.key}`}
                >
                  <RowData item={item} colKey={col.key} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination Footer (AC3) */}
      <div className="table-pagination">
        {/* Rows per page dropdown */}
        <div className="pagination__group">
          <span className="pagination__label">Rows per page:</span>
          <select 
            className="pagination__select" 
            onChange={e => onLimitChange(Number(e.target.value))} 
            value={limit}
          >
            {[10, 20, 50, 100].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>

        {/* Page X of Y */}
        <span className="pagination__info">
          Page {currentPage} of {totalPages}
        </span>
        <span className="pagination__info pagination__record-count">
          ({totalRecords} Total Records)
        </span>

        {/* Next/Previous Buttons */}
        <div className="pagination__group">
          <button
            className="pagination__button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            {/* [Prev Icon] */}
          </button>
          <button
            className="pagination__button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            {/* [Next Icon] */}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ServerSideTable