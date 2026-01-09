import React, { useState, useEffect,useMemo, useCallback } from 'react';
import { PO_COLUMNS_CONFIG } from '../../services/poService';
import './filterBar.css'
import './columnToggler.css'
// Defines all possible columns for the PO list
// Note: 'Balance Due' is included here for completeness based on acceptance criteria, 
// even if absent from the initial API spec.

/**
 * Manages which columns are visible in the table.
 * It uses internal state to track pending changes before 'Apply' is clicked.
 * * @param {object} props 
 * @param {string[]} props.visibleColumns The currently active columns passed from the parent state.
 * @param {function} props.onToggle The callback to apply changes back to the parent.
 */
const ColumnToggler = ({ allColumnsConfig, suppliers, users, statuses, onToggle }) => {     
    // State to manage the open/closed status of the dropdown
    const [isOpen, setIsOpen] = useState(false);
    const activeVisibleKeys = useMemo(() => {
        // Correctly extract the keys of columns marked as isVisible: true
        return allColumnsConfig
            .filter(c => c.isVisible)
            .map(c => c.key);
    }, [allColumnsConfig]); // Dependency: Only recalculate if the config prop changes
    
    // State to hold user selections before "Apply" is clicked (transient state)
    const [pendingKeys, setPendingKeys] = useState(activeVisibleKeys);

    const handleCheckboxChange = (key) => {
        setPendingKeys(prev => {
            if (prev.includes(key)) {
                // Cannot deselect required columns (like PO ID if enforced)
                const columnDef = allColumnsConfig.find(c => c.key === key);
                if (columnDef?.isRequired) return prev; 
                return prev.filter(col => col !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const handleApply = () => {
        if (pendingKeys.length === 0) {
            alert("Please select at least one column.");
            return;
        }
        // 1. Send the updated column list up to the parent view state
        onToggle(pendingKeys);
        // 2. Close the dropdown
        setIsOpen(false);
    };

    const handleReset = () => {
        // Reset to default columns (PO ID, Vendor, Status, Amount, Creator)
        const defaultKeys = PO_COLUMNS_CONFIG.filter(c=>c.isVisible).map(c => c.key)
        setPendingKeys(defaultKeys);
    };

    const handleCancel = () => {
        // Discard pending changes and revert to the currently active columns
        setPendingKeys(activeVisibleKeys);
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
                        {allColumnsConfig.map(col => (
                            <li key={col.key} className="checklist__item">
                                <label className="checklist__label">
                                    <input
                                        type="checkbox"
                                        className="checklist__checkbox"
                                        checked={pendingKeys.includes(col.key)}
                                        onChange={() => handleCheckboxChange(col.key)}
                                        disabled={col.isRequired && pendingKeys.includes(col.key)}
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
                                disabled={pendingKeys.length === 0}
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


const FilterBar = ({ 
    onSupplierChange, 
    onStatusChange, 
    initialSupplierId,
    initialStatus,
    onColumnToggle, 
    allColumnsConfig, 
    suppliers, 
    statuses, 
    sers}) => {

    const [selectedStatus, setSelectedStatus] = useState(initialStatus)
    const [selectedUser, setSelectedUser] = useState({})
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
                        value={initialSupplierId || ""}
                        onChange={(e) => {
                            const newID = Number(e.target.value)
                            // Call update on new supplier
                            onSupplierChange(newID)
                            }}
                        defaultValue=""
                    >
                        {suppliers.map(supplier => {
                            return (
                                <option
                                id = {supplier.supplier_id}
                                value={supplier.supplier_id}
                                >{supplier.name || "Unknown supplier"}</option>
                            )
                        })}
                        {/* Place the not selected option */}
                        <option value="">All Suppliers</option>
                    </select>
                </div>


                {/* Filtering control for Status (AC2: Filter by Status) */}

                <div className="filter-group__item">
                    <label className="filter-group__label" htmlFor="status-filter">Status:</label>
                    <select 
                        id="status-filter"
                        className="filter-group__input"
                        value={selectedStatus || ""}
                        onChange={(e) => {
                            const newStatus = String(e.target.value)
                            setSelectedStatus(newStatus)
                            // Call to update table based on newStatus
                            onStatusChange(newStatus)
                        }}
                        defaultValue=""
                    >
                        {statuses.map(status => {
                            console.log(`Observe single status: ${JSON.stringify(status)}`)
                            return (
                                <option id={status} value={status}>
                                    {status}
                                </option>
                            )
                        })}
                        <option value="">All Statuses</option>
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
            <ColumnToggler allColumnsConfig={allColumnsConfig} onToggle={onColumnToggle} />
        </div>
    );
};

export default FilterBar