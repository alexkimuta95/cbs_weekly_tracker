import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import {
  Save,
  Restore,
} from "@mui/icons-material";

const DEFAULT_SETTINGS = {
  applicationName: "CBS Weekly Tracker",
  weekStartsOn: "Monday",
  defaultReportPeriod: "30",
  notifications: true,
  showCarriedForward: true,
  showIssueSummary: true,
};

function Settings() {
  const [settings, setSettings] =
    useState(DEFAULT_SETTINGS);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });

  useEffect(() => {
    const savedSettings =
      localStorage.getItem("cbsTrackerSettings");

    if (savedSettings) {
      try {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(savedSettings),
        });
      } catch (error) {
        console.error(
          "Failed to load settings",
          error
        );
      }
    }
  }, []);

  function handleChange(field, value) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveSettings() {
    localStorage.setItem(
      "cbsTrackerSettings",
      JSON.stringify(settings)
    );

    setSnackbar({
      open: true,
      message: "Settings saved successfully",
    });
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);

    localStorage.setItem(
      "cbsTrackerSettings",
      JSON.stringify(DEFAULT_SETTINGS)
    );

    setSnackbar({
      open: true,
      message: "Settings restored to defaults",
    });
  }

  return (
    <Box sx={{ p: 4 }}>

      {/* HEADER */}

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          fontWeight={700}
        >
          Settings
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Configure your CBS Weekly Tracker preferences
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* APPLICATION SETTINGS */}

        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
              height: "100%",
            }}
          >
            <CardContent>

              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 0.5 }}
              >
                Application Settings
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                General application configuration.
              </Typography>

              <TextField
                fullWidth
                label="Application Name"
                value={settings.applicationName}
                onChange={(e) =>
                  handleChange(
                    "applicationName",
                    e.target.value
                  )
                }
                size="small"
              />

            </CardContent>
          </Card>
        </Grid>

        {/* WEEKLY MEETING SETTINGS */}

        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
              height: "100%",
            }}
          >
            <CardContent>

              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 0.5 }}
              >
                Weekly Meeting
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Configure how weekly reporting periods
                are calculated.
              </Typography>

              <FormControl
                fullWidth
                size="small"
                sx={{ mb: 2 }}
              >
                <InputLabel>
                  Week Starts On
                </InputLabel>

                <Select
                  value={settings.weekStartsOn}
                  label="Week Starts On"
                  onChange={(e) =>
                    handleChange(
                      "weekStartsOn",
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="Monday">
                    Monday
                  </MenuItem>

                  <MenuItem value="Sunday">
                    Sunday
                  </MenuItem>
                </Select>
              </FormControl>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                This controls the preferred start of a
                reporting week.
              </Typography>

            </CardContent>
          </Card>
        </Grid>

        {/* REPORT SETTINGS */}

        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
            }}
          >
            <CardContent>

              <Typography
                variant="h6"
                fontWeight={700}
              >
                Report Settings
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, mb: 3 }}
              >
                Configure the default reporting behaviour.
              </Typography>

              <Grid container spacing={3}>

                <Grid item xs={12} md={4}>
                  <FormControl
                    fullWidth
                    size="small"
                  >
                    <InputLabel>
                      Default Report Period
                    </InputLabel>

                    <Select
                      value={
                        settings.defaultReportPeriod
                      }
                      label="Default Report Period"
                      onChange={(e) =>
                        handleChange(
                          "defaultReportPeriod",
                          e.target.value
                        )
                      }
                    >
                      <MenuItem value="7">
                        Last 7 Days
                      </MenuItem>

                      <MenuItem value="30">
                        Last 30 Days
                      </MenuItem>

                      <MenuItem value="60">
                        Last 60 Days
                      </MenuItem>

                      <MenuItem value="90">
                        Last 90 Days
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

              </Grid>

            </CardContent>
          </Card>
        </Grid>

        {/* DISPLAY SETTINGS */}

        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
            }}
          >
            <CardContent>

              <Typography
                variant="h6"
                fontWeight={700}
              >
                Dashboard & Report Display
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, mb: 2 }}
              >
                Choose which information should be
                displayed in reports.
              </Typography>

              <SettingSwitch
                title="Show Carried-Forward Items"
                description="Display carried-forward tasks in reports."
                checked={settings.showCarriedForward}
                onChange={(value) =>
                  handleChange(
                    "showCarriedForward",
                    value
                  )
                }
              />

              <Divider />

              <SettingSwitch
                title="Show Issue Summary"
                description="Display issue and blocker information in reports."
                checked={settings.showIssueSummary}
                onChange={(value) =>
                  handleChange(
                    "showIssueSummary",
                    value
                  )
                }
              />

            </CardContent>
          </Card>
        </Grid>

        {/* NOTIFICATIONS */}

        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
            }}
          >
            <CardContent>

              <Typography
                variant="h6"
                fontWeight={700}
              >
                Notifications
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, mb: 2 }}
              >
                Configure application notifications.
              </Typography>

              <SettingSwitch
                title="Enable Notifications"
                description="Allow the tracker to display notification messages."
                checked={settings.notifications}
                onChange={(value) =>
                  handleChange(
                    "notifications",
                    value
                  )
                }
              />

            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* ACTIONS */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          mt: 3,
        }}
      >

        <Button
          variant="outlined"
          startIcon={<Restore />}
          onClick={resetSettings}
        >
          Restore Defaults
        </Button>

        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={saveSettings}
        >
          Save Settings
        </Button>

      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false,
          })
        }
        message={snackbar.message}
      />

    </Box>
  );
}

function SettingSwitch({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 1.5,
      }}
    >

      <Box>
        <Typography fontWeight={600}>
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {description}
        </Typography>
      </Box>

      <Switch
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
      />

    </Box>
  );
}

export default Settings;