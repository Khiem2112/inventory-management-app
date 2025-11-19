import React, { useState, useEffect } from 'react';
import './filterBar.css'
import './columnToggler.css'
// Defines all possible columns for the PO list
// Note: 'Balance Due' is included here for completeness based on acceptance criteria, 
// even if absent from the initial API spec.
const allColumns = [
    { key: 'po_id', label: 'PO Number', isRequired: true },
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'created_date', label: 'Created Date' },
    { key: 'status', label: 'Status' },
    { key: 'total_amount', label: 'Total Amount' },
    { key: 'creator_name', label: 'Creator Name' },
    { key: 'balance_due', label: 'Balance Due' },
];

/**
 * Manages which columns are visible in the table.
 * It uses internal state to track pending changes before 'Apply' is clicked.
 * * @param {object} props 
 * @param {string[]} props.visibleColumns The currently active columns passed from the parent state.
 * @param {function} props.onToggle The callback to apply changes back to the parent.
 */
const ColumnToggler = ({ visibleColumns, onToggle }) => {
    // State to manage the open/closed status of the dropdown
    const [isOpen, setIsOpen] = useState(false);
    
    // State to hold user selections before "Apply" is clicked (transient state)
    const [pendingColumns, setPendingColumns] = useState(visibleColumns);

    // Sync internal state when parent's visibleColumns prop changes (e.g., after initial load or reset)
    useEffect(() => {
        setPendingColumns(visibleColumns);
    }, [visibleColumns]);

    const handleCheckboxChange = (key) => {
        setPendingColumns(prev => {
            if (prev.includes(key)) {
                // Cannot deselect required columns (like PO ID if enforced)
                const columnDef = allColumns.find(c => c.key === key);
                if (columnDef?.isRequired) return prev; 
                return prev.filter(col => col !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const handleApply = () => {
        if (pendingColumns.length === 0) {
            alert("Please select at least one column.");
            return;
        }
        // 1. Send the updated column list up to the parent view state
        onToggle(pendingColumns);
        // 2. Close the dropdown
        setIsOpen(false);
    };

    const handleReset = () => {
        // Reset to default columns (PO ID, Vendor, Status, Amount, Creator)
        const defaultKeys = allColumns.map(c => c.key).filter(k => 
            ['po_id', 'vendor_name', 'status', 'total_amount', 'creator_name'].includes(k)
        );
        setPendingColumns(defaultKeys);
    };

    const handleCancel = () => {
        // Discard pending changes and revert to the currently active columns
        setPendingColumns(visibleColumns);
        setIsOpen(false);
    };

    return (
        <div className="column-toggler">
            <button 
                className="column-toggler__trigger filter-bar__column-toggler" 
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="column-checklist"
                aria-label="Toggle visible columns"
            >
                {/* [Icon of a checklist or columns] */} Columns
            </button>

            {isOpen && (
                <div id="column-checklist" className="column-toggler__flyout">
                    <ul className="flyout__checklist checklist">
                        {allColumns.map(col => (
                            <li key={col.key} className="checklist__item">
                                <label className="checklist__label">
                                    <input
                                        type="checkbox"
                                        className="checklist__checkbox"
                                        checked={pendingColumns.includes(col.key)}
                                        onChange={() => handleCheckboxChange(col.key)}
                                        disabled={col.isRequired && pendingColumns.includes(col.key)}
                                    />
                                    {col.label}
                                </label>
                                {col.isRequired && (
                                    <span className="checklist__required-tag">(Required)</span>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="flyout__actions actions">
                        <button className="actions__button actions__button--secondary" onClick={handleReset}>
                            Reset to Default
                        </button>
                        <div className="actions__group">
                            <button className="actions__button actions__button--cancel" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button 
                                className="actions__button actions__button--primary" 
                                onClick={handleApply}
                                disabled={pendingColumns.length === 0}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const FilterBar = ({ onFilterChange, onColumnToggle, visibleColumns }) => {
    return (
        <div className="filter-bar">
            
            <div className="filter-bar__controls filter-group">
                {/* Filtering control for Vendor (AC2: Filter by Vendor ID) 
                  This uses a mock select/dropdown to show field targeting.
                */}
                <div className="filter-group__item">
                    <label className="filter-group__label" htmlFor="vendor-filter">Vendor:</label>
                    <select 
                        id="vendor-filter"
                        className="filter-group__input"
                        onChange={(e) => onFilterChange({ vendor_id: e.target.value })}
                        defaultValue=""
                    >
                        <option value="">All Vendors</option>
                        <option value="vendor-apple">Apple Distribution Inc.</option>
                        <option value="vendor-samsung">Samsung Electronics</option>
                    </select>
                </div>

                {/* Filtering control for Status (AC2: Filter by Status) */}
                <div className="filter-group__item">
                    <label className="filter-group__label" htmlFor="status-filter">Status:</label>
                    <select 
                        id="status-filter"
                        className="filter-group__input"
                        onChange={(e) => onFilterChange({ status: e.target.value })}
                        defaultValue=""
                    >
                        <option value="">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Partially Received">Partially Received</option>
                        <option value="Fulfilled">Fulfilled</option>
                    </select>
                </div>

                {/* Example: Date Range Filter (Placeholder) */}
                <div className="filter-group__item">
                    <label className="filter-group__label" htmlFor="date-range">Created Date:</label>
                    <input 
                        id="date-range"
                        type="date"
                        className="filter-group__input"
                        // onChange logic here
                    />
                </div>
            </div>

            {/* Column Toggler (AC1: Toggle visibility of fields) */}
            {/* Renders the placeholder component created above */}
            <ColumnToggler onToggle={onColumnToggle} visibleColumns={visibleColumns} />
        </div>
    );
};

export default FilterBar