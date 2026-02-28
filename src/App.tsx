import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import ModeToggle from "@/components/ModeToggle";
import ListPage from "./pages/ListPage";
import SettingsPage from "./pages/SettingsPage";
import { useFocusStore } from "@/store/focus";

function App() {
  const fetchActiveSession = useFocusStore((state) => state.fetchActiveSession);

  // Fetch active focus session on app mount
  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Navbar */}
        <div className="w-full h-16 flex items-center px-6 flex-shrink-0 border-b border-border/40">
          {/* Left spacer for balance */}
          <div className="flex-1"></div>

          {/* Centered navigation */}
          <nav className="flex items-center gap-2">
            <NavLink
              to="/list"
              className={({ isActive }) =>
                `text-sm font-medium px-3 py-2 rounded-md transition-all ${
                  isActive
                    ? "text-primary bg-primary/10 border-b-2 border-primary"
                    : "text-foreground hover:text-primary hover:bg-accent"
                }`
              }
            >
              List
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `text-sm font-medium px-3 py-2 rounded-md transition-all ${
                  isActive
                    ? "text-primary bg-primary/10 border-b-2 border-primary"
                    : "text-foreground hover:text-primary hover:bg-accent"
                }`
              }
            >
              Settings
            </NavLink>
          </nav>

          {/* Right controls */}
          <div className="flex-1 flex justify-end">
            <ModeToggle />
          </div>
        </div>

        {/* Main content area with routes */}
        <Routes>
          <Route path="/" element={<Navigate to="/list" replace />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/dashboard" element={<Navigate to="/list" replace />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
