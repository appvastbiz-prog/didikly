import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  
  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!email || !password) {
      setMessage({ type: 'error', text: 'All fields are required' })
      return
    }

    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setMessage({ 
            type: 'warning', 
            text: 'Please verify your email first. Check your inbox for the confirmation link.' 
          })
          setTimeout(() => navigate('/verify-email'), 3000)
        } else {
          throw error
        }
      } else {
        // Login successful
        navigate('/dashboard')
      }
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to sign in' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!resetEmail) {
      setMessage({ type: 'error', text: 'Please enter your email' })
      return
    }

    setLoading(true)

    try {
      const { error } = await resetPassword(resetEmail)
      
      if (error) throw error
      
      setResetSent(true)
      setMessage({ 
        type: 'success', 
        text: 'Password reset email sent! Check your inbox (including spam).' 
      })
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to send reset email' 
      })
    } finally {
      setLoading(false)
    }
  }

  // Allowed domains for hint
  const allowedDomains = ['utem.edu.my', 'student.utem.edu.my']

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Sign in to Didikly</p>
        
        {!showReset ? (
          // Login Form
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>UTeM Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@utem.edu.my"
                style={styles.input}
                disabled={loading}
                required
              />
              <small style={styles.hint}>
                Any email (testing mode - UTeM restriction disabled)
              </small>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                disabled={loading}
                required
              />
            </div>

            {message.text && (
              <div style={
                message.type === 'error' ? styles.errorBox :
                message.type === 'warning' ? styles.warningBox :
                styles.successBox
              }>
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              style={loading ? styles.buttonDisabled : styles.button}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={styles.links}>
              <button 
                type="button"
                onClick={() => setShowReset(true)}
                style={styles.linkButton}
              >
                Forgot Password?
              </button>
            </div>
          </form>
        ) : (
          // Reset Password Form
          <form onSubmit={handleResetPassword} style={styles.form}>
            <h3 style={styles.resetTitle}>Reset Password</h3>
            <p style={styles.resetText}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div style={styles.inputGroup}>
              <label style={styles.label}>UTeM Email</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="student@utem.edu.my"
                style={styles.input}
                disabled={loading || resetSent}
                required
              />
            </div>

            {message.text && (
              <div style={
                message.type === 'error' ? styles.errorBox :
                styles.successBox
              }>
                {message.text}
              </div>
            )}

            {!resetSent ? (
              <div style={styles.buttonGroup}>
                <button 
                  type="submit" 
                  style={loading ? styles.buttonDisabled : styles.button}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowReset(false)
                    setResetSent(false)
                    setMessage({ type: '', text: '' })
                  }}
                  style={styles.buttonSecondary}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  setShowReset(false)
                  setResetSent(false)
                  setMessage({ type: '', text: '' })
                }}
                style={styles.button}
              >
                Return to Login
              </button>
            )}
          </form>
        )}

        <div style={styles.footer}>
          <p>Don't have an account? <Link to="/signup" style={styles.link}>Sign Up</Link></p>
        </div>

        <div style={styles.note}>
          <p><strong>📧 UTeM Students Only:</strong> Use your university email to sign in.</p>
        </div>
      </div>
    </div>
  )
}

// Styles
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
    fontSize: '28px',
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
    marginTop: '10px'
  },
  buttonSecondary: {
    backgroundColor: '#9e9e9e',
    color: 'white',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '10px'
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
    marginTop: '10px'
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    border: '1px solid #ffcdd2'
  },
  warningBox: {
    backgroundColor: '#fff3e0',
    color: '#e65100',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    border: '1px solid #ffe0b2'
  },
  successBox: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    border: '1px solid #a5d6a7'
  },
  links: {
    textAlign: 'center',
    marginTop: '10px'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#4CAF50',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '14px'
  },
  resetTitle: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '10px',
    textAlign: 'center'
  },
  resetText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
    textAlign: 'center'
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
  },
  note: {
    marginTop: '20px',
    padding: '12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#0d47a1'
  }
}