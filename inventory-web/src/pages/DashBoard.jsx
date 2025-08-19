// src/Dashboard.jsx

import React from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress, Alert,Button } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import BadgeIcon from '@mui/icons-material/Badge';
import KeyIcon from '@mui/icons-material/Key';

import { useAuth } from '../context/AuthContext';
import useFetchUserData from '../hooks/User/useFetchUserData';

function Dashboard() {
  const { userData,logout } = useAuth(); // Get decoded JWT data
  const { isFetchingUserData, userDetailData, fetchUserDataError } = useFetchUserData(); // Fetch full user data

  // Render different content based on the data fetching state
  if (isFetchingUserData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading user data...</Typography>
      </Box>
    );
  }

  if (fetchUserDataError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Alert severity="error">
          <Typography variant="h6">Failed to load user data:</Typography>
          <Typography>{fetchUserDataError}</Typography>
        </Alert>
      </Box>
    );
  }

  // Once data is loaded, render the full UI
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '80vh',
        p: 4,
        textAlign: 'center',
        bgcolor: '#f5f5f5', // A neutral background
        borderRadius: '16px',
        m: 2,
      }}
    >
      <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#333' }}>
        Welcome back, {userData?.username || 'User'}!
      </Typography>
      <Button variant="contained" color="error" onClick={logout} sx={{ mt: 2 }}>
        Logout
      </Button>
      <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
        This is your personalized dashboard. Below is your detailed information.
      </Typography>

      {/* Main user info card */}
      <Card sx={{ maxWidth: 600, width: '100%', borderRadius: '12px', boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" component="div" sx={{ mb: 2, borderBottom: '2px solid #ddd', pb: 1 }}>
            User Profile
          </Typography>
          
          <Grid container spacing={2} justifyContent="center" alignItems="flex-start">
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon sx={{ mr: 1, color: '#42a5f5' }} />
                <Typography variant="body1">
                  <strong>Username:</strong> {userDetailData?.Username}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BadgeIcon sx={{ mr: 1, color: '#42a5f5' }} />
                <Typography variant="body1">
                  <strong>Full Name:</strong> {userDetailData?.Name}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocalPhoneIcon sx={{ mr: 1, color: '#42a5f5' }} />
                <Typography variant="body1">
                  <strong>Phone:</strong> {userDetailData?.Phone}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <KeyIcon sx={{ mr: 1, color: '#42a5f5' }} />
                <Typography variant="body1">
                  <strong>Role ID:</strong> {userDetailData?.RoleId}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              {/* This is how we'd display more fields */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#888' }}>
                  User ID: {userDetailData?.UserId}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Dashboard;