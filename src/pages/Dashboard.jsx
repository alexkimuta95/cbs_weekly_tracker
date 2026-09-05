import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
} from "@mui/material";

import {
  People,
  CheckCircle,
  PendingActions,
  Warning,
} from "@mui/icons-material";

import StatCard from "../components/StatCard";
import { getUsers } from "../services/api";

function Dashboard() {
  const [users, setUsers] = useState([]);
  const [weeklyMeeting, setweeklyMeeting] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}

      <Typography variant="h4" fontWeight={700}>
        Dashboard
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mt: 1, mb: 4 }}
      >
        Weekly CBS overview
      </Typography>

      {/* Statistics */}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Members"
            value={users.length}
            icon={<People fontSize="large" />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Completed"
            value="0"
            icon={<CheckCircle fontSize="large" />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Pending"
            value="0"
            icon={<PendingActions fontSize="large" />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Issues"
            value="0"
            icon={<Warning fontSize="large" />}
          />
        </Grid>
      </Grid>

      {/* Team table */}

      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            Members
          </Typography>
        </Box>

        {loading && (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        {!loading && !error && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Completed</strong></TableCell>
                <TableCell><strong>Pending</strong></TableCell>
                <TableCell><strong>Blocked</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>

                  <TableCell>
                    {user.role}
                  </TableCell>

                  <TableCell>0</TableCell>

                  <TableCell>0</TableCell>

                  <TableCell>0</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}

export default Dashboard;