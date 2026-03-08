import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
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

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/signup" />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/auth-test" element={<AuthTest />} />
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