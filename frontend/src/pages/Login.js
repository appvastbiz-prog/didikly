import React from 'react'
import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Login page coming soon!</p>
        <div style={styles.footer}>
          <p>Don't have an account? <Link to="/signup" style={styles.link}>Sign Up</Link></p>
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
    maxWidth: '400px',
    textAlign: 'center'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px'
  },
  footer: {
    marginTop: '20px',
    fontSize: '14px'
  },
  link: {
    color: '#4CAF50',
    textDecoration: 'none',
    fontWeight: '500'
  }
}