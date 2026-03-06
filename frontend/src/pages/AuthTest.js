import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthTest() {
  const { user, profile, signUp, signIn, signOut, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSignUp = async () => {
    setMessage('')
    
    // Check UTeM email
    if (!email.endsWith('@utem.edu.my') && !email.endsWith('@student.utem.edu.my')) {
      setMessage('❌ Only UTeM emails (@utem.edu.my or @student.utem.edu.my) are allowed')
      return
    }

    const { data, error } = await signUp(email, password)
    
    if (error) {
      setMessage(`❌ Error: ${error.message}`)
    } else {
      setMessage('✅ Signup successful! Check your email for confirmation link.')
    }
  }

  const handleSignIn = async () => {
    setMessage('')
    
    const { data, error } = await signIn(email, password)
    
    if (error) {
      setMessage(`❌ Error: ${error.message}`)
    } else {
      setMessage('✅ Login successful!')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setMessage('Signed out')
  }

  if (loading) {
    return <div style={styles.container}>Loading...</div>
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔐 Didikly Auth Test</h1>
      
      {user ? (
        <div style={styles.card}>
          <h2 style={styles.success}>✅ Logged In</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Is Tutor:</strong> {profile?.is_tutor ? 'Yes' : 'No'}</p>
          {profile && (
            <div>
              <p><strong>Profile:</strong></p>
              <pre style={styles.pre}>{JSON.stringify(profile, null, 2)}</pre>
            </div>
          )}
          <button onClick={handleSignOut} style={styles.button}>Sign Out</button>
        </div>
      ) : (
        <div style={styles.card}>
          <h2>Sign Up / Sign In</h2>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email (UTeM only):</label>
            <input
              type="email"
              placeholder="student@utem.edu.my"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password:</label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.buttonGroup}>
            <button onClick={handleSignUp} style={{...styles.button, ...styles.buttonPrimary}}>
              Sign Up
            </button>
            <button onClick={handleSignIn} style={styles.button}>
              Sign In
            </button>
          </div>

          {message && (
            <div style={styles.message}>
              {message}
            </div>
          )}

          <div style={styles.note}>
            <p><strong>Note:</strong> After signup, check your email (including spam) for confirmation link.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple styles
const styles = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    textAlign: 'center',
    color: '#333'
  },
  card: {
    backgroundColor: '#f5f5f5',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  inputGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  button: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#e0e0e0'
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
    color: 'white'
  },
  message: {
    marginTop: '20px',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: '#e3f2fd'
  },
  success: {
    color: '#4CAF50'
  },
  pre: {
    backgroundColor: '#fff',
    padding: '10px',
    borderRadius: '4px',
    overflow: 'auto'
  },
  note: {
    marginTop: '20px',
    padding: '10px',
    backgroundColor: '#fff3cd',
    borderRadius: '4px',
    fontSize: '14px'
  }
}