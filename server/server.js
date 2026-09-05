const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "CBS Tracker API is running",
  });
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE active = true ORDER BY name"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to retrieve users",
    });
  }
});
app.get("/api/weekly-updates", async (req, res) => {
  try {
    const { user_id, week_start } = req.query;

    if (!week_start) {
      return res.status(400).json({
        message: "week_start is required",
      });
    }

    // =====================================================
    // 1. If user_id is provided:
    //    Return one member's detailed weekly update
    // =====================================================
    if (user_id) {
      const updateResult = await pool.query(
        `
        SELECT *
        FROM weekly_updates
        WHERE user_id = $1
          AND week_start = $2
        `,
        [user_id, week_start]
      );

      if (updateResult.rows.length === 0) {
        return res.json(null);
      }

      const update = updateResult.rows[0];

      const tasksResult = await pool.query(
        `
        SELECT *
        FROM tasks
        WHERE weekly_update_id = $1
        ORDER BY created_at ASC
        `,
        [update.id]
      );

      return res.json({
        ...update,
        tasks: tasksResult.rows,
      });
    }

    // =====================================================
    // 2. No user_id:
    //    Return all active team members and their status
    // =====================================================
    const result = await pool.query(
      `
      SELECT
        u.id AS user_id,
        u.name,
        u.role,
        wu.id AS weekly_update_id,
        wu.week_start,
        wu.week_end,
        wu.summary,
        wu.created_at,
        wu.updated_at,

        CASE
          WHEN wu.id IS NOT NULL THEN 'Submitted'
          ELSE 'Pending'
        END AS submission_status,

        COUNT(t.id) AS task_count

      FROM users u

      LEFT JOIN weekly_updates wu
        ON wu.user_id = u.id
        AND wu.week_start = $1

      LEFT JOIN tasks t
        ON t.weekly_update_id = wu.id

      WHERE u.active = TRUE
        AND UPPER(COALESCE(u.role, '')) = 'MEMBER'

      GROUP BY
        u.id,
        u.name,
        u.role,
        wu.id,
        wu.week_start,
        wu.week_end,
        wu.summary,
        wu.created_at,
        wu.updated_at

      ORDER BY u.name ASC
      `,
      [week_start]
    );

    res.json(
      result.rows.map((row) => ({
        ...row,
        task_count: Number(row.task_count),
      }))
    );

  } catch (error) {
    console.error("GET WEEKLY UPDATES ERROR:", error);

    res.status(500).json({
      message: "Failed to retrieve weekly updates",
      error: error.message,
    });
  }
});
app.post("/api/weekly-updates", async (req, res) => {
  try {
    const {
      user_id,
      week_start,
      week_end,
      summary,
      manager_comments,
    } = req.body;

    if (!user_id || !week_start || !week_end) {
      return res.status(400).json({
        message: "user_id, week_start and week_end are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO weekly_updates
      (
        user_id,
        week_start,
        week_end,
        summary,
        manager_comments
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, week_start)
      DO UPDATE SET
        week_end = EXCLUDED.week_end,
        summary = EXCLUDED.summary,
        manager_comments = EXCLUDED.manager_comments,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [
        user_id,
        week_start,
        week_end,
        summary || "",
        manager_comments || "",
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("SAVE WEEKLY UPDATE ERROR:", error);

    res.status(500).json({
      message: "Failed to save weekly update",
      error: error.message,
    });
  }
});
app.post("/api/tasks", async (req, res) => {
  try {
    const {
      weekly_update_id,
      title,
      description,
      type,
      status,
      priority,
    } = req.body;

    if (!weekly_update_id || !title) {
      return res.status(400).json({
        message: "weekly_update_id and title are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO tasks
      (
        weekly_update_id,
        title,
        description,
        type,
        status,
        priority
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        weekly_update_id,
        title,
        description || "",
        type || "achievement",
        status || "completed",
        priority || "medium",
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);

    res.status(500).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
});
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM tasks WHERE id = $1",
      [id]
    );

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);

    res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
});
app.get("/api/issues", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        i.*,
        u.name AS user_name
      FROM issues i
      JOIN users u ON u.id = i.user_id
      ORDER BY
        CASE i.status
          WHEN 'open' THEN 1
          WHEN 'blocked' THEN 2
          WHEN 'resolved' THEN 3
          ELSE 4
        END,
        i.date_raised DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("GET ISSUES ERROR:", error);

    res.status(500).json({
      message: "Failed to retrieve issues",
      error: error.message,
    });
  }
});
app.post("/api/issues", async (req, res) => {
  try {
    const {
      user_id,
      title,
      description,
      priority,
      status,
      blocker_reason,
      date_raised,
      target_date,
    } = req.body;

    if (!user_id || !title) {
      return res.status(400).json({
        message: "user_id and title are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO issues
      (
        user_id,
        title,
        description,
        priority,
        status,
        blocker_reason,
        date_raised,
        target_date
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        user_id,
        title,
        description || "",
        priority || "medium",
        status || "open",
        blocker_reason || "",
        date_raised || new Date(),
        target_date || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("CREATE ISSUE ERROR:", error);

    res.status(500).json({
      message: "Failed to create issue",
      error: error.message,
    });
  }
});
app.put("/api/issues/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      priority,
      status,
      blocker_reason,
      target_date,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE issues
      SET
        title = $1,
        description = $2,
        priority = $3,
        status = $4,
        blocker_reason = $5,
        target_date = $6,
        resolved_at =
          CASE
            WHEN $4 = 'resolved'
              THEN COALESCE(resolved_at, CURRENT_TIMESTAMP)
            ELSE NULL
          END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
      `,
      [
        title,
        description || "",
        priority,
        status,
        blocker_reason || "",
        target_date || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("UPDATE ISSUE ERROR:", error);

    res.status(500).json({
      message: "Failed to update issue",
      error: error.message,
    });
  }
});
app.delete("/api/issues/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM issues WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    res.json({
      message: "Issue deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ISSUE ERROR:", error);

    res.status(500).json({
      message: "Failed to delete issue",
      error: error.message,
    });
  }
});
app.get("/api/weekly-updates/carry-forward", async (req, res) => {
  try {
    const { user_id, week_start } = req.query;

    if (!user_id || !week_start) {
      return res.status(400).json({
        message: "user_id and week_start are required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        t.*,
        wu.week_start,
        wu.week_end
      FROM tasks t
      JOIN weekly_updates wu
        ON wu.id = t.weekly_update_id

      WHERE wu.user_id = $1
        AND wu.week_start < $2
        AND t.type = 'pending'
        AND t.status = 'pending'

        -- Only show the latest outstanding task in a chain.
        -- If this task has already been carried forward,
        -- don't show it again.
        AND NOT EXISTS (
          SELECT 1
          FROM tasks child
          WHERE child.carried_from_task_id = t.id
        )

      ORDER BY
        wu.week_start DESC,
        t.created_at ASC
      `,
      [user_id, week_start]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("CARRY FORWARD ERROR:", error);

    res.status(500).json({
      message: "Failed to retrieve carry-forward items",
      error: error.message,
    });
  }
});
app.post("/api/weekly-updates/carry-forward", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      user_id,
      source_task_id,
      week_start,
      action,
    } = req.body;

    if (!user_id || !source_task_id || !week_start || !action) {
      return res.status(400).json({
        message:
          "user_id, source_task_id, week_start and action are required",
      });
    }

    const allowedActions = [
      "pending",
      "completed",
      "cancelled",
      "escalate",
    ];

    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        message: "Invalid carry-forward action",
      });
    }

    await client.query("BEGIN");

    // 1. Get the source task and verify ownership
    const sourceResult = await client.query(
      `
      SELECT
        t.*,
        wu.user_id,
        wu.week_start AS source_week_start
      FROM tasks t
      JOIN weekly_updates wu
        ON wu.id = t.weekly_update_id
      WHERE t.id = $1
        AND wu.user_id = $2
      `,
      [source_task_id, user_id]
    );

    if (sourceResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Source task not found",
      });
    }

    const sourceTask = sourceResult.rows[0];

    // 2. Make sure this task hasn't already been carried forward
    const existingResult = await client.query(
      `
      SELECT id
      FROM tasks
      WHERE carried_from_task_id = $1
      `,
      [source_task_id]
    );

    if (existingResult.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "This task has already been carried forward",
      });
    }

    // 3. Find or create the current week's update
    let updateResult = await client.query(
      `
      SELECT *
      FROM weekly_updates
      WHERE user_id = $1
        AND week_start = $2
      `,
      [user_id, week_start]
    );

    let weeklyUpdate;

    if (updateResult.rows.length > 0) {
      weeklyUpdate = updateResult.rows[0];
    } else {
      const createUpdateResult = await client.query(
        `
        INSERT INTO weekly_updates
        (
          user_id,
          week_start,
          week_end,
          summary,
          manager_comments
        )
        VALUES
        (
          $1,
          $2,
          ($2::date + INTERVAL '6 days')::date,
          '',
          ''
        )
        RETURNING *
        `,
        [user_id, week_start]
      );

      weeklyUpdate = createUpdateResult.rows[0];
    }

    // 4. Determine new status
    let newStatus = "pending";

    if (action === "completed") {
      newStatus = "completed";
    }

    if (action === "cancelled") {
      newStatus = "cancelled";
    }

    // 5. Create the new week's task
    const taskResult = await client.query(
      `
      INSERT INTO tasks
      (
        weekly_update_id,
        title,
        description,
        type,
        status,
        priority,
        carried_forward,
        carried_from_task_id,
        completed_at
      )
      VALUES
      (
        $1,
        $2,
        $3,
        'pending',
        $4,
        $5,
        TRUE,
        $6,
        CASE
          WHEN $4 = 'completed'
          THEN CURRENT_TIMESTAMP
          ELSE NULL
        END
      )
      RETURNING *
      `,
      [
        weeklyUpdate.id,
        sourceTask.title,
        sourceTask.description || "",
        newStatus,
        sourceTask.priority || "medium",
        sourceTask.id,
      ]
    );

    // 6. If escalated, create an issue
    let issue = null;

    if (action === "escalate") {
      const issueResult = await client.query(
        `
        INSERT INTO issues
        (
          user_id,
          title,
          description,
          priority,
          status,
          blocker_reason,
          date_raised
        )
        VALUES
        (
          $1,
          $2,
          $3,
          'high',
          'blocked',
          'Carried forward item requires management escalation',
          CURRENT_TIMESTAMP
        )
        RETURNING *
        `,
        [
          user_id,
          sourceTask.title,
          sourceTask.description || "",
        ]
      );

      issue = issueResult.rows[0];
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Task carried forward successfully",
      task: taskResult.rows[0],
      issue,
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "CREATE CARRY FORWARD ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to carry forward task",
      error: error.message,
    });

  } finally {
    client.release();
  }
});
app.put("/api/tasks/:id/status", async (req, res) => {

  try {

    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `
      UPDATE tasks
      SET
        status = $1,
        completed_at =
          CASE
            WHEN $1 = 'completed'
              THEN CURRENT_TIMESTAMP
            ELSE completed_at
          END
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        message: "Task not found",
      });

    }

    res.json(result.rows[0]);

  } catch (error) {

    console.error(
      "UPDATE TASK STATUS ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });

  }

});

app.get("/api/history", async (req, res) => {
  try {
    const { user_id, week_start } = req.query;

    let query = `
      SELECT
        wu.id,
        wu.user_id,
        u.name AS user_name,
        u.role,
        wu.week_start,
        wu.week_end,
        wu.summary,
        wu.manager_comments,

        COUNT(
          CASE
            WHEN t.type = 'achievement'
            AND t.status = 'completed'
            THEN 1
          END
        ) AS achievements,

        COUNT(
          CASE
            WHEN t.type = 'pending'
            AND t.status = 'pending'
            THEN 1
          END
        ) AS pending,

        COUNT(
          CASE
            WHEN t.carried_forward = TRUE
            THEN 1
          END
        ) AS carried_forward

      FROM weekly_updates wu

      JOIN users u
        ON u.id = wu.user_id

      LEFT JOIN tasks t
        ON t.weekly_update_id = wu.id

      WHERE 1 = 1
    `;

    const values = [];
    let index = 1;

    if (user_id && user_id !== "all") {
      query += ` AND wu.user_id = $${index}`;
      values.push(user_id);
      index++;
    }

    if (week_start) {
      query += ` AND wu.week_start = $${index}`;
      values.push(week_start);
      index++;
    }

    query += `
      GROUP BY
        wu.id,
        wu.user_id,
        u.name,
        u.role,
        wu.week_start,
        wu.week_end,
        wu.summary,
        wu.manager_comments

      ORDER BY
        wu.week_start DESC,
        u.name ASC
    `;

    const result = await pool.query(query, values);

    res.json(
      result.rows.map((row) => ({
        ...row,
        achievements: Number(row.achievements),
        pending: Number(row.pending),
        carried_forward: Number(row.carried_forward),
      }))
    );

  } catch (error) {
    console.error("HISTORY ERROR:", error);

    res.status(500).json({
      message: "Failed to retrieve history",
      error: error.message,
    });
  }
});
app.get("/api/dashboard", async (req, res) => {
  try {
    const { week_start } = req.query;

    if (!week_start) {
      return res.status(400).json({
        message: "week_start is required",
      });
    }

    const weekEndResult = await pool.query(
      `
      SELECT ($1::date + INTERVAL '6 days')::date AS week_end
      `,
      [week_start]
    );

    const weekEnd = weekEndResult.rows[0].week_end;

    // Team members
    const usersResult = await pool.query(`
      SELECT
        id,
        name,
        role
      FROM users
      WHERE active = TRUE
      ORDER BY name
    `);

    // Weekly achievements and pending
    const productivityResult = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.role,

        COUNT(
          CASE
            WHEN t.type = 'achievement'
            AND t.status = 'completed'
            THEN 1
          END
        ) AS achievements,

        COUNT(
          CASE
            WHEN t.type = 'pending'
            AND t.status = 'pending'
            THEN 1
          END
        ) AS pending,

        COUNT(
          CASE
            WHEN t.status = 'blocked'
            THEN 1
          END
        ) AS blocked

      FROM users u

      LEFT JOIN weekly_updates wu
        ON wu.user_id = u.id
        AND wu.week_start = $1

      LEFT JOIN tasks t
        ON t.weekly_update_id = wu.id

      WHERE u.active = TRUE

      GROUP BY
        u.id,
        u.name,
        u.role

      ORDER BY u.name
      `,
      [week_start]
    );

    // Open blockers
    const blockersResult = await pool.query(
      `
      SELECT
        COUNT(*) AS total,

        COUNT(
          CASE
            WHEN priority = 'high'
            THEN 1
          END
        ) AS high_priority

      FROM issues

      WHERE status IN ('open', 'blocked')
      `,
      []
    );

    // Total achievements
    const achievementResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM tasks t
      JOIN weekly_updates wu
        ON wu.id = t.weekly_update_id
      WHERE wu.week_start = $1
        AND t.type = 'achievement'
        AND t.status = 'completed'
      `,
      [week_start]
    );

    // Total pending
    const pendingResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM tasks t
      JOIN weekly_updates wu
        ON wu.id = t.weekly_update_id
      WHERE wu.week_start = $1
        AND t.type = 'pending'
        AND t.status = 'pending'
      `,
      [week_start]
    );

    res.json({
      week_start,
      week_end: weekEnd,

      team_size: usersResult.rows.length,

      achievements: Number(
        achievementResult.rows[0].total
      ),

      pending: Number(
        pendingResult.rows[0].total
      ),

      blockers: Number(
        blockersResult.rows[0].total
      ),

      high_priority_blockers: Number(
        blockersResult.rows[0].high_priority
      ),

      members: productivityResult.rows.map(
        (member) => ({
          ...member,
          achievements: Number(member.achievements),
          pending: Number(member.pending),
          blocked: Number(member.blocked),
        })
      ),
    });

  } catch (error) {

    console.error(
      "DASHBOARD ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to load dashboard",
      error: error.message,
    });

  }
});
// ======================================================
// REPORTS
// ======================================================

