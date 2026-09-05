import { Box } from "@mui/material";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <Box
        sx={{
          flexGrow: 1,
          backgroundColor: "#f5f7fa",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout;