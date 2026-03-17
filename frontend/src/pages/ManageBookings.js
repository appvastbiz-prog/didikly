import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function ManageBookings() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  const [tutorProfile, setTutorProfile] = useState(null)
  const [pendingBookings, setPendingBookings] = useState([])
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [pastBookings, setPastBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('pending')

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
      // Get tutor profile
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (tutorError) throw tutorError
      setTutorProfile(tutorData)

      await fetchBookings(tutorData.id)

    } catch (error) {
      console.error('Error fetching tutor data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async (tutorId) => {
    try {
      const now = new Date().toISOString()

      // Fetch pending bookings
      const { data: pending, error: pendingError } = await supabase
        .from('bookings')
        .select(`
          *,
          student:student_id (
            id,
            email,
            full_name
          )
        `)
        .eq('tutor_profile_id', tutorId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (pendingError) throw pendingError

      // Fetch upcoming bookings (approved/paid)
      const { data: upcoming, error: upcomingError } = await supabase
        .from('bookings')
        .select(`
          *,
          student:student_id (
            id,
            email,
            full_name
          )
        `)
        .eq('tutor_profile_id', tutorId)
        .in('status', ['approved', 'paid'])
        .gte('session_time', now)
        .order('session_time', { ascending: true })

      if (upcomingError) throw upcomingError

      // Fetch past bookings (completed/cancelled)
      const { data: past, error: pastError } = await supabase
        .from('bookings')
        .select(`
          *,
          student:student_id (
            id,
            email,
            full_name
          )
        `)
        .eq('tutor_profile_id', tutorId)
        .in('status', ['completed', 'cancelled', 'rejected'])
        .order('session_time', { ascending: false })
        .limit(20)

      if (pastError) throw pastError

      setPendingBookings(pending || [])
      setUpcomingBookings(upcoming || [])
      setPastBookings(past || [])

    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const handleApprove = async (bookingId) => {
    setProcessingId(bookingId)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'approved' })
        .eq('id', bookingId)

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Booking approved! Student can now proceed to payment.' 
      })

      // Refresh bookings
      await fetchBookings(tutorProfile.id)

    } catch (error) {
      console.error('Error approving booking:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to approve booking' 
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this booking request?')) {
      return
    }

    setProcessingId(bookingId)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId)

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Booking rejected.' 
      })

      // Refresh bookings
      await fetchBookings(tutorProfile.id)

    } catch (error) {
      console.error('Error rejecting booking:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to reject booking' 
      })
    } finally {
      setProcessingId(null)
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

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Manage Bookings</h1>
        <Link to="/tutor-dashboard" style={styles.backLink}>← Back to Dashboard</Link>
      </div>

      {message.text && (
        <div style={message.type === 'error' ? styles.errorBox : styles.successBox}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button 
          style={{...styles.tab, ...(activeTab === 'pending' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingBookings.length})
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'upcoming' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button 
          style={{...styles.tab, ...(activeTab === 'past' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('past')}
        >
          Past ({pastBookings.length})
        </button>
      </div>

      {/* Pending Bookings */}
      {activeTab === 'pending' && (
        <div style={styles.bookingsList}>
          {pendingBookings.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No pending booking requests</p>
            </div>
          ) : (
            pendingBookings.map(booking => (
              <div key={booking.id} style={styles.bookingCard}>
                <div style={styles.bookingInfo}>
                  <h3>Student: {booking.student?.full_name || 'Anonymous'}</h3>
                  <p>📅 {formatDateTime(booking.session_time)}</p>
                  <p>⏱️ Duration: {booking.hours} hour{booking.hours > 1 ? 's' : ''}</p>
                  <p>🎥 Mode: {booking.teaching_mode === 'video' ? 'Video Call' : 'Voice Call'}</p>
                  <p>💰 Total: RM {booking.total_amount}</p>
                  <p>📧 Student email: {booking.student?.email}</p>
                </div>
                <div style={styles.bookingActions}>
                  <button 
                    onClick={() => handleApprove(booking.id)}
                    disabled={processingId === booking.id}
                    style={styles.approveButton}
                  >
                    {processingId === booking.id ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button 
                    onClick={() => handleReject(booking.id)}
                    disabled={processingId === booking.id}
                    style={styles.rejectButton}
                  >
                    {processingId === booking.id ? '...' : '✗ Reject'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Upcoming Bookings */}
      {activeTab === 'upcoming' && (
        <div style={styles.bookingsList}>
          {upcomingBookings.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No upcoming sessions</p>
            </div>
          ) : (
            upcomingBookings.map(booking => (
              <div key={booking.id} style={styles.bookingCard}>
                <div style={styles.bookingInfo}>
                  <h3>Student: {booking.student?.full_name || 'Anonymous'}</h3>
                  <p>📅 {formatDateTime(booking.session_time)}</p>
                  <p>⏱️ Duration: {booking.hours} hour{booking.hours > 1 ? 's' : ''}</p>
                  <p>🎥 Mode: {booking.teaching_mode === 'video' ? 'Video Call' : 'Voice Call'}</p>
                  <p>💰 Total: RM {booking.total_amount}</p>
                  <p style={styles.statusBadge}>
                    Status: {booking.status === 'paid' ? '✅ Paid' : '⏳ Awaiting Payment'}
                  </p>
                  {booking.status === 'paid' && (
                    <p style={styles.joinLink}>
                      Join link will appear 5 minutes before session
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Past Bookings */}
      {activeTab === 'past' && (
        <div style={styles.bookingsList}>
          {pastBookings.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No past sessions</p>
            </div>
          ) : (
            pastBookings.map(booking => (
              <div key={booking.id} style={styles.bookingCard}>
                <div style={styles.bookingInfo}>
                  <h3>Student: {booking.student?.full_name || 'Anonymous'}</h3>
                  <p>📅 {formatDateTime(booking.session_time)}</p>
                  <p>⏱️ Duration: {booking.hours} hour{booking.hours > 1 ? 's' : ''}</p>
                  <p>🎥 Mode: {booking.teaching_mode === 'video' ? 'Video Call' : 'Voice Call'}</p>
                  <p>💰 Total: RM {booking.total_amount}</p>
                  <p style={
                    booking.status === 'completed' ? styles.completedBadge :
                    booking.status === 'cancelled' ? styles.cancelledBadge :
                    styles.rejectedBadge
                  }>
                    Status: {booking.status}
                  </p>
                </div>
              </div>
            ))
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
  backLink: {
    color: '#4CAF50',
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
  bookingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bookingInfo: {
    flex: 1
  },
  bookingActions: {
    display: 'flex',
    gap: '10px',
    marginLeft: '20px'
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  rejectButton: {
    backgroundColor: '#f44336',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  statusBadge: {
    color: '#ff9800',
    fontWeight: 'bold'
  },
  completedBadge: {
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  cancelledBadge: {
    color: '#f44336',
    fontWeight: 'bold'
  },
  rejectedBadge: {
    color: '#f44336',
    fontWeight: 'bold'
  },
  joinLink: {
    color: '#2196F3',
    fontStyle: 'italic'
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '40px',
    textAlign: 'center',
    color: '#999'
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
  }
}