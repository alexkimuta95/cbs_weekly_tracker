const API_URL = "http://localhost:5000/api";

export async function getUsers() {
  const response = await fetch(`${API_URL}/users`);

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return response.json();
}


export async function getWeeklyUpdate(userId, weekStart) {
  const response = await fetch(
    `${API_URL}/weekly-updates?user_id=${userId}&week_start=${weekStart}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weekly update");
  }

  return response.json();
}


export async function saveWeeklyUpdate(data) {
  const response = await fetch(`${API_URL}/weekly-updates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to save weekly update");
  }

  return response.json();
}


export async function createTask(data) {
  const response = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create task");
  }

  return response.json();
}


export async function deleteTask(id) {
  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete task");
  }

  return response.json();
}
export async function getIssues() {
  const response = await fetch(`${API_URL}/issues`);

  if (!response.ok) {
    throw new Error("Failed to fetch issues");
  }

  return response.json();
}


export async function createIssue(data) {
  const response = await fetch(`${API_URL}/issues`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create issue");
  }

  return response.json();
}


export async function updateIssue(id, data) {
  const response = await fetch(`${API_URL}/issues/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update issue");
  }

  return response.json();
}


export async function deleteIssue(id) {
  const response = await fetch(`${API_URL}/issues/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete issue");
  }

  return response.json();
}
export async function getCarryForwardItems(
  userId,
  weekStart
) {
  const response = await fetch(
    `${API_URL}/weekly-updates/carry-forward?user_id=${userId}&week_start=${weekStart}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch carry-forward items"
    );
  }

  return response.json();
}
export async function carryForwardTask(data) {
  const response = await fetch(
    `${API_URL}/weekly-updates/carry-forward`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    throw new Error(
      error.message || "Failed to carry forward task"
    );
  }

  return response.json();
}
export async function updateTaskStatus(
  id,
  status
) {

  const response = await fetch(
    `${API_URL}/tasks/${id}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to update task status"
    );
  }

  return response.json();
}
export async function getDashboard(weekStart) {
  const response = await fetch(
    `${API_URL}/dashboard?week_start=${weekStart}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch dashboard"
    );
  }

  return response.json();
}
export async function getHistory(userId = "all", weekStart = "") {
  const params = new URLSearchParams();

  params.append("user_id", userId);

  if (weekStart) {
    params.append("week_start", weekStart);
  }

  const response = await fetch(
    `${API_URL}/history?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch history");
  }

  return response.json();
}
export async function getReports(
  startDate,
  endDate,
  userId = "all"
) {
  const params = new URLSearchParams();

  params.append("start_date", startDate);
  params.append("end_date", endDate);
  params.append("user_id", userId);

  const response = await fetch(
    `${API_URL}/reports?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch reports");
  }

  return response.json();
}