app.get("/api/reports", async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      user_id = "all",
    } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: "start_date and end_date are required",
      });
    }

    const userFilter =
      user_id && user_id !== "all"
        ? "AND wu.user_id = $3"
        : "";

    const params =
      user_id && user_id !== "all"
        ? [start_date, end_date, user_id]
        : [start_date, end_date];

    // --------------------------------------------------
    // Summary
    // --------------------------------------------------

    const summaryResult = await pool.query(
      `
      SELECT
        COUNT(DISTINCT wu.id) AS weekly_updates,

        COUNT(t.id) FILTER (
          WHERE t.type = 'achievement'
          AND t.status = 'completed'
        ) AS achievements,

        COUNT(t.id) FILTER (
          WHERE t.type = 'pending'
          AND t.status = 'pending'
        ) AS pending,

        COUNT(t.id) FILTER (
          WHERE t.carried_forward = true
        ) AS carried_forward

      FROM weekly_updates wu

      LEFT JOIN tasks t
        ON t.weekly_update_id = wu.id

      WHERE wu.week_start BETWEEN $1 AND $2

      ${userFilter}
      `,
      params
    );

    // --------------------------------------------------
    // Issues summary
    // --------------------------------------------------

    const issueFilter =
      user_id && user_id !== "all"
        ? "AND i.user_id = $3"
        : "";

    const issueParams =
      user_id && user_id !== "all"
        ? [start_date, end_date, user_id]
        : [start_date, end_date];

    const issuesResult = await pool.query(
      `
      SELECT
        COUNT(*) AS total,

        COUNT(*) FILTER (
          WHERE i.status IN ('open', 'blocked')
        ) AS open,

        COUNT(*) FILTER (
          WHERE i.status = 'resolved'
        ) AS resolved,

        COUNT(*) FILTER (
          WHERE i.priority = 'high'
        ) AS high_priority

      FROM issues i

      WHERE i.date_raised BETWEEN $1 AND $2

      ${issueFilter}
      `,
      issueParams
    );

    // --------------------------------------------------
    // Weekly trend
    // --------------------------------------------------

    const trendResult = await pool.query(
      `
      SELECT
        wu.week_start,

        COUNT(DISTINCT wu.id) AS weekly_updates,

        COUNT(t.id) FILTER (
          WHERE t.type = 'achievement'
          AND t.status = 'completed'
        ) AS achievements,

        COUNT(t.id) FILTER (
          WHERE t.type = 'pending'
          AND t.status = 'pending'
        ) AS pending,

        COUNT(t.id) FILTER (
          WHERE t.carried_forward = true
        ) AS carried_forward

      FROM weekly_updates wu

      LEFT JOIN tasks t
        ON t.weekly_update_id = wu.id

      WHERE wu.week_start BETWEEN $1 AND $2

      ${userFilter}

      GROUP BY wu.week_start

      ORDER BY wu.week_start ASC
      `,
      params
    );

    // --------------------------------------------------
    // Team member performance
    // --------------------------------------------------

    const memberResult = await pool.query(
      `
      SELECT
        u.id,
        u.name,

        COUNT(DISTINCT wu.id) AS weekly_updates,

        COUNT(t.id) FILTER (
          WHERE t.type = 'achievement'
          AND t.status = 'completed'
        ) AS achievements,

        COUNT(t.id) FILTER (
          WHERE t.type = 'pending'
          AND t.status = 'pending'
        ) AS pending,

        COUNT(t.id) FILTER (
          WHERE t.carried_forward = true
        ) AS carried_forward

      FROM users u

      LEFT JOIN weekly_updates wu
        ON wu.user_id = u.id
        AND wu.week_start BETWEEN $1 AND $2

      LEFT JOIN tasks t
        ON t.weekly_update_id = wu.id

      WHERE u.active = true

      ${
        user_id && user_id !== "all"
          ? "AND u.id = $3"
          : ""
      }

      GROUP BY u.id, u.name

      ORDER BY achievements DESC, u.name ASC
      `,
      params
    );

    // --------------------------------------------------
    // Issues by status
    // --------------------------------------------------

    const issueStatusResult = await pool.query(
      `
      SELECT
        i.status,
        COUNT(*) AS count

      FROM issues i

      WHERE i.date_raised BETWEEN $1 AND $2

      ${issueFilter}

      GROUP BY i.status

      ORDER BY count DESC
      `,
      issueParams
    );

    // --------------------------------------------------
    // Issues by priority
    // --------------------------------------------------

    const issuePriorityResult = await pool.query(
      `
      SELECT
        i.priority,
        COUNT(*) AS count

      FROM issues i

      WHERE i.date_raised BETWEEN $1 AND $2

      ${issueFilter}

      GROUP BY i.priority

      ORDER BY count DESC
      `,
      issueParams
    );

    res.json({
      period: {
        start_date,
        end_date,
      },

      summary: {
        ...summaryResult.rows[0],
        ...issuesResult.rows[0],
      },

      trend: trendResult.rows,

      members: memberResult.rows,

      issues_by_status: issueStatusResult.rows,

      issues_by_priority: issuePriorityResult.rows,
    });
  } catch (error) {
    console.error("Reports error:", error);

    res.status(500).json({
      error: "Failed to generate report",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});