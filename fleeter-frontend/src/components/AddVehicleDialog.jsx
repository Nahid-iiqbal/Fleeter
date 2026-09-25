import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { apiFetch } from "../utils/api";

const initialValues = {
  registration_no: "",
  brand: "",
  type: "",
  model: "",
  year: "",
  capacity: "",
  fuel_type: "",
  condition_status: "good",
  availability_status: "available",
};

function AddVehicleDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageCount, setImageCount] = useState(0);
  const [docCount, setDocCount] = useState(0);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleClose = () => {
    if (!saving) {
      setOpen(false);
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const formData = new FormData(event.currentTarget);
      await apiFetch("/api/vehicles", { method: "POST", body: formData });
      setValues(initialValues);
      setImageCount(0);
      setDocCount(0);
      setOpen(false);
      onCreated();
    } catch (submitError) {
      setError(submitError.message || "Unable to add vehicle.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} sx={{ height: 40, whiteSpace: "nowrap", minWidth: "max-content" }}>
        Add New Vehicle
      </Button>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add New Vehicle</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Registration no." name="registration_no" value={values.registration_no} onChange={handleChange} required fullWidth autoFocus />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Brand" name="brand" value={values.brand} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Type" name="type" value={values.type} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Model name" name="model" value={values.model} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Year" name="year" type="number" value={values.year} onChange={handleChange} slotProps={{ htmlInput: { min: 1886, max: new Date().getFullYear() + 1 } }} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Capacity" name="capacity" type="number" value={values.capacity} onChange={handleChange} slotProps={{ htmlInput: { min: 0 } }} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Fuel type" name="fuel_type" value={values.fuel_type} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Condition status</InputLabel>
                  <Select fullWidth label="Condition status" name="condition_status" value={values.condition_status} onChange={handleChange}>
                    <MenuItem value="good">Good</MenuItem>
                    <MenuItem value="needs_service">Needs service</MenuItem>
                    <MenuItem value="in_maintenance">In maintenance</MenuItem>
                    <MenuItem value="retired">Retired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Availability</InputLabel>
                  <Select fullWidth label="Availability" name="availability_status" value={values.availability_status} onChange={handleChange}>
                    <MenuItem value="available">Available</MenuItem>
                    <MenuItem value="dispatched">Dispatched</MenuItem>
                    <MenuItem value="reserved">Reserved</MenuItem>
                    <MenuItem value="unavailable">Unavailable</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={2} sx={{ width: { xs: '100%', sm: 400 } }}>
                  <Box>
                    <Button variant="outlined" component="label" fullWidth sx={{ justifyContent: 'flex-start', height: 40, whiteSpace: "nowrap" }}>
                      Choose registration document (Required)
                      <input
                        hidden
                        type="file"
                        name="registrationDocument"
                        accept="image/*,.pdf"
                        required
                        onChange={(event) => setDocCount(event.target.files.length)}
                      />
                    </Button>
                    {docCount > 0 && <Typography variant="caption" display="block" sx={{ mt: 0.5, ml: 1, color: 'success.main' }}>{docCount} file selected</Typography>}
                  </Box>

                  <Box>
                    <Button variant="outlined" component="label" fullWidth sx={{ justifyContent: 'flex-start', height: 40, whiteSpace: "nowrap" }}>
                      Choose vehicle images (Optional)
                      <input
                        hidden
                        type="file"
                        name="vehicleImages"
                        accept="image/*"
                        multiple
                        onChange={(event) => setImageCount(event.target.files.length)}
                      />
                    </Button>
                    {imageCount > 0 && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.5, ml: 1, color: 'success.main' }}>
                        {imageCount} file{imageCount === 1 ? "" : "s"} selected
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} variant="outlined" color="primary" disabled={saving} sx={{ minWidth: 120 }}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving} sx={{ minWidth: 120 }}>
              {saving ? "Saving..." : "Add Vehicle"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default AddVehicleDialog;
