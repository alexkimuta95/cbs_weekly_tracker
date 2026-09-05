import { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import {
  CheckCircle,
  PendingActions,
  Autorenew,
} from "@mui/icons-material";

import {
  getUsers,
  getHistory,
  getWeeklyUpdate,
} from "../services/api";

function formatDate(dateString) {
  if (!dateString) return "";

  return new Date(
    `${dateString}T00:00:00`
  ).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function History() {
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);

  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("");

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadUsers();
  }, []);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);

      try {
        const data = await getHistory(
          selectedUser,
          selectedWeek
        );

        setHistory(data);

        if (data.length > 0) {
          loadDetails(data[0]);
        } else {
          setSelectedRecord(null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    async function loadDetails(record) {
      setLoadingDetails(true);

      try {
        const data = await getWeeklyUpdate(
          record.user_id,
          record.week_start
        );

        setSelectedRecord(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingDetails(false);
      }
    }

    loadHistory();
  }, [selectedUser, selectedWeek]);

  async function handleSelectRecord(record) {
    setLoadingDetails(true);

    try {
      const data = await getWeeklyUpdate(
        record.user_id,
        record.week_start
      );

      setSelectedRecord(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDetails(false);
    }
  }

  const achievements =
    selectedRecord?.tasks?.filter(
      (task) =>
        task.type === "achievement" &&
        task.status === "completed"
    ) || [];

  const pending =
    selectedRecord?.tasks?.filter(
      (task) =>
        task.type === "pending" &&
        task.status === "pending"
    ) || [];

  const carriedForward =
    selectedRecord?.tasks?.filter(
      (task) => task.carried_forward === true
    ) || [];

  return (
    <Box sx={{ p: 4 }}>

      {/* Header */}

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={700}
        >
          History
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Review previous weekly meetings,
          achievements, pending items and
          management actions.
        </Typography>
      </Box>


      {/* Filters */}

      <Card
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 3,
          mb: 3,
        }}
      >
        <CardContent>

          <Grid container spacing={3}>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>
                  Team Member
                </InputLabel>

                <Select
                  value={selectedUser}
                  label="Team Member"
                  onChange={(e) =>
                    setSelectedUser(e.target.value)
                  }
                >
                  <MenuItem value="all">
                    All Team Members
                  </MenuItem>

                  {users.map((user) => (
                    <MenuItem
                      key={user.id}
                      value={user.id}
                    >
                      {user.name} — {user.role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>


            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Week Starting
                </Typography>

                <input
                  type="date"
                  value={selectedWeek}
                  onChange={(e) =>
                    setSelectedWeek(e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "4px",
                    border: "1px solid #c4c4c4",
                    fontSize: "16px",
                  }}
                />
              </Box>
            </Grid>

          </Grid>

        </CardContent>
      </Card>


      {loading ? (

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 8,
          }}
        >
          <CircularProgress />
        </Box>

      ) : (

        <Grid container spacing={3}>

          {/* History list */}

          <Grid size={{ xs: 12, md: 5 }}>

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
                  fontWeight={600}
                  sx={{ mb: 2 }}
                >
                  Weekly Records
                </Typography>

                {history.length === 0 ? (

                  <Typography
                    color="text.secondary"
                  >
                    No historical records found.
                  </Typography>

                ) : (

                  history.map((record) => (

                    <Box
                      key={record.id}
                      onClick={() =>
                        handleSelectRecord(record)
                      }
                      sx={{
                        p: 2,
                        mb: 1.5,
                        border: "1px solid #e5e7eb",
                        borderRadius: 2,
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#f9fafb",
                        },
                      }}
                    >

                      <Typography
                        fontWeight={600}
                      >
                        {record.user_name}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {formatDate(record.week_start)}
                        {" — "}
                        {formatDate(record.week_end)}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          mt: 1.5,
                          flexWrap: "wrap",
                        }}
                      >

                        <Chip
                          size="small"
                          label={`${record.achievements} achievements`}
                          icon={<CheckCircle />}
                        />

                        <Chip
                          size="small"
                          label={`${record.pending} pending`}
                          icon={<PendingActions />}
                        />

                        {record.carried_forward > 0 && (
                          <Chip
                            size="small"
                            label={`${record.carried_forward} carried`}
                            icon={<Autorenew />}
                          />
                        )}

                      </Box>

                    </Box>

                  ))

                )}

              </CardContent>

            </Card>

          </Grid>


          {/* Details */}

          <Grid size={{ xs: 12, md: 7 }}>

            {loadingDetails ? (

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 8,
                }}
              >
                <CircularProgress />
              </Box>

            ) : selectedRecord ? (

              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 3,
                }}
              >

                <CardContent>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                  >
                    Weekly Meeting
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{ mt: 0.5, mb: 3 }}
                  >
                    {formatDate(selectedRecord.week_start)}
                    {" — "}
                    {formatDate(selectedRecord.week_end)}
                  </Typography>


                  <Typography
                    variant="h6"
                    fontWeight={600}
                  >
                    Weekly Summary
                  </Typography>

                  <Typography
                    sx={{
                      mt: 1,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedRecord.summary ||
                      "No summary recorded."}
                  </Typography>


                  <Divider sx={{ my: 3 }} />


                  <Typography
                    variant="h6"
                    fontWeight={600}
                  >
                    Achievements
                  </Typography>

                  <Box sx={{ mt: 1 }}>

                    {achievements.length === 0 ? (

                      <Typography
                        color="text.secondary"
                      >
                        No achievements recorded.
                      </Typography>

                    ) : (

                      achievements.map((task) => (
                        <Typography
                          key={task.id}
                          sx={{ py: 0.7 }}
                        >
                          ✓ {task.title}
                        </Typography>
                      ))

                    )}

                  </Box>


                  <Divider sx={{ my: 3 }} />


                  <Typography
                    variant="h6"
                    fontWeight={600}
                  >
                    Pending Items
                  </Typography>

                  <Box sx={{ mt: 1 }}>

                    {pending.length === 0 ? (

                      <Typography
                        color="text.secondary"
                      >
                        No pending items.
                      </Typography>

                    ) : (

                      pending.map((task) => (

                        <Box
                          key={task.id}
                          sx={{
                            py: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >

                          <Typography>
                            ○ {task.title}
                          </Typography>

                          {task.carried_forward && (
                            <Chip
                              size="small"
                              label="Carried Forward"
                              icon={<Autorenew />}
                            />
                          )}

                        </Box>

                      ))

                    )}

                  </Box>


                  <Divider sx={{ my: 3 }} />


                  <Typography
                    variant="h6"
                    fontWeight={600}
                  >
                    Manager Comments / Actions
                  </Typography>

                  <Typography
                    sx={{
                      mt: 1,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedRecord.manager_comments ||
                      "No management comments recorded."}
                  </Typography>

                </CardContent>

              </Card>

            ) : (

              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography color="text.secondary">
                    Select a weekly record to view its details.
                  </Typography>
                </CardContent>
              </Card>

            )}

          </Grid>

        </Grid>

      )}

    </Box>
  );
}

export default History;