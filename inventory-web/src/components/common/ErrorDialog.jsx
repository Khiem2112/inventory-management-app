import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogContentText, 
    DialogActions, 
    Button,
    Box,
    Typography
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const ErrorDialog = ({ open, onClose, error, title = "Error" }) => {
    // Helper to extract the message safely
    const getErrorMessage = (err) => {
        if (!err) return "An unknown error occurred.";
        
        // 1. Handle your specific API structure: { detail: "..." }
        if (err.detail) return err.detail;
        
        // 2. Handle Axios error response structure
        if (err.response?.data?.detail) return err.response.data.detail;
        if (err.response?.data?.message) return err.response.data.message;
        
        // 3. Handle standard Error object
        if (err.message) return err.message;
        
        // 4. Handle string
        if (typeof err === 'string') return err;

        return "An unexpected error format was received.";
    };

    const message = getErrorMessage(error);

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            aria-labelledby="error-dialog-title"
            aria-describedby="error-dialog-description"
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="error-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                <ErrorOutlineIcon />
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="error-dialog-description">
                    <Box sx={{ 
                        bgcolor: '#fff4f4', 
                        p: 2, 
                        borderRadius: 1, 
                        border: '1px solid #ffcdd2',
                        color: 'text.primary' 
                    }}>
                        <Typography variant="body1" component="span" fontWeight={500}>
                            {message}
                        </Typography>
                    </Box>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" autoFocus>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ErrorDialog;