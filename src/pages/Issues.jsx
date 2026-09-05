import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Edit,
  Warning,
} from "@mui/icons-material";

import {
  getUsers,
  getIssues,
  createIssue,
  updateIssue,
  deleteIssue,
} from "../services/api";


const emptyForm = {
  user_id: "",
  title: "",
  description: "",
  priority: "medium",
  status: "open",
  blocker_reason: "",
  target_date: "",
};


function priorityColor(priority) {
  if (priority === "high") return "error";
  if (priority === "medium") return "warning";
  return "default";
}


function statusColor(status) {
  if (status === "resolved") return "success";
  if (status === "blocked") return "error";
  return "warning";
}


function Issues() {

  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);

  const [loading, setLoading] = useState(true);

  const [openDialog, setOpenDialog] = useState(false);

  const [editingIssue, setEditingIssue] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");


  async function loadData() {

    try {

      setLoading(true);

      const [usersData, issuesData] = await Promise.all([
        getUsers(),
        getIssues(),
      ]);

      setUsers(usersData);
      setIssues(issuesData);

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {
    loadData();
  }, []);


  function openCreateDialog() {

    setEditingIssue(null);

    setForm({
      ...emptyForm,
      user_id: users.length > 0 ? users[0].id : "",
    });

    setOpenDialog(true);
  }


  function openEditDialog(issue) {

    setEditingIssue(issue);

    setForm({
      user_id: issue.user_id,
      title: issue.title || "",
      description: issue.description || "",
      priority: issue.priority || "medium",
      status: issue.status || "open",
      blocker_reason: issue.blocker_reason || "",
      target_date: issue.target_date
        ? issue.target_date.substring(0, 10)
        : "",
    });

    setOpenDialog(true);
  }


  function closeDialog() {

    if (!saving) {
      setOpenDialog(false);
    }

  }


  function handleChange(event) {

    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });

  }


  async function handleSave() {

    if (!form.user_id || !form.title.trim()) {

      setMessage("Owner and issue title are required");

      return;
    }

    try {

      setSaving(true);

      if (editingIssue) {

        const updated = await updateIssue(
          editingIssue.id,
          form
        );

        setIssues((current) =>
          current.map((issue) =>
            issue.id === updated.id
              ? {
                  ...issue,
                  ...updated,
                  user_name:
                    users.find(
                      (u) => u.id === Number(form.user_id)
                    )?.name || issue.user_name,
                }
              : issue
          )
        );

        setMessage("Issue updated successfully");

      } else {

        const created = await createIssue(form);

        const owner = users.find(
          (u) => u.id === Number(form.user_id)
        );

        setIssues((current) => [
          {
            ...created,
            user_name: owner?.name || "",
          },
          ...current,
        ]);

        setMessage("Issue created successfully");
      }

      setOpenDialog(false);

    } catch (err) {

      setMessage(err.message);

    } finally {

      setSaving(false);

    }

  }


  async function handleDelete(id) {

    if (!window.confirm("Delete this issue?")) {
      return;
    }

    try {

      await deleteIssue(id);

      setIssues((current) =>
        current.filter((issue) => issue.id !== id)
      );

      setMessage("Issue deleted");

    } catch (err) {

      setMessage(err.message);

    }

  }


  const openIssues = issues.filter(
    (issue) => issue.status === "open"
  );

  const blockedIssues = issues.filter(
    (issue) => issue.status === "blocked"
  );

  const resolvedIssues = issues.filter(
    (issue) => issue.status === "resolved"
  );


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
            Issues & Blockers
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Track issues preventing the team from completing
            their work.
          </Typography>

        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreateDialog}
        >
          Add Issue
        </Button>

      </Box>


      {/* Summary */}

      <Grid container spacing={3} sx={{ mb: 4 }}>

        <Grid size={{ xs: 12, md: 4 }}>

          <Card
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
            }}
          >

            <CardContent>

              <Typography
                color="text.secondary"
              >
                Open Issues
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                {openIssues.length}
              </Typography>

            </CardContent>

          </Card>

        </Grid>


        <Grid size={{ xs: 12, md: 4 }}>

          <Card
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
            }}
          >

            <CardContent>

              <Typography
                color="text.secondary"
              >
                Blocked
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                {blockedIssues.length}
              </Typography>

            </CardContent>

          </Card>

        </Grid>


        <Grid size={{ xs: 12, md: 4 }}>

          <Card
            elevation={0}
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: 3,
            }}
          >

            <CardContent>

              <Typography
                color="text.secondary"
              >
                Resolved
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                {resolvedIssues.length}
              </Typography>

            </CardContent>

          </Card>

        </Grid>

      </Grid>


      {/* Errors */}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}


      {/* Issue list */}

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

      ) : issues.length === 0 ? (

        <Card
          elevation={0}
          sx={{
            border: "1px solid #e5e7eb",
            borderRadius: 3,
          }}
        >

          <CardContent
            sx={{
              textAlign: "center",
              py: 8,
            }}
          >

            <Warning
              sx={{
                fontSize: 50,
                mb: 2,
              }}
            />

            <Typography variant="h6">
              No issues or blockers
            </Typography>

            <Typography color="text.secondary">
              Great! There are currently no issues recorded.
            </Typography>

          </CardContent>

        </Card>

      ) : (

        <Grid container spacing={2}>

          {issues.map((issue) => (

            <Grid
              size={{ xs: 12 }}
              key={issue.id}
            >

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
                      alignItems: "flex-start",
                    }}
                  >

                    <Box sx={{ flexGrow: 1 }}>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >

                        <Typography
                          variant="h6"
                          fontWeight={600}
                        >
                          {issue.title}
                        </Typography>

                        <Chip
                          label={issue.priority}
                          size="small"
                          color={priorityColor(issue.priority)}
                        />

                        <Chip
                          label={issue.status}
                          size="small"
                          color={statusColor(issue.status)}
                        />

                      </Box>


                      <Typography
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {issue.description}
                      </Typography>


                      <Grid container spacing={2}>

                        <Grid size={{ xs: 12, sm: 4 }}>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            OWNER
                          </Typography>

                          <Typography>
                            {issue.user_name}
                          </Typography>

                        </Grid>


                        <Grid size={{ xs: 12, sm: 4 }}>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            BLOCKER / DEPENDENCY
                          </Typography>

                          <Typography>
                            {issue.blocker_reason || "—"}
                          </Typography>

                        </Grid>


                        <Grid size={{ xs: 12, sm: 4 }}>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            TARGET DATE
                          </Typography>

                          <Typography>
                            {issue.target_date
                              ? new Date(
                                  issue.target_date
                                ).toLocaleDateString("en-GB")
                              : "—"}
                          </Typography>

                        </Grid>

                      </Grid>

                    </Box>


                    <Box>

                      <IconButton
                        onClick={() =>
                          openEditDialog(issue)
                        }
                      >
                        <Edit />
                      </IconButton>

                      <IconButton
                        onClick={() =>
                          handleDelete(issue.id)
                        }
                      >
                        <Delete />
                      </IconButton>

                    </Box>

                  </Box>

                </CardContent>

              </Card>

            </Grid>

          ))}

        </Grid>

      )}


      {/* Create/Edit dialog */}

      <Dialog
        open={openDialog}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
      >

        <DialogTitle>
          {editingIssue
            ? "Edit Issue"
            : "Add Issue / Blocker"}
        </DialogTitle>


        <DialogContent>

          <Grid
            container
            spacing={2}
            sx={{ mt: 0.5 }}
          >

            <Grid size={{ xs: 12, md: 6 }}>

              <FormControl fullWidth>

                <InputLabel>
                  Owner
                </InputLabel>

                <Select
                  name="user_id"
                  value={form.user_id}
                  label="Owner"
                  onChange={handleChange}
                >

                  {users.map((user) => (

                    <MenuItem
                      key={user.id}
                      value={user.id}
                    >
                      {user.name}
                    </MenuItem>

                  ))}

                </Select>

              </FormControl>

            </Grid>


            <Grid size={{ xs: 12, md: 3 }}>

              <FormControl fullWidth>

                <InputLabel>
                  Priority
                </InputLabel>

                <Select
                  name="priority"
                  value={form.priority}
                  label="Priority"
                  onChange={handleChange}
                >

                  <MenuItem value="low">
                    Low
                  </MenuItem>

                  <MenuItem value="medium">
                    Medium
                  </MenuItem>

                  <MenuItem value="high">
                    High
                  </MenuItem>

                </Select>

              </FormControl>

            </Grid>


            <Grid size={{ xs: 12, md: 3 }}>

              <FormControl fullWidth>

                <InputLabel>
                  Status
                </InputLabel>

                <Select
                  name="status"
                  value={form.status}
                  label="Status"
                  onChange={handleChange}
                >

                  <MenuItem value="open">
                    Open
                  </MenuItem>

                  <MenuItem value="blocked">
                    Blocked
                  </MenuItem>

                  <MenuItem value="resolved">
                    Resolved
                  </MenuItem>

                </Select>

              </FormControl>

            </Grid>


            <Grid size={{ xs: 12 }}>

              <TextField
                fullWidth
                label="Issue / Blocker"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Waiting for vendor API response"
              />

            </Grid>


            <Grid size={{ xs: 12 }}>

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
              />

            </Grid>


            <Grid size={{ xs: 12, md: 8 }}>

              <TextField
                fullWidth
                label="Blocker / Dependency"
                name="blocker_reason"
                value={form.blocker_reason}
                onChange={handleChange}
                placeholder="What is preventing this from being completed?"
              />

            </Grid>


            <Grid size={{ xs: 12, md: 4 }}>

              <TextField
                fullWidth
                type="date"
                label="Target Date"
                name="target_date"
                value={form.target_date}
                onChange={handleChange}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

            </Grid>

          </Grid>

        </DialogContent>


        <DialogActions sx={{ px: 3, pb: 2 }}>

          <Button
            onClick={closeDialog}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingIssue
              ? "Update Issue"
              : "Create Issue"}
          </Button>

        </DialogActions>

      </Dialog>


      <Snackbar
        open={Boolean(message)}
        autoHideDuration={4000}
        onClose={() => setMessage("")}
        message={message}
      />

    </Box>

  );
}

export default Issues;