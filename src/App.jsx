import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import WeeklyMeeting from "./pages/WeeklyMeeting";
import Issues from "./pages/Issues";
import History from "./pages/History";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
function Placeholder({ title }) {
  return (
    <div style={{ padding: "40px" }}>
      <h1>{title}</h1>
      <p>This section is coming next.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/weekly-meeting"
            element={<WeeklyMeeting />}
          />

          <Route
            path="/issues"
            element={<Issues />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/history"
            element={<History  />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;