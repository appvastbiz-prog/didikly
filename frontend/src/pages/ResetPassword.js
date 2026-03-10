import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isValidSession, setIsValidSession] = useState(false)
  const [checking, setChecking] = useState(true)
  
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handlePasswordResetSession = async () => {
      console.log('Location hash:', location.hash)
      console.log('Full location:', window.location.href)
      
      try {
        // Check if we have a session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Current session:', session)
        
        if (sessionError) {
          console.error('Session error:', sessionError)
        }
        
        // The presence of a session with the user indicates we're in recovery mode
        if (session?.user) {
          console.log('Valid session found for user:', session.user.email)
          setIsValidSession(true)
        } else {
          // If no session, try to get the token from URL
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const type = hashParams.get('type')
          
          console.log('Access token from hash:', accessToken ? 'present' : 'missing')
          console.log('Type from hash:', type)
          
          if (accessToken && type === 'recovery') {
            // Manually set the session
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || '',
            })
            
            if (error) {
              console.error('Error setting session:', error)
              setIsValidSession(false)
            } else {
              console.log('Session set successfully')
              setIsValidSession(true)
            }
          } else {
            console.log('No valid recovery token found in URL')
            setIsValidSession(false)
          }
        }
      } catch (err) {
        console.error('Exception in session check:', err)
        setIsValidSession(false)
      } finally {
        setChecking(false)
      }
    }

    handlePasswordResetSession()
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!password || !confirmPassword) {
      setMessage({ type: 'error', text: 'All fields are required' })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(password)
      
      if (error) throw error
      
      setMessage({ 
        type: 'success', 
        text: 'Password updated successfully! Redirecting to login...' 
      })
      
      // Sign out after password change
      await supabase.auth.signOut()
      
      // Redirect to login
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
      
    } catch (error) {
      console.error('Error updating password:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update password. Please request a new reset link.' 
      })
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Verifying reset link...</p>
        </div>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Invalid or Expired Link</h1>
          <p style={styles.subtitle}>
            This password reset link is no longer valid. Please request a new one.
          </p>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button style={styles.button}>Return to Login</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset Your Password</h1>
        <p style={styles.subtitle}>Enter your new password below</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              disabled={loading}
              required
              minLength="6"
            />
            <small style={styles.hint}>At least 6 characters</small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          {message.text && (
            <div style={
              message.type === 'error' ? styles.errorBox : 
              message.type === 'success' ? styles.successBox : 
              styles.infoBox
            }>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            style={loading ? styles.buttonDisabled : styles.button}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <div style={styles.footer}>
          <p>Remember your password? <Link to="/login" style={styles.link}>Sign In</Link></p>
        </div>
      </div>
    </div>
  )
}

// Styles (keep the same as before)
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '30px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  hint: {
    fontSize: '12px',
    color: '#666'
  },
  button: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '10px',
    width: '100%'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    color: 'white',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
    marginTop: '10px',
    width: '100%'
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    border: '1px solid #ffcdd2'
  },
  successBox: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    border: '1px solid #a5d6a7'
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    color: '#0d47a1',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    border: '1px solid #bbdefb'
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '14px'
  },
  link: {
    color: '#4CAF50',
    textDecoration: 'none',
    fontWeight: '500'
  }
}