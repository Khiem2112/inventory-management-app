// src/components/StatusBadge/StatusBadge.jsx
import PropTypes from 'prop-types'; // Good practice to include
import './status-badge.css';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  // 1. Normalize the input (safe against case and whitespace)
  const normalizedStatus = status.toLowerCase().trim();

  // 2. Define the Configuration Map
  // Keys match the normalized input; Values match the CSS modifier class
  const STATUS_MAP = {
    'issued': 'issued',
    'acknowledged': 'acknowledged',
    'delivered': 'delivered',
    'received': 'received',
    'checked': 'checked',
  };

  // 3. Resolve the modifier (Default to 'default' if not found)
  const mod = STATUS_MAP[normalizedStatus] || 'default';

  return (
    <span className={`status-badge status-badge--${mod}`}>
      {status}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

export default StatusBadge;