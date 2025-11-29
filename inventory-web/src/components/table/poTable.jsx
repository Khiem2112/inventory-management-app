// src/components/ServerSideTable/ServerSideTable.jsx
import StatusBadge from "../status/statusBadge";
import './poTable.css'

const ServerSideTable = ({ data, limit, loading, columnsConfig }) => {

  // Loading State (on_load)
  if (loading) {
    return (
      <div className="table-container table-container--loading">
        {/* Placeholder/Skeleton Rows (visual_states: on_load) */}
        {[...Array(limit)].map((_, index) => (
          <div key={index} className="table__skeleton-row" />
        ))}
      </div>
    );
  }

  // Empty State (on_empty)
  if (!data || data.length === 0) {
     return (
        <div className="table-container">
            <table className="data-table">
                <thead className="data-table__header">
                    <tr>
                        {columnsConfig.map(col => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colSpan={columnsConfig.length}>
                            No Purchase Orders found.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
     )
  }

  const emptyRowsCount = Math.max(0, limit - data.length);
  const ROW_HEIGHT = 60;
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
                    {/* Render actual data */}
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
                    {/* Render empty data */}
                    {emptyRowsCount > 0 &&
                    [...Array(emptyRowsCount)].map((_, index) => (
                    <tr key={`empty-${index}`} className="body__row body__row--empty">
                        {/* Render empty cells if you want vertical borders, 
                            OR just one spanning cell if you want blank space */}
                        <td colSpan={columnsConfig.length} />
                    </tr>
                    ))
                }
                </tbody>
            </table>

        </div>
    );
};

export default ServerSideTable;