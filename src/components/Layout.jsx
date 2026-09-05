import { Box } from "@mui/material";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <Box
        sx={{
         flexGrow: 1,
        marginLeft: "240px",
         minHeight: "100vh",
          backgroundColor: "#f5f7fa",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout;