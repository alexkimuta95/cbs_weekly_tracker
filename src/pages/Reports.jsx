import { useEffect, useMemo, useState } from "react";

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
  LinearProgress,
} from "@mui/material";

import {
  CheckCircle,
  PendingActions,
  Autorenew,
  Warning,
  Assignment,
} from "@mui/icons-material";

import {
  getUsers,
  getReports,
} from "../services/api";

function Reports() {
  const [users, setUsers] = useState([]);
  const [report, setReport] = useState(null);

  const [userId, setUserId] = useState("all");

  const today = new Date();

  const defaultEnd = today
    .toISOString()
    .split("T")[0];

  const defaultStartDate = new Date(
    today.getTime() - 30 * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] =
    useState(defaultStartDate);

  const [endDate, setEndDate] =
    useState(defaultEnd);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadReport();
  }, [startDate, endDate, userId]);

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function loadReport() {
    try {
      setLoading(true);

      const data = await getReports(
        startDate,
        endDate,
        userId
      );

      setReport(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const summary = report?.summary || {};

  const totalWork =
    Number(summary.achievements || 0) +
    Number(summary.pending || 0);

  const completionRate =
    totalWork > 0
      ? Math.round(
          (Number(summary.achievements || 0) /
            totalWork) *
            100
        )
      : 0;

  const maxAchievements = useMemo(() => {
    if (!report?.members?.length) return 1;

    return Math.max(
      ...report.members.map((member) =>
        Number(member.achievements || 0)
      ),
      1
    );
  }, [report]);

  if (loading && !report) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>

      {/* HEADER */}

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          fontWeight={700}
        >
          Reports
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Performance, productivity and issues overview
        </Typography>
      </Box>

      {/* FILTERS */}

      <Card
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 3,
          mb: 3,
        }}
      >
        <CardContent>

          <Grid container spacing={2}>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>
                  Team Member
                </InputLabel>

                <Select
                  value={userId}
                  label="Team Member"
                  onChange={(e) =>
                    setUserId(e.target.value)
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
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextDate
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextDate
                label="End Date"
                value={endDate}
                onChange={setEndDate}
              />
            </Grid>

          </Grid>

        </CardContent>
      </Card>

      {/* KPI CARDS */}

      <Grid container spacing={2} sx={{ mb: 3 }}>

        <ReportCard
          title="Weekly Updates"
          value={summary.weekly_updates}
          icon={<Assignment />}
        />

        <ReportCard
          title="Achievements"
          value={summary.achievements}
          icon={<CheckCircle />}
          chip="Completed"
        />

        <ReportCard
          title="Pending"
          value={summary.pending}
          icon={<PendingActions />}
          chip="Pending"
        />

        <ReportCard
          title="Carried Forward"
          value={summary.carried_forward}
          icon={<Autorenew />}
        />

        <ReportCard
          title="Open Issues"
          value={summary.open}
          icon={<Warning />}
        />

        <ReportCard
          title="Resolved Issues"
          value={summary.resolved}
          icon={<CheckCircle />}
        />

      </Grid>

      {/* COMPLETION RATE */}

      <Card
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 3,
          mb: 3,
        }}
      >
        <CardContent>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography fontWeight={600}>
              Achievement Completion Rate
            </Typography>

            <Typography fontWeight={700}>
              {completionRate}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={completionRate}
            sx={{
              height: 9,
              borderRadius: 5,
            }}
          />

        </CardContent>
      </Card>

      {/* WEEKLY TREND */}

      <Card
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: 3,
          mb: 3,
        }}
      >
        <CardContent>

          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 2 }}
          >
            Weekly Activity
          </Typography>

          {report?.trend?.length === 0 ? (
            <Typography
              color="text.secondary"
            >
              No activity found for the selected period.
            </Typography>
          ) : (
            report?.trend?.map((week) => {

              const achievements =
                Number(week.achievements || 0);

              const pending =
                Number(week.pending || 0);

              const carried =
                Number(week.carried_forward || 0);

              return (
                <Box
                  key={week.week_start}
                  sx={{ mb: 3 }}
                >

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography fontWeight={600}>
                      {formatDate(
                        week.week_start
                      )}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {achievements} achievements
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={
                      Math.min(
                        achievements * 10,
                        100
                      )
                    }
                    sx={{
                      height: 8,
                      borderRadius: 5,
                      mb: 1,
                    }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >

                    <Chip
                      size="small"
                      label={`${achievements} Achievements`}
                      icon={<CheckCircle />}
                    />

                    <Chip
                      size="small"
                      label={`${pending} Pending`}
                      icon={<PendingActions />}
                    />

                    <Chip
                      size="small"
                      label={`${carried} Carried Forward`}
                      icon={<Autorenew />}
                    />

                  </Box>

                </Box>
              );
            })
          )}

        </CardContent>
      </Card>

      {/* TEAM PERFORMANCE */}

      <Grid container spacing={3}>

        <Grid item xs={12} md={7}>

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
                sx={{ mb: 2 }}
              >
                Team Performance
              </Typography>

              {report?.members?.map(
                (member) => {

                  const achievements =
                    Number(
                      member.achievements || 0
                    );

                  const percentage =
                    Math.round(
                      (achievements /
                        maxAchievements) *
                        100
                    );

                  return (
                    <Box
                      key={member.id}
                      sx={{ mb: 2.5 }}
                    >

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          mb: 0.5,
                        }}
                      >

                        <Typography
                          fontWeight={600}
                        >
                          {member.name}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {achievements} achievements
                        </Typography>

                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 7,
                          borderRadius: 4,
                        }}
                      />

                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          mt: 1,
                        }}
                      >

                        <Chip
                          size="small"
                          label={`${member.pending || 0} Pending`}
                        />

                        <Chip
                          size="small"
                          label={`${member.carried_forward || 0} Carried`}
                        />

                      </Box>

                    </Box>
                  );
                }
              )}

            </CardContent>

          </Card>

        </Grid>

        {/* ISSUE BREAKDOWN */}

        <Grid item xs={12} md={5}>

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
                sx={{ mb: 2 }}
              >
                Issues Breakdown
              </Typography>

              {report?.issues_by_status?.map(
                (item) => (

                  <Box key={item.status}>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        py: 1.5,
                      }}
                    >

                      <Typography
                        sx={{
                          textTransform:
                            "capitalize",
                        }}
                      >
                        {item.status}
                      </Typography>

                      <Chip
                        size="small"
                        label={item.count}
                      />

                    </Box>

                    <Divider />

                  </Box>
                )
              )}

              <Typography
                fontWeight={600}
                sx={{ mt: 3, mb: 1 }}
              >
                By Priority
              </Typography>

              {report?.issues_by_priority?.map(
                (item) => (

                  <Box
                    key={item.priority}
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      py: 1,
                    }}
                  >

                    <Typography
                      sx={{
                        textTransform:
                          "capitalize",
                      }}
                    >
                      {item.priority}
                    </Typography>

                    <Typography fontWeight={600}>
                      {item.count}
                    </Typography>

                  </Box>
                )
              )}

            </CardContent>

          </Card>

        </Grid>

      </Grid>

    </Box>
  );
}

function ReportCard({
  title,
  value,
  icon,
}) {
  return (
    <Grid item xs={12} sm={6} md={4} lg={2}>
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
              justifyContent:
                "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {title}
            </Typography>

            {icon}

          </Box>

          <Typography
            variant="h4"
            fontWeight={700}
          >
            {value || 0}
          </Typography>

        </CardContent>

      </Card>
    </Grid>
  );
}

function TextDate({
  label,
  value,
  onChange,
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
      >
        {label}
      </Typography>

      <Box
        component="input"
        type="date"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        sx={{
          width: "100%",
          height: 40,
          border: "1px solid #c4c4c4",
          borderRadius: 1,
          px: 1.5,
          mt: 0.5,
          fontFamily: "inherit",
          fontSize: "0.9rem",
          boxSizing: "border-box",
        }}
      />
    </Box>
  );
}

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default Reports;