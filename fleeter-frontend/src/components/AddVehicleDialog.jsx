import React, { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
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
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
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
                <TextField label="Year" name="year" type="number" value={values.year} onChange={handleChange} inputProps={{ min: 1886, max: new Date().getFullYear() + 1 }} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Capacity" name="capacity" type="number" value={values.capacity} onChange={handleChange} inputProps={{ min: 0 }} fullWidth />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Fuel type" name="fuel_type" value={values.fuel_type} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Condition status</InputLabel>
                  <Select label="Condition status" name="condition_status" value={values.condition_status} onChange={handleChange}>
                    <MenuItem value="good">Good</MenuItem>
                    <MenuItem value="needs_service">Needs service</MenuItem>
                    <MenuItem value="in_maintenance">In maintenance</MenuItem>
                    <MenuItem value="retired">Retired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Availability</InputLabel>
                  <Select label="Availability" name="availability_status" value={values.availability_status} onChange={handleChange}>
                    <MenuItem value="available">Available</MenuItem>
                    <MenuItem value="dispatched">Dispatched</MenuItem>
                    <MenuItem value="reserved">Reserved</MenuItem>
                    <MenuItem value="unavailable">Unavailable</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Registration document" name="registrationDocument" type="file" required inputProps={{ accept: "image/*,.pdf" }} fullWidth InputLabelProps={{ shrink: true }} helperText="Required. Upload one registration document." />
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" component="label">
                  Choose vehicle images
                  <input
                    hidden
                    type="file"
                    name="vehicleImages"
                    accept="image/*"
                    multiple
                    onChange={(event) => setImageCount(event.target.files.length)}
                  />
                </Button>
                {imageCount > 0 && ` ${imageCount} image${imageCount === 1 ? "" : "s"} selected`}
                <Alert severity="info" icon={false} sx={{ mt: 1 }}>
                  Optional. You can select multiple images.
                </Alert>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="inherit" disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Saving..." : "Add Vehicle"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}

export default AddVehicleDialog;
