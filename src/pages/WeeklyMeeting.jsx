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

import { Add, ArrowBack, Delete, CheckCircle, PendingActions } from "@mui/icons-material";

import {
  getUsers,
  getWeeklyUpdates,
  getWeeklyUpdate,
  saveWeeklyUpdate,
  createTask,
  deleteTask,
  getCarryForwardItems,
  updateTaskStatus,
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
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function WeeklyMeeting() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [weekStart, setWeekStart] = useState(getMonday());
  const [weeklyUpdates, setWeeklyUpdates] = useState([]);
  const [weeklyUpdate, setWeeklyUpdate] = useState(null);
  const [summary, setSummary] = useState("");
  const [tasks, setTasks] = useState([]);
  const [newAchievement, setNewAchievement] = useState("");
  const [newPending, setNewPending] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [carryForward, setCarryForward] = useState([]);
  const [loadingCarryForward, setLoadingCarryForward] = useState(false);
  const [view, setView] = useState("list"); // list | form | details
  const [selectedDetails, setSelectedDetails] = useState(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getUsers();
        setUsers(data);
        const firstMember = data.find(
          (user) => String(user.role || "").toUpperCase() === "MEMBER"
        );
        setSelectedUser(firstMember?.id || data[0]?.id || "");
      } catch (error) {
        setMessage(error.message);
      }
    }
    loadUsers();
  }, []);

  async function loadWeeklyUpdates() {
    if (!weekStart) return;
    setLoading(true);
    try {
      const data = await getWeeklyUpdates(weekStart);
      setWeeklyUpdates(data || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (view === "list") loadWeeklyUpdates();
  }, [weekStart, view]);

  useEffect(() => {
    if (!selectedUser || !weekStart || view !== "form") return;

    async function loadCarryForward() {
      setLoadingCarryForward(true);
      try {
        const data = await getCarryForwardItems(selectedUser, weekStart);
        setCarryForward(data || []);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoadingCarryForward(false);
      }
    }

    loadCarryForward();
  }, [selectedUser, weekStart, view]);

  async function openNewForm() {
    setWeeklyUpdate(null);
    setSummary("");
    setTasks([]);
    setNewAchievement("");
    setNewPending("");
    setCarryForward([]);
    setView("form");
  }

  async function openExistingUpdate(userId) {
    setLoading(true);
    try {
      const data = await getWeeklyUpdate(userId, weekStart);
      setSelectedUser(userId);
      setSelectedDetails(data);
      setView("details");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveUpdate() {
    if (!selectedUser || !summary.trim()) {
      setMessage("Please enter a weekly summary before submitting.");
      return;
    }

    setSaving(true);
    try {
      const update = await saveWeeklyUpdate({
        user_id: selectedUser,
        week_start: weekStart,
        week_end: getSunday(weekStart),
        summary,
      });

      // Tasks are intentionally created only after the weekly update is submitted.
      for (const task of tasks.filter((item) => item.local)) {
        await createTask({
          weekly_update_id: update.id,
          title: task.title,
          type: task.type,
          status: task.type === "achievement" ? "completed" : "pending",
          priority: task.priority || "medium",
        });
      }

      setWeeklyUpdate(null);
      setSummary("");
      setNewAchievement("");
      setNewPending("");
      setTasks([]);
      setCarryForward([]);
      setMessage("Weekly update submitted successfully");
      setView("list");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleAddTask(type) {
    const title = type === "achievement" ? newAchievement : newPending;
    if (!title.trim()) return;

    setTasks((current) => [
      ...current,
      {
        id: `local-${Date.now()}-${Math.random()}`,
        title: title.trim(),
        type,
        status: type === "achievement" ? "completed" : "pending",
        priority: "medium",
        local: true,
      },
    ]);

    if (type === "achievement") setNewAchievement("");
    else setNewPending("");
  }

  async function handleDeleteTask(task) {
    if (task.local) {
      setTasks((current) => current.filter((item) => item.id !== task.id));
      return;
    }

    try {
      await deleteTask(task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (error) {
      setMessage(error.message);
    }
  }

  const achievements = tasks.filter((task) => task.type === "achievement");
  const pending = tasks.filter((task) => task.type === "pending");

  if (view === "list") {
    return (
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Weekly Meeting</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Weekly submissions from team members.
            </Typography>
          </Box>
          <Button variant="contained" onClick={openNewForm}>+ Submit Weekly Update</Button>
        </Box>

        <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, mb: 3 }}>
          <CardContent>
            <TextField
              label="Week Starting"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ maxWidth: 300 }}
            />
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Week: {formatDate(weekStart)} — {formatDate(getSunday(weekStart))}
            </Typography>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
        ) : (
          <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Team Submissions</Typography>
              {weeklyUpdates.map((item) => (
                <Box
                  key={item.user_id}
                  onClick={() => item.update_id && openExistingUpdate(item.user_id)}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 2,
                    mb: 1,
                    border: "1px solid #e5e7eb",
                    borderRadius: 2,
                    cursor: item.update_id ? "pointer" : "default",
                    "&:hover": item.update_id ? { backgroundColor: "action.hover" } : {},
                  }}
                >
                  <Box>
                    <Typography fontWeight={600}>{item.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.role || "Team Member"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      size="small"
                      label={item.update_id ? "Submitted" : "Pending"}
                      icon={item.update_id ? <CheckCircle /> : <PendingActions />}
                    />
                    {item.update_id && (
                      <Typography variant="body2" color="text.secondary">
                        {item.task_count || 0} items
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
              {weeklyUpdates.length === 0 && (
                <Alert severity="info">No team members are available for this week.</Alert>
              )}
            </CardContent>
          </Card>
        )}

        <Snackbar open={Boolean(message)} autoHideDuration={4000} onClose={() => setMessage("")} message={message} />
      </Box>
    );
  }

  if (view === "details") {
    const detailTasks = selectedDetails?.tasks || [];
    return (
      <Box sx={{ p: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => setView("list")} sx={{ mb: 2 }}>
          Back to Weekly Meeting
        </Button>
        <Typography variant="h4" fontWeight={700}>Weekly Update</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          {selectedDetails?.name || users.find((u) => u.id === selectedUser)?.name || "Team Member"} · {formatDate(weekStart)} — {formatDate(getSunday(weekStart))}
        </Typography>

        <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Weekly Summary</Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }}>{selectedDetails?.summary || "No summary provided."}</Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, height: "100%" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Achievements</Typography>
                {detailTasks.filter((task) => task.type === "achievement").map((task) => (
                  <Box key={task.id} sx={{ py: 1 }}><Typography>✓ {task.title}</Typography><Divider /></Box>
                ))}
                {!detailTasks.some((task) => task.type === "achievement") && <Typography color="text.secondary">No achievements recorded.</Typography>}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, height: "100%" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Pending Items</Typography>
                {detailTasks.filter((task) => task.type === "pending").map((task) => (
                  <Box key={task.id} sx={{ py: 1 }}><Typography>• {task.title}</Typography><Divider /></Box>
                ))}
                {!detailTasks.some((task) => task.type === "pending") && <Typography color="text.secondary">No pending items recorded.</Typography>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Snackbar open={Boolean(message)} autoHideDuration={4000} onClose={() => setMessage("")} message={message} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box>
          <Button startIcon={<ArrowBack />} onClick={() => setView("list")} sx={{ mb: 1 }}>Back</Button>
          <Typography variant="h4" fontWeight={700}>Submit Weekly Update</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Enter your weekly achievements, pending items and progress.
          </Typography>
        </Box>
        <Button variant="contained" onClick={handleSaveUpdate} disabled={saving || !selectedUser}>
          {saving ? "Submitting..." : "Submit Weekly Update"}
        </Button>
      </Box>

      <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth label="Week Starting" type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Team Member</InputLabel>
                <Select value={selectedUser} label="Team Member" onChange={(e) => setSelectedUser(e.target.value)}>
                  {users.filter((user) => String(user.role || "").toUpperCase() === "MEMBER").map((user) => (
                    <MenuItem key={user.id} value={user.id}>{user.name} — {user.role}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Typography sx={{ mt: 2, color: "text.secondary" }}>
            Week: {formatDate(weekStart)} — {formatDate(getSunday(weekStart))}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Weekly Summary</Typography>
              <TextField fullWidth multiline minRows={4} placeholder="Summarize the main activities and progress for this week..." value={summary} onChange={(e) => setSummary(e.target.value)} />
            </CardContent>
          </Card>
        </Grid>

        {carryForward.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>🔄 Carried Forward</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>Outstanding items from previous weeks</Typography>
                  </Box>
                  <Chip label={`${carryForward.length} outstanding`} size="small" />
                </Box>
                {loadingCarryForward ? <CircularProgress size={24} /> : carryForward.map((item) => (
                  <Box key={item.id} sx={{ border: "1px solid #e5e7eb", borderRadius: 2, p: 2, mb: 1.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                      <Box>
                        <Typography fontWeight={600}>{item.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Originally raised: {formatDate(item.week_start)}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => { setNewPending(item.title); setCarryForward((current) => current.filter((x) => x.id !== item.id)); }}>Keep Pending</Button>
                        <Button size="small" variant="contained" onClick={async () => { try { await updateTaskStatus(item.id, "completed"); setCarryForward((current) => current.filter((x) => x.id !== item.id)); setMessage("Item marked completed"); } catch (error) { setMessage(error.message); } }}>Completed</Button>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><CheckCircle /><Typography variant="h6" fontWeight={600}>Achievements</Typography></Box>
                <Chip label={achievements.length} size="small" />
              </Box>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField fullWidth size="small" placeholder="Add completed item..." value={newAchievement} onChange={(e) => setNewAchievement(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddTask("achievement")} />
                <Button variant="contained" onClick={() => handleAddTask("achievement")}><Add /></Button>
              </Box>
              {achievements.map((task) => (
                <Box key={task.id}><Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}><Typography>✓ {task.title}</Typography><IconButton size="small" onClick={() => handleDeleteTask(task)}><Delete fontSize="small" /></IconButton></Box><Divider /></Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><PendingActions /><Typography variant="h6" fontWeight={600}>Pending Items</Typography></Box>
                <Chip label={pending.length} size="small" />
              </Box>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField fullWidth size="small" placeholder="Add pending item..." value={newPending} onChange={(e) => setNewPending(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddTask("pending")} />
                <Button variant="contained" onClick={() => handleAddTask("pending")}><Add /></Button>
              </Box>
              {pending.map((task) => (
                <Box key={task.id}><Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}><Typography>• {task.title}</Typography><IconButton size="small" onClick={() => handleDeleteTask(task)}><Delete fontSize="small" /></IconButton></Box><Divider /></Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={Boolean(message)} autoHideDuration={4000} onClose={() => setMessage("")} message={message} />
    </Box>
  );
}

export default WeeklyMeeting;