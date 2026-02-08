// ============================================
// iPlanFarmHouse — Main App Component
// Simple page-based navigation (no router needed)
// ============================================
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage";
import DailyTasksPage from "./pages/DailyTasksPage";
import CreateTaskPage from "./pages/CreateTaskPage";

function App() {
  // Current user (null = not logged in)
  const [user, setUser] = useState(null);

  // Current page: "calendar" | "daily" | "create-task"
  const [page, setPage] = useState("calendar");

  // Selected date for daily view
  const [selectedDate, setSelectedDate] = useState(null);

  // Force calendar refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- Login handler ---
  function handleLogin(userData) {
    setUser(userData);
    setPage("calendar");
  }

  // --- Logout handler ---
  function handleLogout() {
    setUser(null);
    setPage("calendar");
    setSelectedDate(null);
  }

  // --- Date selected on calendar ---
  function handleSelectDate(date) {
    setSelectedDate(date);
    setPage("daily");
  }

  // --- Back to calendar ---
  function handleBackToCalendar() {
    setPage("calendar");
    setSelectedDate(null);
  }

  // --- Task created successfully ---
  function handleTaskCreated() {
    setRefreshTrigger(prev => prev + 1);
    setPage("calendar");
  }

  // --- Not logged in → show login ---
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // --- Page routing ---
  switch (page) {
    case "daily":
      return (
        <DailyTasksPage
          date={selectedDate}
          user={user}
          onBack={handleBackToCalendar}
        />
      );

    case "create-task":
      return (
        <CreateTaskPage
          onBack={handleBackToCalendar}
          onCreated={handleTaskCreated}
        />
      );

    case "calendar":
    default:
      return (
        <>
          <CalendarPage
            user={user}
            onSelectDate={handleSelectDate}
            onLogout={handleLogout}
            refreshTrigger={refreshTrigger}
          />
          {/* Admin floating action button */}
          {user.role === "admin" && (
            <button
              onClick={() => setPage("create-task")}
              className="fixed bottom-6 right-6 w-14 h-14 bg-gray-800 text-white rounded-full shadow-lg
                text-2xl font-bold hover:bg-gray-700 active:bg-gray-600 active:scale-95 transition-all z-50
                flex items-center justify-center"
              title="Create new task"
            >
              +
            </button>
          )}
        </>
      );
  }
}

export default App;
