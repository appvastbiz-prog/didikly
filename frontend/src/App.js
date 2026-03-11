import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import BecomeTutor from './pages/BecomeTutor'
import TutorDashboard from './pages/TutorDashboard'
import SearchTutors from './pages/SearchTutors'
import TutorPublicProfile from './pages/TutorPublicProfile'
import AuthTest from './pages/AuthTest'
import { useAuth } from './contexts/AuthContext'
import './App.css'

// Protected route component
function ProtectedRoute({ children }) {
  const { user, isEmailVerified, loading } = useAuth()
  
  if (loading) return <div style={styles.loading}>Loading...</div>
  
  if (!user) return <Navigate to="/signup" />
  
  if (!isEmailVerified) return <Navigate to="/verify-email" />
  
  return children
}

// Tutor-only route
function TutorRoute({ children }) {
  const { user, isEmailVerified, profile, loading } = useAuth()
  
  if (loading) return <div style={styles.loading}>Loading...</div>
  
  if (!user) return <Navigate to="/signup" />
  
  if (!isEmailVerified) return <Navigate to="/verify-email" />
  
  if (!profile?.is_tutor) return <Navigate to="/dashboard" />
  
  return children
}

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/signup" />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth-test" element={<AuthTest />} />
          
          {/* Protected routes (require login + email verification) */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/search" element={
            <ProtectedRoute>
              <SearchTutors />
            </ProtectedRoute>
          } />
          
          <Route path="/tutor/:id" element={
            <ProtectedRoute>
              <TutorPublicProfile />
            </ProtectedRoute>
          } />
          
          <Route path="/become-tutor" element={
            <ProtectedRoute>
              <BecomeTutor />
            </ProtectedRoute>
          } />
          
          {/* Tutor-only routes */}
          <Route path="/tutor-dashboard" element={
            <TutorRoute>
              <TutorDashboard />
            </TutorRoute>
          } />
          
          {/* Catch-all route for 404 - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

const styles = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#666'
  }
}

export default App