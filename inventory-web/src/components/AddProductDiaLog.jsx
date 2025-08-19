// src/components/AddProductDialog.jsx

import {
  Dialog,
  TextField,
  Button,
  DialogTitle,
  DialogActions,
  DialogContent,
  Select,
  MenuItem,
  Box // 💡 Import Box for the form wrapper
} from "@mui/material";
import { useState } from "react";

// The component now receives open and onClose as props
const AddProductDialog = ({ open, onClose }) => {
  const [currentMeasurement, setCurrentMeasurement] = useState(""); // 💡 Initial state should be an empty string

  const handleSelectMeasurement = (event) => {
    setCurrentMeasurement(event.target.value);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add new product</DialogTitle>
      <DialogContent>
        {/* 💡 Use a <Box> component with component="form" as a semantic form wrapper */}
        <Box component="form">
          <TextField label="Product Name" fullWidth margin="normal" />
          <Select
            labelId="select-measurement-unit"
            id="select-measurement"
            value={currentMeasurement}
            label="Measurement Unit"
            onChange={handleSelectMeasurement}
          >
            {/* 💡 Add some menu items */}
            <MenuItem value="kg">kg</MenuItem>
            <MenuItem value="L">L</MenuItem>
            <MenuItem value="pcs">pcs</MenuItem>
          </Select>
          <TextField label="Selling Price" fullWidth margin="normal" />
          <TextField label="Internal Price" fullWidth margin="normal" />
        </Box>
      </DialogContent>
      <DialogActions>
        {/* The onClose prop handles the close event */}
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProductDialog;