import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import PropTypes from 'prop-types';

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const theme = useTheme();
  const label = status.toLowerCase().trim();

  // 1. Map statuses to THEME keys (Primary, Success, Error, Warning, Info)
  const statusConfig = {
    'draft':        { color: theme.palette.pending.main,    label: 'Draft' },
    'issued':       { color: theme.palette.primary.main, label: 'Issued' },
    'pending':      { color: theme.palette.warning.main, label: 'Pending' },
    'acknowledged': { color: theme.palette.secondary.main,label: 'Acknowledged' },
    'delivered':    { color: theme.palette.info.dark,    label: 'Delivered' },
    'received':     { color: theme.palette.success.main,  label: 'Received' },
    'cancelled':    { color: theme.palette.error.main,    label: 'Cancelled' },
  };

  // Fallback if status is unknown
  const config = statusConfig[label] || { color: theme.palette.grey[500], label: status };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1.5,
        py: 0.5,
        borderRadius: '9999px', // Maintains the 'Pill' shape from your CSS
        bgcolor: alpha(config.color, 0.12), // Subtle transparent background
        border: `1px solid ${alpha(config.color, 0.3)}`,
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: config.color,
          fontWeight: 700, // Matches your bold preference
          textTransform: 'capitalize',
          fontSize: '0.75rem',
          lineHeight: 1,
        }}
      >
        {config.label}
      </Typography>
    </Box>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

export default StatusBadge;