import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore.js';
import { ToastProvider } from './components/ui/Toast.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { MeetingLobbyPage } from './pages/MeetingLobbyPage.js';
import { MeetingRoomPage } from './pages/MeetingRoomPage.js';
import { PostMeetingPage } from './pages/PostMeetingPage.js';
import { MeetingHistoryPage } from './pages/MeetingHistoryPage.js';
import { ActionItemsPage } from './pages/ActionItemsPage.js';
import { KanbanPage } from './pages/KanbanPage.js';
import { WorkspacesPage } from './pages/WorkspacesPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Fullscreen Meeting Flow */}
            <Route
              path="/lobby/:meetingCode"
              element={
                <ProtectedRoute>
                  <MeetingLobbyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meeting/:meetingCode"
              element={
                <ProtectedRoute>
                  <MeetingRoomPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Application Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/meetings" element={<MeetingHistoryPage />} />
              <Route path="/meeting/:id/summary" element={<PostMeetingPage />} />
              <Route path="/action-items" element={<ActionItemsPage />} />
              <Route path="/tasks" element={<KanbanPage />} />
              <Route path="/workspaces" element={<WorkspacesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/calendar" element={<MeetingHistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
