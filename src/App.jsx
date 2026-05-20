import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

// Public Pages
import LandingPage from './pages/public/LandingPage'
import ElectionDetailPage from './pages/public/ElectionDetailPage'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import EmailVerifiedPage from './pages/auth/EmailVerifiedPage'

// Admin Pages
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRequests from './pages/admin/AdminRequests'
import AdminElections from './pages/admin/AdminElections'
import AdminUsers from './pages/admin/AdminUsers'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'

// Creator Pages
import CreatorLayout from './components/layout/CreatorLayout'
import CreatorDashboard from './pages/creator/CreatorDashboard'
import CreateElection from './pages/creator/CreateElection'
import EditElection from './pages/creator/EditElection'
import ManageCandidates from './pages/creator/ManageCandidates'
import ManageVoters from './pages/creator/ManageVoters'
import ElectionResults from './pages/creator/ElectionResults'

// Voter Pages
import VoterLayout from './components/layout/VoterLayout'
import VoterDashboard from './pages/voter/VoterDashboard'
import VoterPolls from './pages/voter/VoterPolls'
import VotingPage from './pages/voter/VotingPage'
import RequestCreatorAccess from './pages/voter/RequestCreatorAccess'

// UI
import { LoadingScreen } from './components/ui/LoadingScreen'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth()
  
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth/login" replace />
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    if (profile.role === 'super_admin') return <Navigate to="/admin" replace />
    if (profile.role === 'election_creator') return <Navigate to="/creator" replace />
    return <Navigate to="/voter" replace />
  }
  return children
}

const PublicOnlyRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user && profile) {
    if (profile.role === 'super_admin') return <Navigate to="/admin" replace />
    if (profile.role === 'election_creator') return <Navigate to="/creator" replace />
    return <Navigate to="/voter" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/election/:id" element={<ElectionDetailPage />} />

      {/* Auth */}
      <Route path="/auth/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/auth/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<EmailVerifiedPage />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['super_admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="elections" element={<AdminElections />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
      </Route>

      {/* Creator */}
      <Route path="/creator" element={<ProtectedRoute allowedRoles={['election_creator']}><CreatorLayout /></ProtectedRoute>}>
        <Route index element={<CreatorDashboard />} />
        <Route path="elections/new" element={<CreateElection />} />
        <Route path="elections/:id/edit" element={<EditElection />} />
        <Route path="elections/:id/candidates" element={<ManageCandidates />} />
        <Route path="elections/:id/voters" element={<ManageVoters />} />
        <Route path="elections/:id/results" element={<ElectionResults />} />
      </Route>

      {/* Voter */}
      <Route path="/voter" element={<ProtectedRoute allowedRoles={['voter', 'election_creator']}><VoterLayout /></ProtectedRoute>}>
        <Route index element={<VoterDashboard />} />
        <Route path="polls" element={<VoterPolls />} />
        <Route path="vote/:electionId" element={<VotingPage />} />
        <Route path="request-access" element={<RequestCreatorAccess />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg, #1e293b)',
                color: '#f1f5f9',
                borderRadius: '12px',
                border: '1px solid rgba(99,102,241,0.2)',
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: '500',
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
