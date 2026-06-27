import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { useAuth } from "./hooks/useAuth";
import PageLayout from "./components/layout/PageLayout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Issues from "./pages/Issues";
import ReportIssue from "./pages/ReportIssue";
import IssueDetail from "./pages/IssueDetail";
import AqiDashboard from "./pages/AqiDashboard";
import SafetyNetwork from "./pages/SafetyNetwork";
import ExpertiseHub from "./pages/ExpertiseHub";
import QuestionDetail from "./pages/QuestionDetail";
import Marketplace from "./pages/Marketplace";
import CreateListing from "./pages/CreateListing";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import ImpactDashboard from "./pages/ImpactDashboard";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <PageLayout>{children}</PageLayout>;
};

function AppLoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3E8FF" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🏘️</div>
        <div style={{ fontFamily: "Space Mono, monospace", color: "#6366F1", fontSize: "14px", fontWeight: "bold" }}>
          Loading SamajConnect...
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(255, 255, 255, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                color: "#1E1B4B",
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "14px",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(31, 38, 135, 0.05)"
              },
              success: { iconTheme: { primary: "#10B981", secondary: "#FFFFFF" } },
              error:   { iconTheme: { primary: "#EF4444", secondary: "#FFFFFF" } },
            }}
          />
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/"                  element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/issues"            element={<ProtectedRoute><Issues /></ProtectedRoute>} />
            <Route path="/issues/report"     element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
            <Route path="/issues/:id"        element={<ProtectedRoute><IssueDetail /></ProtectedRoute>} />
            <Route path="/aqi"               element={<ProtectedRoute><AqiDashboard /></ProtectedRoute>} />
            <Route path="/safety"            element={<ProtectedRoute><SafetyNetwork /></ProtectedRoute>} />
            <Route path="/hub"               element={<ProtectedRoute><ExpertiseHub /></ProtectedRoute>} />
            <Route path="/hub/:id"           element={<ProtectedRoute><QuestionDetail /></ProtectedRoute>} />
            <Route path="/marketplace"       element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/marketplace/create" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
            <Route path="/profile"           element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/leaderboard"       element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/impact"            element={<ProtectedRoute><ImpactDashboard /></ProtectedRoute>} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
