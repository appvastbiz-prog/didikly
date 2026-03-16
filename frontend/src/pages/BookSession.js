import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function BookSession() {
  const { tutorId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [tutor, setTutor] = useState(null)
  const [availability, setAvailability] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [hours, setHours] = useState(1)
  const [teachingMode, setTeachingMode] = useState('video')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [dateError, setDateError] = useState('')

  // Get next 14 days
  const getNextDays = () => {
    const days = []
    for (let i = 0; i < 14; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      // Store as YYYY-MM-DD string to avoid timezone issues
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      days.push({
        dateObj: date,
        dateString: `${year}-${month}-${day}`,
        display: date.toLocaleDateString('en-MY', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      })
    }
    return days
  }

  useEffect(() => {
    if (!user) {
      navigate('/signup')
      return
    }
    fetchTutorData()
  }, [tutorId])

  useEffect(() => {
    if (selectedDate) {
      console.log('📅 Date selected (string):', selectedDate)
      fetchAvailabilityForDate(selectedDate)
      setDateError('')
      setSelectedSlot(null)
    }
  }, [selectedDate])

  const fetchTutorData = async () => {
    try {
      const { data, error } = await supabase
        .from('tutor_profiles')
        .select(`
          *,
          profile:profile_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', tutorId)
        .single()

      if (error) throw error
      setTutor(data)
    } catch (error) {
      console.error('Error fetching tutor:', error)
    }
  }

  const fetchAvailabilityForDate = async (dateString) => {
    try {
      console.log('🔍 Fetching availability for date string:', dateString)
      
      // Parse the date string (YYYY-MM-DD) directly to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day) // Month is 0-indexed in JS
      
      // Get day of week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = date.getDay()
      console.log('📆 Date object:', date.toDateString())
      console.log('📆 Day of week:', dayOfWeek, '(', getDayName(dayOfWeek), ')')
      
      // Get recurring availability for this day of week
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('tutor_profile_id', tutorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_recurring', true)
        .eq('is_booked', false)

      if (error) throw error
      console.log('📋 Availability data:', data)

      if (!data || data.length === 0) {
        console.log('⚠️ No availability found for this day')
        setAvailability([])
        return
      }

      // Get existing bookings for this date
      const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
      const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))

      console.log('📅 Checking bookings between:', startOfDay.toISOString(), 'and', endOfDay.toISOString())

      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('session_time, hours')
        .eq('tutor_profile_id', tutorId)
        .gte('session_time', startOfDay.toISOString())
        .lt('session_time', endOfDay.toISOString())
        .in('status', ['approved', 'paid'])

      if (bookingError) throw bookingError
      console.log('📋 Existing bookings:', bookings)

      // Convert availability slots to time slots
      const slots = []
      data.forEach(slot => {
        const startHour = parseInt(slot.start_time.split(':')[0])
        const endHour = parseInt(slot.end_time.split(':')[0])
        
        console.log(`⏰ Slot hours: ${startHour}:00 to ${endHour}:00`)
        
        for (let hour = startHour; hour < endHour; hour++) {
          // Create slot time in local timezone but store as UTC for consistency
          const slotTime = new Date(year, month - 1, day, hour, 0, 0)
          
          // Check if this hour is already booked
          const isBooked = bookings?.some(booking => {
            const bookingTime = new Date(booking.session_time)
            return bookingTime.getUTCHours() === hour || 
                   bookingTime.getHours() === hour // Check both just in case
          })

          if (!isBooked) {
            slots.push({
              time: slotTime,
              hour,
              display: `${hour}:00 - ${hour + 1}:00`
            })
          }
        }
      })

      console.log('✅ Generated slots:', slots)
      setAvailability(slots)

    } catch (error) {
      console.error('❌ Error fetching availability:', error)
    }
  }

  const getDayName = (dayIndex) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayIndex]
  }

  const calculateTotal = () => {
    if (!tutor) return 0
    return tutor.hourly_rate * hours
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    setMessage({ type: '', text: '' })
    setDateError('')

    if (!selectedDate) {
      setDateError('Please select a date')
      return
    }

    if (!selectedSlot) {
      setMessage({ type: 'error', text: 'Please select a time slot' })
      return
    }

    setLoading(true)

    try {
      // Use UTC for database storage
      const sessionTime = new Date(Date.UTC(
        selectedSlot.time.getFullYear(),
        selectedSlot.time.getMonth(),
        selectedSlot.time.getDate(),
        selectedSlot.hour,
        0, 0
      ))
      
      const endTime = new Date(sessionTime)
      endTime.setUTCHours(endTime.getUTCHours() + hours)

      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            student_id: user.id,
            tutor_profile_id: tutorId,
            teaching_mode: teachingMode,
            hours,
            session_time: sessionTime.toISOString(),
            session_end_time: endTime.toISOString(),
            hourly_rate_at_booking: tutor.hourly_rate,
            total_amount: calculateTotal(),
            platform_fee: calculateTotal() * 0.1,
            tutor_payout_amount: calculateTotal() * 0.9,
            status: 'pending'
          }
        ])

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Booking request sent! The tutor will review and approve it soon.' 
      })

      setTimeout(() => {
        navigate('/my-sessions')
      }, 3000)

    } catch (error) {
      console.error('Error creating booking:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create booking request' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (e) => {
    const value = e.target.value
    console.log('📅 Date selected (raw):', value)
    setSelectedDate(value)
  }

  const days = getNextDays()

  if (!tutor) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Loading tutor information...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Book a Session</h1>
        <Link to={`/tutor/${tutorId}`} style={styles.backLink}>← Back to Profile</Link>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.bookingForm}>
          <div style={styles.tutorSummary}>
            <h2>Booking with {tutor.display_name ? tutor.profile?.full_name : 'Language Tutor'}</h2>
            <p style={styles.rate}>RM {tutor.hourly_rate}/hour</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.formSection}>
              <label style={styles.label}>Select Date</label>
              <select 
                value={selectedDate} 
                onChange={handleDateChange}
                style={{...styles.select, ...(dateError ? styles.inputError : {})}}
                required
              >
                <option value="">Choose a date</option>
                {days.map(day => (
                  <option key={day.dateString} value={day.dateString}>
                    {day.display}
                  </option>
                ))}
              </select>
              {dateError && <div style={styles.fieldError}>{dateError}</div>}
            </div>

            {selectedDate && (
              <div style={styles.formSection}>
                <label style={styles.label}>Select Time Slot</label>
                {availability.length === 0 ? (
                  <p style={styles.noSlots}>No available slots for this date</p>
                ) : (
                  <div style={styles.slotGrid}>
                    {availability.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          ...styles.slotButton,
                          ...(selectedSlot?.hour === slot.hour ? styles.slotButtonSelected : {})
                        }}
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <>
                <div style={styles.formSection}>
                  <label style={styles.label}>Duration (hours)</label>
                  <select 
                    value={hours} 
                    onChange={(e) => setHours(parseInt(e.target.value))}
                    style={styles.select}
                  >
                    {[1, 2, 3, 4].map(h => (
                      <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formSection}>
                  <label style={styles.label}>Teaching Mode</label>
                  <div style={styles.modeGroup}>
                    <label style={styles.modeLabel}>
                      <input
                        type="radio"
                        value="video"
                        checked={teachingMode === 'video'}
                        onChange={(e) => setTeachingMode(e.target.value)}
                      />
                      Video Call
                    </label>
                    <label style={styles.modeLabel}>
                      <input
                        type="radio"
                        value="voice"
                        checked={teachingMode === 'voice'}
                        onChange={(e) => setTeachingMode(e.target.value)}
                      />
                      Voice Call
                    </label>
                  </div>
                </div>
              </>
            )}

            {message.text && (
              <div style={message.type === 'error' ? styles.errorBox : styles.successBox}>
                {message.text}
              </div>
            )}

            {selectedSlot && (
              <button 
                type="submit" 
                style={loading ? styles.buttonDisabled : styles.button}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Booking Request'}
              </button>
            )}
          </form>
        </div>

        {selectedSlot && (
          <div style={styles.summaryCard}>
            <h3 style={styles.summaryTitle}>Booking Summary</h3>
            
            <div style={styles.summaryItem}>
              <span>Date:</span>
              <strong>{new Date(selectedDate).toLocaleDateString('en-MY')}</strong>
            </div>
            
            <div style={styles.summaryItem}>
              <span>Time:</span>
              <strong>{selectedSlot.display}</strong>
            </div>
            
            <div style={styles.summaryItem}>
              <span>Duration:</span>
              <strong>{hours} hour{hours > 1 ? 's' : ''}</strong>
            </div>
            
            <div style={styles.summaryItem}>
              <span>Mode:</span>
              <strong>{teachingMode === 'video' ? 'Video Call' : 'Voice Call'}</strong>
            </div>
            
            <div style={styles.divider}></div>
            
            <div style={styles.summaryItem}>
              <span>Rate:</span>
              <span>RM {tutor.hourly_rate}/hour</span>
            </div>
            
            <div style={styles.summaryItem}>
              <span>Subtotal:</span>
              <span>RM {calculateTotal()}</span>
            </div>
            
            <div style={styles.summaryItem}>
              <span>Platform Fee:</span>
              <span>RM {(calculateTotal() * 0.1).toFixed(2)}</span>
            </div>
            
            <div style={styles.divider}></div>
            
            <div style={styles.totalItem}>
              <span>Total:</span>
              <strong>RM {calculateTotal()}</strong>
            </div>
          </div>
        )}
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
  backLink: {
    color: '#4CAF50',
    textDecoration: 'none'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '20px'
  },
  bookingForm: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '30px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '40px',
    textAlign: 'center'
  },
  tutorSummary: {
    borderBottom: '1px solid #eee',
    paddingBottom: '20px',
    marginBottom: '20px'
  },
  rate: {
    fontSize: '20px',
    color: '#4CAF50',
    fontWeight: 'bold',
    margin: '10px 0 0 0'
  },
  formSection: {
    marginBottom: '25px'
  },
  label: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '10px'
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none'
  },
  inputError: {
    borderColor: '#f44336'
  },
  fieldError: {
    color: '#f44336',
    fontSize: '12px',
    marginTop: '5px'
  },
  noSlots: {
    color: '#999',
    fontStyle: 'italic',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px'
  },
  slotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '10px'
  },
  slotButton: {
    padding: '10px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  },
  slotButtonSelected: {
    backgroundColor: '#4CAF50',
    color: 'white',
    borderColor: '#4CAF50'
  },
  modeGroup: {
    display: 'flex',
    gap: '20px'
  },
  modeLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    height: 'fit-content'
  },
  summaryTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginTop: 0,
    marginBottom: '20px',
    borderBottom: '2px solid #4CAF50',
    paddingBottom: '10px'
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '14px'
  },
  divider: {
    height: '1px',
    backgroundColor: '#eee',
    margin: '15px 0'
  },
  totalItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px'
  },
  buttonDisabled: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#ccc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'not-allowed',
    marginTop: '20px'
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    marginTop: '15px'
  },
  successBox: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    marginTop: '15px'
  }
}