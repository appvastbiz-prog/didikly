import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function TutorDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  
  const [tutorProfile, setTutorProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, paid: 0 })

  useEffect(() => {
    if (!user) {
      navigate('/signup')
      return
    }

    if (profile && !profile.is_tutor) {
      navigate('/dashboard')
      return
    }

    fetchTutorData()
  }, [user, profile])

  const fetchTutorData = async () => {
    try {
      // Fetch tutor profile
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('profile_id', user.id)
        .single()

      if (tutorError) throw tutorError
      setTutorProfile(tutorData)

      // Fetch upcoming sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('bookings')
        .select(`
          *,
          student:student_id (
            email,
            full_name
          )
        `)
        .eq('tutor_profile_id', tutorData.id)
        .in('status', ['paid', 'approved'])
        .order('session_time', { ascending: true })

      if (sessionsError) throw sessionsError
      setUpcomingSessions(sessionsData || [])

      // Fetch earnings (completed sessions)
      const { data: completedData, error: completedError } = await supabase
        .from('bookings')
        .select('*')
        .eq('tutor_profile_id', tutorData.id)
        .eq('status', 'completed')

      if (completedError) throw completedError

      const total = completedData?.reduce((sum, s) => sum + (s.tutor_payout_amount || 0), 0) || 0
      setEarnings({
        total,
        pending: 0, // We'll calculate this properly when payments are integrated
        paid: total
      })

    } catch (error) {
      console.error('Error fetching tutor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Loading your tutor dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Tutor Dashboard</h1>
        <button onClick={handleSignOut} style={styles.signOutButton}>
          Sign Out
        </button>
      </div>

      <div style={styles.grid}>
        {/* Profile Summary */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Your Tutor Profile</h2>
          <div style={styles.profileInfo}>
            <p><strong>Languages:</strong> {tutorProfile?.languages_taught?.join(', ')}</p>
            <p><strong>Hourly Rate:</strong> RM {tutorProfile?.hourly_rate}</p>
            <p><strong>Teaching Modes:</strong> {
              tutorProfile?.teaching_modes?.map(m => 
                m === 'video' ? 'Video Call' : 'Voice Call'
              ).join(', ')
            }</p>
            <p><strong>Experience:</strong> {tutorProfile?.teaching_experience_years} years</p>
            <p><strong>Average Rating:</strong> ⭐ {tutorProfile?.average_rating?.toFixed(1) || 'New'}</p>
            <p><strong>Total Sessions:</strong> {tutorProfile?.total_sessions || 0}</p>
          </div>
          <Link to="/edit-tutor-profile" style={styles.editLink}>
            <button style={styles.secondaryButton}>Edit Profile</button>
          </Link>
        </div>

        {/* Earnings Summary */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Earnings</h2>
          <div style={styles.earnings}>
            <div style={styles.earningItem}>
              <span style={styles.earningLabel}>Total Earned</span>
              <span style={styles.earningValue}>RM {earnings.total.toFixed(2)}</span>
            </div>
            <div style={styles.earningItem}>
              <span style={styles.earningLabel}>Pending</span>
              <span style={styles.earningValue}>RM {earnings.pending.toFixed(2)}</span>
            </div>
            <div style={styles.earningItem}>
              <span style={styles.earningLabel}>Paid Out</span>
              <span style={styles.earningValue}>RM {earnings.paid.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div style={{...styles.card, gridColumn: 'span 2'}}>
          <h2 style={styles.cardTitle}>Upcoming Sessions</h2>
          {upcomingSessions.length === 0 ? (
            <p style={styles.emptyState}>No upcoming sessions</p>
          ) : (
            <div style={styles.sessionList}>
              {upcomingSessions.map(session => (
                <div key={session.id} style={styles.sessionCard}>
                  <div style={styles.sessionInfo}>
                    <p><strong>Student:</strong> {session.student?.full_name || 'Student'}</p>
                    <p><strong>Date:</strong> {new Date(session.session_time).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {new Date(session.session_time).toLocaleTimeString()}</p>
                    <p><strong>Duration:</strong> {session.hours} hour(s)</p>
                    <p><strong>Mode:</strong> {session.teaching_mode === 'video' ? 'Video Call' : 'Voice Call'}</p>
                    <p><strong>Status:</strong> {session.status}</p>
                  </div>
                  {session.status === 'paid' && (
                    <button 
                      style={styles.startButton}
                      onClick={() => window.open(session.meeting_url, '_blank')}
                    >
                      Join Session
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Quick Actions</h2>
          <div style={styles.quickLinks}>
            <Link to="/set-availability" style={styles.quickLink}>
              <button style={styles.actionButton}>📅 Set Availability</button>
            </Link>
            // Add this with other quick links
            <Link to="/manage-bookings" style={styles.quickLink}>
              <button style={styles.actionButton}>📋 Manage Bookings</button>
            </Link>
            <Link to="/edit-tutor-profile" style={styles.quickLink}>
              <button style={styles.actionButton}>✏️ Edit Profile</button>
            </Link>
            <Link to="/earnings" style={styles.quickLink}>
              <button style={styles.actionButton}>💰 View Earnings</button>
            </Link>
            <Link to="/help" style={styles.quickLink}>
              <button style={styles.actionButton}>❓ Help</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    color: '#333',
    margin: 0
  },
  signOutButton: {
    backgroundColor: '#f44336',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px'
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginTop: 0,
    marginBottom: '15px',
    borderBottom: '2px solid #4CAF50',
    paddingBottom: '10px'
  },
  profileInfo: {
    lineHeight: '1.8',
    marginBottom: '15px'
  },
  earnings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  earningItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #eee'
  },
  earningLabel: {
    color: '#666'
  },
  earningValue: {
    fontWeight: '600',
    color: '#4CAF50'
  },
  editLink: {
    textDecoration: 'none'
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%'
  },
  emptyState: {
    textAlign: 'center',
    color: '#999',
    padding: '20px'
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  sessionCard: {
    border: '1px solid #eee',
    borderRadius: '4px',
    padding: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sessionInfo: {
    lineHeight: '1.6'
  },
  startButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  quickLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  quickLink: {
    textDecoration: 'none'
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    color: '#333',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontSize: '14px'
  }
}