import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function SetAvailability() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [tutorProfile, setTutorProfile] = useState(null)
  const [availability, setAvailability] = useState([])
  
  // Days of week
  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ]

  useEffect(() => {
    if (!user) {
      navigate('/signup')
      return
    }

    if (profile && !profile.is_tutor) {
      navigate('/dashboard')
      return
    }

    fetchTutorProfile()
  }, [user, profile])

  const fetchTutorProfile = async () => {
    try {
      // Get tutor profile
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (tutorError) throw tutorError
      setTutorProfile(tutorData)

      // Fetch existing availability
      const { data: availData, error: availError } = await supabase
        .from('availability')
        .select('*')
        .eq('tutor_profile_id', tutorData.id)
        .eq('is_recurring', true)

      if (availError) throw availError

      // Format existing availability
      if (availData && availData.length > 0) {
        const formatted = availData.map(slot => ({
          day: slot.day_of_week,
          start: slot.start_time.slice(0, 5), // HH:MM format
          end: slot.end_time.slice(0, 5),
          id: slot.id
        }))
        setAvailability(formatted)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const addTimeSlot = (day) => {
    setAvailability([
      ...availability,
      {
        day,
        start: '09:00',
        end: '17:00',
        id: Date.now() + Math.random() // temporary ID
      }
    ])
  }

  const updateTimeSlot = (index, field, value) => {
    const updated = [...availability]
    updated[index][field] = value
    setAvailability(updated)
  }

  const removeTimeSlot = (index) => {
    setAvailability(availability.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (availability.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one availability slot' })
      return
    }

    // Validate all slots
    for (const slot of availability) {
      if (slot.start >= slot.end) {
        setMessage({ 
          type: 'error', 
          text: `End time must be after start time for ${daysOfWeek[slot.day]}` 
        })
        return
      }
    }

    setLoading(true)

    try {
      // Delete all existing recurring availability
      await supabase
        .from('availability')
        .delete()
        .eq('tutor_profile_id', tutorProfile.id)
        .eq('is_recurring', true)

      // Insert new slots
      const slotsToInsert = availability.map(slot => ({
        tutor_profile_id: tutorProfile.id,
        day_of_week: slot.day,
        start_time: slot.start + ':00',
        end_time: slot.end + ':00',
        is_recurring: true
      }))

      const { error } = await supabase
        .from('availability')
        .insert(slotsToInsert)

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Availability saved successfully!' 
      })

    } catch (error) {
      console.error('Error saving availability:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to save availability' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Set Your Availability</h1>
        <Link to="/tutor-dashboard" style={styles.backLink}>← Back to Dashboard</Link>
      </div>

      <div style={styles.card}>
        <p style={styles.instructions}>
          Set your weekly recurring availability. Students can book sessions during these times.
          You can always come back to update this later.
        </p>

        <form onSubmit={handleSubmit}>
          {daysOfWeek.map((day, dayIndex) => {
            const daySlots = availability.filter(s => s.day === dayIndex)
            
            return (
              <div key={day} style={styles.daySection}>
                <div style={styles.dayHeader}>
                  <h3 style={styles.dayTitle}>{day}</h3>
                  <button
                    type="button"
                    onClick={() => addTimeSlot(dayIndex)}
                    style={styles.addButton}
                  >
                    + Add Time Slot
                  </button>
                </div>

                {daySlots.length === 0 ? (
                  <p style={styles.noSlots}>No availability set</p>
                ) : (
                  daySlots.map((slot, slotIndex) => {
                    const globalIndex = availability.findIndex(s => s.id === slot.id)
                    
                    return (
                      <div key={slot.id} style={styles.timeSlot}>
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => updateTimeSlot(globalIndex, 'start', e.target.value)}
                          style={styles.timeInput}
                        />
                        <span style={styles.timeSeparator}>to</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => updateTimeSlot(globalIndex, 'end', e.target.value)}
                          style={styles.timeInput}
                        />
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(globalIndex)}
                          style={styles.removeButton}
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })}

          {message.text && (
            <div style={message.type === 'error' ? styles.errorBox : styles.successBox}>
              {message.text}
            </div>
          )}

          <div style={styles.buttonGroup}>
            <button 
              type="submit" 
              style={loading ? styles.buttonDisabled : styles.button}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Availability'}
            </button>
            <Link to="/tutor-dashboard" style={styles.cancelLink}>
              <button type="button" style={styles.buttonSecondary}>
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '28px',
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
    padding: '30px'
  },
  instructions: {
    backgroundColor: '#e3f2fd',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '30px',
    color: '#0d47a1'
  },
  daySection: {
    marginBottom: '30px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px'
  },
  dayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  dayTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    margin: 0
  },
  addButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  noSlots: {
    color: '#999',
    fontStyle: 'italic',
    margin: '10px 0'
  },
  timeSlot: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  timeInput: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '100px'
  },
  timeSeparator: {
    color: '#666'
  },
  removeButton: {
    backgroundColor: '#f44336',
    color: 'white',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  button: {
    flex: 2,
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '14px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#9e9e9e',
    color: 'white',
    padding: '14px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonDisabled: {
    flex: 2,
    backgroundColor: '#ccc',
    color: 'white',
    padding: '14px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed'
  },
  cancelLink: {
    flex: 1,
    textDecoration: 'none'
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '15px'
  },
  successBox: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '15px'
  }
}