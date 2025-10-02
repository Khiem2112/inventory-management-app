// ZoneCardMUI.jsx

import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box } from '@mui/material';

/**
 * Renders a single warehouse zone information card using Material-UI.
 */
const ZoneCard = ({ title, description, imageUrl, imageAlt }) => {
  // Define the primary blue color for consistency
  const PRIMARY_COLOR = '#42a5f5';

  return (
    <Card 
      sx={{ 
        // 1. Ensures the card height matches its Grid container height
        height: '100%', 
        
        // Base styling for the "paper" look
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 3, 
        
        // Transition for smooth hover effect
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        
        // 2. The Hover Effect: Lift and stronger shadow
        '&:hover': {
          transform: 'translateY(-6px)', // Lifts the card slightly
          boxShadow: 10, // Stronger shadow for a pronounced "raised" look
          cursor: 'pointer', // Suggests interactivity
        },
      }}
    >
      <CardMedia
        component="img"
        height="190" // Fixed height for consistent image size
        image={imageUrl}
        alt={imageAlt}
        sx={{ objectFit: 'cover' }}
      />
      
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Typography   
          gutterBottom 
          variant="h5" 
          component="h2"
          sx={{ color: PRIMARY_COLOR, fontWeight: 600 }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ZoneCard;