// src/components/StatusBadge/StatusBadge.jsx

const StatusBadge = ({ status }) => {
  let mod = status.toLowerCase().replace(/\s/g, '-');
  
  // Example mapping for consistency with AC5
  if (mod === 'partially-received') {
    mod = 'partial';
  } else if (mod === 'fulfilled') {
    mod = 'fulfilled';
  } else if (mod === 'open') {
    mod = 'open';
  } else {
    mod = 'default';
  }

  return (
    <span className={`status-badge status-badge--${mod}`}>
      {status}
    </span>
  );
};
export default StatusBadge
// ... propTypes etc.

// Example usage: <StatusBadge status="Partially Received" />