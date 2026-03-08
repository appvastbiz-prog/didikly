import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function VerifyEmail() {
  const { user, isEmailVerified, resendConfirmation, checkVerification } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [checking, setChecking] = useState(false)
  const navigate = useNavigate()

  // If user is already verified, redirect to dashboard
  useEffect(() => {
    if (isEmailVerified) {
      navigate('/dashboard')
    }
  }, [isEmailVerified, navigate])

  const handleResend = async () => {
    if (!user?.email) return
    
    setLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      const { error } = await resendConfirmation(user.email)
      
      if (error) throw error
      
      setMessage({ 
        type: 'success', 
        text: 'Confirmation email resent! Please check your inbox (including spam).' 
      })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to resend confirmation email' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckVerification = async () => {
    setChecking(true)
    setMessage({ type: '', text: '' })
    
    try {
      const verified = await checkVerification()
      
      if (verified) {
        setMessage({ 
          type: 'success', 
          text: 'Email verified! Redirecting to dashboard...' 
        })
        setTimeout(() => navigate('/dashboard'), 2000)
      } else {
        setMessage({ 
          type: 'info', 
          text: 'Email not verified yet. Please check your inbox and click the confirmation link.' 
        })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to check verification status' 
      })
    } finally {
      setChecking(false)
    }
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Not Signed In</h2>
          <p>Please <Link to="/signup">sign up</Link> or <Link to="/login">sign in</Link> first.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>✉️</div>
        <h1 style={styles.title}>Verify Your Email</h1>
        
        <div style={styles.emailBox}>
          <p>We sent a confirmation email to:</p>
          <strong style={styles.email}>{user.email}</strong>
        </div>

        <div style={styles.instructions}>
          <p>📧 Click the link in the email to verify your account</p>
          <p>⏱️ The link expires after 24 hours</p>
          <p>📁 Check your spam folder if you don't see it</p>
        </div>

        {message.text && (
          <div style={message.type === 'error' ? styles.errorBox : 
                      message.type === 'success' ? styles.successBox : 
                      styles.infoBox}>
            {message.text}
          </div>
        )}

        <div style={styles.buttonGroup}>
          <button 
            onClick={handleCheckVerification}
            disabled={checking}
            style={checking ? styles.buttonSecondaryDisabled : styles.buttonSecondary}
          >
            {checking ? 'Checking...' : '✅ I\'ve Verified'}
          </button>

          <button 
            onClick={handleResend}
            disabled={loading}
            style={loading ? styles.buttonDisabled : styles.buttonPrimary}
          >
            {loading ? 'Sending...' : '🔄 Resend Email'}
          </button>
        </div>

        <div style={styles.footer}>
          <p>Wrong email? <Link to="/signup" style={styles.link}>Sign up again</Link></p>
        </div>
      </div>
    </div>
  )
}

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
    maxWidth: '450px',
    textAlign: 'center'
  },
  iconContainer: {
    fontSize: '48px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px'
  },
  emailBox: {
    backgroundColor: '#f0f7ff',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  email: {
    fontSize: '16px',
    color: '#1976d2',
    wordBreak: 'break-all'
  },
  instructions: {
    textAlign: 'left',
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '12px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '12px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  buttonDisabled: {
    flex: 1,
    backgroundColor: '#ccc',
    color: 'white',
    padding: '12px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed'
  },
  buttonSecondaryDisabled: {
    flex: 1,
    backgroundColor: '#90caf9',
    color: 'white',
    padding: '12px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed'
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '20px'
  },
  successBox: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '20px'
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    color: '#0d47a1',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '20px'
  },
  footer: {
    fontSize: '14px',
    color: '#666'
  },
  link: {
    color: '#4CAF50',
    textDecoration: 'none',
    fontWeight: '500'
  }
}