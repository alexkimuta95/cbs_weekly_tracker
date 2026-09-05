import {
  Dashboard,
  CalendarMonth,
  Warning,
  Assessment,
  History,
  Settings,
} from "@mui/icons-material";

import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import { Link } from "react-router-dom";

function Sidebar() {
  const menuItems = [
    {
      text: "Dashboard",
      icon: <Dashboard />,
      path: "/",
    },
    {
      text: "Weekly Meeting",
      icon: <CalendarMonth />,
      path: "/weekly-meeting",
    },
    {
      text: "Issues & Blockers",
      icon: <Warning />,
      path: "/issues",
    },
    {
      text: "Reports",
      icon: <Assessment />,
      path: "/reports",
    },
    {
      text: "History",
      icon: <History />,
      path: "/history",
    },
    {
      text: "Settings",
      icon: <Settings />,
      path: "/settings",
    },
  ];

  return (
    <Box
      sx={{
        width: 240,
        minHeight: "100vh",
        position:"fixed",
        top:0,
        left:0,
        backgroundColor: "#172033",
        color: "white",
        paddingTop: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          px: 3,
          mb: 4,
        }}
      >
        CBS Weekly Tracker
      </Typography>

      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            component={Link}
            to={item.path}
            sx={{
              color: "white",
              mx: 1,
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon sx={{ color: "white" }}>
              {item.icon}
            </ListItemIcon>

            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

export default Sidebar;