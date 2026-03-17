import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function MySessions() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [pastSessions, setPastSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    if (!user) {
      navigate('/signup')
      return
    }

    fetchSessions()
  }, [user])

  const fetchSessions = async () => {
    try {
      const now = new Date().toISOString()

      // Fetch pending requests
      const { data: pending, error: pendingError } = await supabase
        .from('bookings')
        .select(`
          *,
          tutor:tutor_profile_id (
            id,
            hourly_rate,
            languages_taught,
            profile:profile_id (
              full_name
            )
          )
        `)
        .eq('student_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (pendingError) throw pendingError

      // Fetch upcoming sessions (approved/paid)
      const { data: upcoming, error: upcomingError } = await supabase
        .from('bookings')
        .select(`
          *,
          tutor:tutor_profile_id (
            id,
            hourly_rate,
            languages_taught,
            profile:profile_id (
              full_name
            )
          )
        `)
        .eq('student_id', user.id)
        .in('status', ['approved', 'paid'])
        .gte('session_time', now)
        .order('session_time', { ascending: true })

      if (upcomingError) throw upcomingError

      // Fetch past sessions (completed/cancelled/rejected)
      const { data: past, error: pastError } = await supabase
        .from('bookings')
        .select(`
          *,
          tutor:tutor_profile_id (
            id,
            hourly_rate,
            languages_taught,
            profile:profile_id (
              full_name
            )
          )
        `)
        .eq('student_id', user.id)
        .in('status', ['completed', 'cancelled', 'rejected'])
        .order('session_time', { ascending: false })
        .limit(20)

      if (pastError) throw pastError

      setPendingRequests(pending || [])
      setUpcomingSessions(upcoming || [])
      setPastSessions(past || [])

    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

      if (error) throw error

      // Refresh sessions
      fetchSessions()

    } catch (error) {
      console.error('Error cancelling request:', error)
      alert('Failed to cancel request')
    }
  }

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'pending': return { text: 'Awaiting Tutor Approval', color: '#ff9800' }
      case 'approved': return { text: 'Approved - Ready to Pay', color: '#2196F3' }
      case 'paid': return { text: 'Confirmed - Payment Received', color: '#4CAF50' }
      case 'completed': return { text: 'Completed', color: '#4CAF50' }
      case 'cancelled': return { text: 'Cancelled', color: '#f44336' }
      case 'rejected': return { text: 'Rejected by Tutor', color: '#f44336' }
      default: return { text: status, color: '#666' }
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Loading your sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Sessions</h1>
        <Link to="/search" style={styles.findButton}>Find a Tutor</Link>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button 
          style={{...styles.tab, ...(activeTab === 'upcoming' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({upcomingSessions.length})
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'pending' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingRequests.length})
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'past' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('past')}
        >
          Past ({pastSessions.length})
        </button>
      </div>

      {/* Pending Requests */}
      {activeTab === 'pending' && (
        <div style={styles.sessionsList}>
          {pendingRequests.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No pending booking requests</p>
              <Link to="/search" style={styles.emptyLink}>Find a tutor to book a session</Link>
            </div>
          ) : (
            pendingRequests.map(booking => {
              const status = getStatusDisplay(booking.status)
              return (
                <div key={booking.id} style={styles.sessionCard}>
                  <div style={styles.sessionInfo}>
                    <h3>Tutor: {booking.tutor?.profile?.full_name || 'Language Tutor'}</h3>
                    <p>📅 Requested: {formatDateTime(booking.created_at)}</p>
                    <p>⏱️ Duration: {booking.hours} hour{booking.hours > 1 ? 's' : ''}</p>
                    <p>🎥 Mode: {booking.teaching_mode === 'video' ? 'Video Call' : 'Voice Call'}</p>
                    <p>💰 Total: RM {booking.total_amount}</p>
                    <p style={{color: status.color, fontWeight: 'bold'}}>
                      Status: {status.text}
                    </p>
                  </div>
                  <div style={styles.sessionActions}>
                    <button 
                      onClick={() => handleCancelRequest(booking.id)}
                      style={styles.cancelButton}
                    >
                      Cancel Request
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Upcoming Sessions */}
      {activeTab === 'upcoming' && (
        <div style={styles.sessionsList}>
          {upcomingSessions.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No upcoming sessions</p>
              <Link to="/search" style={styles.emptyLink}>Find a tutor to book a session</Link>
            </div>
          ) : (
            upcomingSessions.map(booking => {
              const status = getStatusDisplay(booking.status)
              const sessionTime = new Date(booking.session_time)
              const now = new Date()
              const canJoin = booking.status === 'paid' && 
                             sessionTime <= new Date(now.getTime() + 5 * 60000) && // Within 5 minutes
                             sessionTime >= now

              return (
                <div key={booking.id} style={styles.sessionCard}>
                  <div style={styles.sessionInfo}>
                    <h3>Tutor: {booking.tutor?.profile?.full_name || 'Language Tutor'}</h3>
                    <p>📅 {formatDateTime(booking.session_time)}</p>
                    <p>⏱️ Duration: {booking.hours} hour{booking.hours > 1 ? 's' : ''}</p>
                    <p>🎥 Mode: {booking.teaching_mode === 'video' ? 'Video Call' : 'Voice Call'}</p>
                    <p>💰 Total: RM {booking.total_amount}</p>
                    <p style={{color: status.color, fontWeight: 'bold'}}>
                      Status: {status.text}
                    </p>
                  </div>
                  {booking.status === 'approved' && (
                    <div style={styles.paymentNotice}>
                      <p>Waiting for tutor approval to proceed to payment</p>
                    </div>
                  )}
                  {booking.status === 'paid' && (
                    <div style={styles.joinSection}>
                      {canJoin ? (
                        <button 
                          style={styles.joinButton}
                          onClick={() => window.open(booking.meeting_url, '_blank')}
                        >
                          Join Session
                        </button>
                      ) : (
                        <p style={styles.joinInfo}>
                          Join link available 5 minutes before session
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Past Sessions */}
      {activeTab === 'past' && (
        <div style={styles.sessionsList}>
          {pastSessions.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No past sessions</p>
            </div>
          ) : (
            pastSessions.map(booking => {
              const status = getStatusDisplay(booking.status)
              return (
                <div key={booking.id} style={styles.sessionCard}>
                  <div style={styles.sessionInfo}>
                    <h3>Tutor: {booking.tutor?.profile?.full_name || 'Language Tutor'}</h3>
                    <p>📅 {formatDateTime(booking.session_time)}</p>
                    <p>⏱️ Duration: {booking.hours} hour{booking.hours > 1 ? 's' : ''}</p>
                    <p>🎥 Mode: {booking.teaching_mode === 'video' ? 'Video Call' : 'Voice Call'}</p>
                    <p>💰 Total: RM {booking.total_amount}</p>
                    <p style={{color: status.color, fontWeight: 'bold'}}>
                      Status: {status.text}
                    </p>
                  </div>
                  {booking.status === 'completed' && (
                    <div style={styles.reviewButton}>
                      <button style={styles.reviewBtn}>Leave a Review</button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1000px',
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
  findButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '4px',
    textDecoration: 'none'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '40px',
    textAlign: 'center'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #ddd'
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#666',
    borderBottom: '3px solid transparent'
  },
  activeTab: {
    color: '#4CAF50',
    borderBottom: '3px solid #4CAF50',
    fontWeight: 'bold'
  },
  sessionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sessionInfo: {
    flex: 1
  },
  sessionActions: {
    marginLeft: '20px'
  },
  cancelButton: {
    backgroundColor: '#f44336',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  paymentNotice: {
    backgroundColor: '#fff3e0',
    padding: '10px',
    borderRadius: '4px',
    color: '#e65100'
  },
  joinSection: {
    marginLeft: '20px'
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  joinInfo: {
    color: '#666',
    fontStyle: 'italic'
  },
  reviewButton: {
    marginLeft: '20px'
  },
  reviewBtn: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '40px',
    textAlign: 'center',
    color: '#999'
  },
  emptyLink: {
    color: '#4CAF50',
    textDecoration: 'none',
    display: 'block',
    marginTop: '10px'
  }
}