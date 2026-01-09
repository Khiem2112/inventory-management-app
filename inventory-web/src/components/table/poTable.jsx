// src/components/ServerSideTable/ServerSideTable.jsx
import StatusBadge from "../status/statusBadge";
import './poTable.css'
import RowActions from "./rowActions";

const ServerSideTable = ({ 
    data, 
    limit, 
    loading,
    columnsConfig, 
    onRowClick, 
    selectedId
}) => {

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

        // 3. Add the 'actions' case
        if (column.type === 'actions') {            
            return (
                <RowActions 
                    item={item}
                />
            );
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
                    {data.map((item, index) => {
                        // 3. Highlight Logic
                        const isSelected = String(item.purchase_order_id) === String(selectedId);
                        return (
                            <tr 
                                key={item.purchase_order_id || index} 
                                className={`body__row ${isSelected ? 'body__row--selected' : ''}`}
                                // 4. Click Handler
                                onClick={() => onRowClick && onRowClick(item)}
                                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                            >
                                {columnsConfig.map(col => (
                                    <td key={col.key} className={`body__cell body__cell--${col.key}`}>
                                        <RenderCellData item={item} colKey={col.key} /> 
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                    {/* Render Empty Filler Rows */}
                    {emptyRowsCount > 0 && [...Array(emptyRowsCount)].map((_, index) => (
                        <tr 
                            key={`empty-${index}`} className="body__row--empty" 
                            style={{ 
                                border: null 
                                }}>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
};

export default ServerSideTable;