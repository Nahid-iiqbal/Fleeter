import re

with open('src/pages/DriverPortal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports
imports_to_add = '''import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Button,
  Paper
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountSettings from "../components/AccountSettings";
'''
content = content.replace('import CompanyRequests from "../components/CompanyRequests";', 'import CompanyRequests from "../components/CompanyRequests";\n' + imports_to_add)

# Replace the layout
layout_start = content.find('  return (\n    <div style={styles.appContainer}>')
layout_end = content.find('        {/* --- DASHBOARD VIEW --- */}')

new_layout = '''  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' },
        }}
      >
        <Box p={2} sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
          <Typography variant="h6" fontWeight="bold">Fleeter OS</Typography>
          <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
            Welcome, {driverStats.name}
          </Typography>
          {!driverStats.driverProfileMissing && (
            <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
              🏢 {driverStats.companyName}
            </Typography>
          )}
        </Box>
        <List sx={{ flexGrow: 1 }}>
          <ListItem disablePadding>
            <ListItemButton selected={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')}>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={currentView === 'history'} onClick={() => setCurrentView('history')}>
              <ListItemText primary="Trip History" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={currentView === 'profile'} onClick={() => setCurrentView('profile')}>
              <ListItemText primary="My Profile & Docs" />
            </ListItemButton>
          </ListItem>
        </List>
        <Box p={2}>
          <Typography variant="overline" color="textSecondary">Trip Actions</Typography>
          <Button fullWidth variant="outlined" color="info" sx={{ mb: 1 }} disabled={!canAccessTripFeatures} onClick={() => setIsFuelModalOpen(true)}>Log Fuel</Button>
          <Button fullWidth variant="outlined" color="error" sx={{ mb: 1 }} disabled={!canAccessTripFeatures} onClick={() => setIsIncidentModalOpen(true)}>Report Incident</Button>
          <Button fullWidth variant="outlined" color="warning" sx={{ mb: 1 }} disabled={!canAccessTripFeatures} onClick={() => setIsMaintenanceModalOpen(true)}>Maintenance</Button>
        </Box>
        <Box p={2}>
          <Button fullWidth variant="contained" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>Driver Portal</Typography>
            <IconButton color="inherit" onClick={() => setCurrentView('settings')}>
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
          {driverStats.driverProfileMissing && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
              ⚠️ Action Required: Your account is not linked to a Driver profile in the database. Contact your fleet admin.
            </Paper>
          )}
          {driverStats.alerts > 0 && !driverStats.driverProfileMissing && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              ⚠️ Action Required: You have {driverStats.alerts} document alert(s) pending. Check your profile.
            </Paper>
          )}

          {currentView === 'settings' && <AccountSettings />}

'''

if layout_start != -1 and layout_end != -1:
    content = content[:layout_start] + new_layout + content[layout_end:]

# Replace closing tags at the very bottom of return statement
content = content.replace('      </main>\n    </div>\n  );\n}', '        </Box>\n      </Box>\n    </Box>\n  );\n}')

with open('src/pages/DriverPortal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
