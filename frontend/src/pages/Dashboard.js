import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/signup')
  }

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Not Signed In</h2>
          <p>Please <Link to="/signup">sign up</Link> or <Link to="/login">sign in</Link>.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome to Didikly! 🎉</h1>
        
        <div style={styles.userInfo}>
          <h3>Your Account</h3>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Email Verified:</strong> {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Account Type:</strong> {profile?.is_tutor ? 'Tutor' : 'Student'}</p>
        </div>

        <div style={styles.nextSteps}>
          <h3>Next Steps</h3>
          {profile?.is_tutor ? (
            <ul style={styles.stepList}>
              <li>📅 <Link to="/set-availability" style={styles.link}>Set your availability</Link></li>
              <li>📋 <Link to="/my-sessions" style={styles.link}>View my sessions</Link></li>
              <li>✏️ <Link to="/edit-tutor-profile" style={styles.link}>Complete your tutor profile</Link></li>
              <li>🔍 <Link to="/tutor-dashboard" style={styles.link}>Go to tutor dashboard</Link></li>
            </ul>
          ) : (
            <ul style={styles.stepList}>
              <li>🔍 <Link to="/search" style={styles.link}>Find a tutor</Link> to start learning</li>
              <li>✨ <Link to="/become-tutor" style={styles.becomeTutorLink}>Become a tutor</Link> and share your language skills</li>
              <li>📚 Book your first lesson</li>
            </ul>
          )}
        </div>

        {!profile?.is_tutor && (
          <div style={styles.becomeTutorSection}>
            <Link to="/become-tutor" style={{ textDecoration: 'none' }}>
              <button style={styles.becomeTutorButton}>
                Become a Tutor
              </button>
            </Link>
            <p style={styles.becomeTutorNote}>
              Share your language skills and earn money teaching UTeM students
            </p>
          </div>
        )}

        <button onClick={handleSignOut} style={styles.signOutButton}>
          Sign Out
        </button>
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
    maxWidth: '500px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '30px',
    textAlign: 'center'
  },
  userInfo: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  nextSteps: {
    backgroundColor: '#e8f5e8',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  stepList: {
    listStyle: 'none',
    padding: 0,
    margin: '10px 0 0 0'
  },
  link: {
    color: '#4CAF50',
    textDecoration: 'none'
  },
  becomeTutorLink: {
    color: '#4CAF50',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  becomeTutorSection: {
    textAlign: 'center',
    marginBottom: '20px',
    padding: '20px',
    backgroundColor: '#e3f2fd',
    borderRadius: '6px'
  },
  becomeTutorButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '14px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    marginBottom: '10px'
  },
  becomeTutorNote: {
    fontSize: '13px',
    color: '#0d47a1',
    margin: 0
  },
  signOutButton: {
    backgroundColor: '#f44336',
    color: 'white',
    padding: '12px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%'
  }
}