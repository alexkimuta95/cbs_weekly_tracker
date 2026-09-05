import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

import {
  Add,
  Delete,
  CheckCircle,
  PendingActions,
} from "@mui/icons-material";

import {
  getUsers,
  getWeeklyUpdate,
  saveWeeklyUpdate,
  createTask,
  deleteTask,
  getCarryForwardItems,
 carryForwardTask,
} from "../services/api";

function getMonday() {
  const date = new Date();
  const day = date.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + diff);

  return date.toISOString().split("T")[0];
}


function getSunday(monday) {
  const date = new Date(`${monday}T00:00:00`);

  date.setDate(date.getDate() + 6);

  return date.toISOString().split("T")[0];
}


function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function WeeklyMeeting() {

  const [users, setUsers] = useState([]);

  const [selectedUser, setSelectedUser] = useState("");

  const [weekStart, setWeekStart] = useState(getMonday());

  const [weeklyUpdate, setWeeklyUpdate] = useState(null);

  const [summary, setSummary] = useState("");

  const [managerComments, setManagerComments] = useState("");

  const [tasks, setTasks] = useState([]);

  const [newAchievement, setNewAchievement] = useState("");

  const [newPending, setNewPending] = useState("");

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [carryForward, setCarryForward] = useState([]);
  const [loadingCarryForward, setLoadingCarryForward] = useState(false);


  // Load users

  useEffect(() => {

    async function loadUsers() {

      try {

        const data = await getUsers();

        setUsers(data);

        if (data.length > 0) {
          setSelectedUser(data[0].id);
        }

      } catch (error) {

        console.error(error);

      }

    }

    loadUsers();

  }, []);

  // carry forward
  useEffect(() => {

  if (!selectedUser || !weekStart) {
    return;
  }

  async function loadCarryForward() {

    setLoadingCarryForward(true);

    try {

      const data = await getCarryForwardItems(
        selectedUser,
        weekStart
      );

      setCarryForward(data);

    } catch (error) {

      console.error(
        "Carry forward:",
        error
      );

    } finally {

      setLoadingCarryForward(false);

    }

  }

  loadCarryForward();

}, [selectedUser, weekStart]);


  // Load weekly update

  useEffect(() => {

    if (!selectedUser || !weekStart) {
      return;
    }

    async function loadUpdate() {

      setLoading(true);

      try {

        const data = await getWeeklyUpdate(
          selectedUser,
          weekStart
        );

        if (data) {

          setWeeklyUpdate(data);

          setSummary(data.summary || "");

          setManagerComments(
            data.manager_comments || ""
          );

          setTasks(data.tasks || []);

        } else {

          setWeeklyUpdate(null);

          setSummary("");

          setManagerComments("");

          setTasks([]);

        }

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }

    }

    loadUpdate();

  }, [selectedUser, weekStart]);


  async function handleSaveUpdate() {

    if (!selectedUser) {
      return;
    }

    setSaving(true);

    try {

      const data = await saveWeeklyUpdate({

        user_id: selectedUser,

        week_start: weekStart,

        week_end: getSunday(weekStart),

        summary,

        manager_comments: managerComments,

      });

      setWeeklyUpdate(data);

      setMessage("Weekly update saved successfully");

    } catch (error) {

      setMessage(error.message);

    } finally {

      setSaving(false);

    }

  }


  async function handleAddTask(type) {

    const title =
      type === "achievement"
        ? newAchievement
        : newPending;

    if (!title.trim()) {
      return;
    }

    let update = weeklyUpdate;

    // Automatically create weekly update
    // if it does not exist yet.

    if (!update) {

      update = await saveWeeklyUpdate({

        user_id: selectedUser,

        week_start: weekStart,

        week_end: getSunday(weekStart),

        summary,

        manager_comments: managerComments,

      });

      setWeeklyUpdate(update);

    }

    try {

      const task = await createTask({

        weekly_update_id: update.id,

        title,

        type,

        status:
          type === "achievement"
            ? "completed"
            : "pending",

        priority: "medium",

      });

      setTasks((current) => [
        ...current,
        task,
      ]);

      if (type === "achievement") {
        setNewAchievement("");
      } else {
        setNewPending("");
      }

    } catch (error) {

      setMessage(error.message);

    }

  }


  async function handleDeleteTask(id) {

    try {

      await deleteTask(id);

      setTasks((current) =>
        current.filter((task) => task.id !== id)
      );

    } catch (error) {

      setMessage(error.message);

    }

  }


  const achievements = tasks.filter(
    (task) => task.type === "achievement"
  );

  const pending = tasks.filter(
    (task) => task.type === "pending"
  );
async function handleCarryForward(item, action) {
  try {
    const result = await carryForwardTask({
      user_id: selectedUser,
      source_task_id: item.id,
      week_start: weekStart,
      action,
    });

    // If the item was carried into the current week,
    // immediately add it to the visible task list.
    if (result.task) {
      setTasks((current) => [
        ...current,
        result.task,
      ]);
    }

    setCarryForward((current) =>
      current.filter((x) => x.id !== item.id)
    );

    if (action === "pending") {
      setMessage("Item carried forward as pending");
    } else if (action === "completed") {
      setMessage("Item marked completed for this week");
    } else if (action === "cancelled") {
      setMessage("Item cancelled");
    } else if (action === "escalate") {
      setMessage("Item escalated and added to Issues");
    }

  } catch (error) {
    console.error(error);
    setMessage(error.message);
  }
}

  return (

    <Box sx={{ p: 4 }}>

      {/* Header */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >

        <Box>

          <Typography
            variant="h4"
            fontWeight={700}
          >
            Weekly Meeting
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Review weekly achievements, pending items
            and management actions.
          </Typography>

        </Box>

        <Button
          variant="contained"
          onClick={handleSaveUpdate}
          disabled={saving || !selectedUser}
        >
          {saving ? "Saving..." : "Save Weekly Update"}
        </Button>

      </Box>


      {/* Week and member */}

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

              <TextField
                fullWidth
                label="Week Starting"
                type="date"
                value={weekStart}
                onChange={(e) =>
                  setWeekStart(e.target.value)
                }
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

            </Grid>


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

          </Grid>


          <Typography
            sx={{
              mt: 2,
              color: "text.secondary",
            }}
          >
            Week: {formatDate(weekStart)} —{" "}
            {formatDate(getSunday(weekStart))}
          </Typography>

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

          {/* Summary */}

          <Grid size={{ xs: 12 }}>

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
                  Weekly Summary
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  placeholder="Summarize the main activities and progress for this week..."
                  value={summary}
                  onChange={(e) =>
                    setSummary(e.target.value)
                  }
                />

              </CardContent>

            </Card>

          </Grid>

{carryForward.length > 0 && (

  <Grid size={{ xs: 12 }}>

    <Card
      elevation={0}
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: 3,
      }}
    >

      <CardContent>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >

          <Box>

            <Typography
              variant="h6"
              fontWeight={600}
            >
              🔄 Carried Forward
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Outstanding items from previous weeks
            </Typography>

          </Box>

          <Chip
            label={`${carryForward.length} outstanding`}
            size="small"
          />

        </Box>


        {loadingCarryForward ? (

          <CircularProgress size={24} />

        ) : (

          carryForward.map((item) => (

            <Box
              key={item.id}
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 2,
                p: 2,
                mb: 1.5,
              }}
            >

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >

                <Box>

                  <Typography
                    fontWeight={600}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Originally raised:
                    {" "}
                    {formatDate(item.week_start)}
                  </Typography>

                </Box>


                <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                }}
                >
                <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                    handleCarryForward(item, "pending")
                    }
                >
                    Keep Pending
                </Button>

                <Button
                    size="small"
                    variant="contained"
                    onClick={() =>
                    handleCarryForward(item, "completed")
                    }
                >
                    Completed
                </Button>

                <Button
                    size="small"
                    color="warning"
                    variant="outlined"
                    onClick={() =>
                    handleCarryForward(item, "escalate")
                    }
                >
                    Escalate
                </Button>

                <Button
                    size="small"
                    color="error"
                    variant="text"
                    onClick={() =>
                    handleCarryForward(item, "cancelled")
                    }
                >
                    Cancel
                </Button>
                </Box>

              </Box>

            </Box>

          ))

        )}

      </CardContent>

    </Card>

  </Grid>

)}
          {/* Achievements */}

          <Grid size={{ xs: 12, md: 6 }}>

            <Card
              elevation={0}
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 3,
                height: "100%",
              }}
            >

              <CardContent>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >

                    <CheckCircle />

                    <Typography
                      variant="h6"
                      fontWeight={600}
                    >
                      Achievements
                    </Typography>

                  </Box>

                  <Chip
                    label={achievements.length}
                    size="small"
                  />

                </Box>


                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    mb: 2,
                  }}
                >

                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add completed item..."
                    value={newAchievement}
                    onChange={(e) =>
                      setNewAchievement(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddTask("achievement");
                      }
                    }}
                  />

                  <Button
                    variant="contained"
                    onClick={() =>
                      handleAddTask("achievement")
                    }
                  >
                    <Add />
                  </Button>

                </Box>


                {achievements.map((task) => (

                  <Box key={task.id}>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 1,
                      }}
                    >

                      <Typography>
                        ✓ {task.title}
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={() =>
                          handleDeleteTask(task.id)
                        }
                      >
                        <Delete fontSize="small" />
                      </IconButton>

                    </Box>

                    <Divider />

                  </Box>

                ))}

              </CardContent>

            </Card>

          </Grid>


          {/* Pending */}

          <Grid size={{ xs: 12, md: 6 }}>

            <Card
              elevation={0}
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 3,
                height: "100%",
              }}
            >

              <CardContent>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >

                    <PendingActions />

                    <Typography
                      variant="h6"
                      fontWeight={600}
                    >
                      Pending Items
                    </Typography>

                  </Box>

                  <Chip
                    label={pending.length}
                    size="small"
                  />

                </Box>


                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    mb: 2,
                  }}
                >

                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add pending item..."
                    value={newPending}
                    onChange={(e) =>
                      setNewPending(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddTask("pending");
                      }
                    }}
                  />

                  <Button
                    variant="contained"
                    onClick={() =>
                      handleAddTask("pending")
                    }
                  >
                    <Add />
                  </Button>

                </Box>


                {pending.map((task) => (

                  <Box key={task.id}>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        py: 1,
                      }}
                    >

                      <Typography>
                        ○ {task.title}
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={() =>
                          handleDeleteTask(task.id)
                        }
                      >
                        <Delete fontSize="small" />
                      </IconButton>

                    </Box>

                    <Divider />

                  </Box>

                ))}

              </CardContent>

            </Card>

          </Grid>


          {/* Manager comments */}

          <Grid size={{ xs: 12 }}>

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
                  Manager Comments / Actions
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  placeholder="Enter comments, agreed actions, follow-ups or management observations..."
                  value={managerComments}
                  onChange={(e) =>
                    setManagerComments(e.target.value)
                  }
                />

              </CardContent>

            </Card>

          </Grid>

        </Grid>

      )}


      <Snackbar
        open={Boolean(message)}
        autoHideDuration={4000}
        onClose={() => setMessage("")}
        message={message}
      />

    </Box>

  );
}


export default WeeklyMeeting;