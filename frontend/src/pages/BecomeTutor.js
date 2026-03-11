import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function BecomeTutor() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [languages, setLanguages] = useState([])
  const [newLanguage, setNewLanguage] = useState('')
  
  // Form fields
  const [bio, setBio] = useState('')
  const [hourlyRate, setHourlyRate] = useState('25')
  const [teachingModes, setTeachingModes] = useState({
    video: true,
    voice: false
  })
  const [experience, setExperience] = useState('0')
  const [qualifications, setQualifications] = useState('')
  
  // Privacy settings (default: hidden as per requirements)
  const [privacy, setPrivacy] = useState({
    displayName: false,
    displayUniversity: false,
    displayAge: true,
    displayGender: true,
    displayFirstLanguage: true
  })

  // Language options (common languages for UTeM students)
  const languageOptions = [
    'English', 'Malay', 'Mandarin', 'Tamil', 'Arabic', 
    'Japanese', 'Korean', 'French', 'German', 'Spanish'
  ]

  // Redirect if not logged in or already a tutor
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signup')
    }
    if (!authLoading && profile?.is_tutor) {
      navigate('/tutor-dashboard')
    }
  }, [user, profile, authLoading, navigate])

  const addLanguage = () => {
    if (newLanguage && !languages.includes(newLanguage)) {
      setLanguages([...languages, newLanguage])
      setNewLanguage('')
    }
  }

  const removeLanguage = (lang) => {
    setLanguages(languages.filter(l => l !== lang))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    // Validation
    if (languages.length === 0) {
      setMessage({ type: 'error', text: 'Select at least one language you teach' })
      return
    }

    if (!bio || bio.length < 50) {
      setMessage({ type: 'error', text: 'Bio must be at least 50 characters' })
      return
    }

    if (!hourlyRate || parseFloat(hourlyRate) < 5) {
      setMessage({ type: 'error', text: 'Hourly rate must be at least RM5' })
      return
    }

    if (!teachingModes.video && !teachingModes.voice) {
      setMessage({ type: 'error', text: 'Select at least one teaching mode' })
      return
    }

    setLoading(true)

    try {
      // Prepare teaching modes array
      const modes = []
      if (teachingModes.video) modes.push('video')
      if (teachingModes.voice) modes.push('voice')

      // Insert tutor profile
      const { data, error } = await supabase
        .from('tutor_profiles')
        .insert([
          {
            profile_id: user.id,
            bio,
            languages_taught: languages,
            teaching_modes: modes,
            hourly_rate: parseFloat(hourlyRate),
            teaching_experience_years: parseInt(experience),
            qualifications: qualifications.split('\n').filter(q => q.trim()),
            display_name: privacy.displayName,
            display_university: privacy.displayUniversity,
            display_age: privacy.displayAge,
            display_gender: privacy.displayGender,
            display_first_language: privacy.displayFirstLanguage
          }
        ])
        .select()

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Tutor profile created successfully! Redirecting to your dashboard...' 
      })

      // Redirect to tutor dashboard after 2 seconds
      setTimeout(() => {
        navigate('/tutor-dashboard')
      }, 2000)

    } catch (error) {
      console.error('Error creating tutor profile:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to create tutor profile' 
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Become a Tutor</h1>
        <p style={styles.subtitle}>Share your language skills with UTeM students</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Languages */}
          <div style={styles.section}>
            <label style={styles.label}>Languages You Teach *</label>
            <div style={styles.languageInput}>
              <select 
                value={newLanguage} 
                onChange={(e) => setNewLanguage(e.target.value)}
                style={styles.select}
              >
                <option value="">Select a language</option>
                {languageOptions.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={addLanguage}
                style={styles.addButton}
              >
                Add
              </button>
            </div>
            <div style={styles.languageTags}>
              {languages.map(lang => (
                <span key={lang} style={styles.tag}>
                  {lang} <button 
                    type="button" 
                    onClick={() => removeLanguage(lang)}
                    style={styles.removeTag}
                  >×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div style={styles.section}>
            <label style={styles.label}>Bio *</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell students about yourself, your teaching style, and experience..."
              style={styles.textarea}
              rows="5"
              required
            />
            <small style={styles.hint}>
              {bio.length}/500 characters minimum (at least 50)
            </small>
          </div>

          {/* Hourly Rate */}
          <div style={styles.section}>
            <label style={styles.label}>Hourly Rate (RM) *</label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="25"
              style={styles.input}
              min="5"
              step="5"
              required
            />
          </div>

          {/* Teaching Modes */}
          <div style={styles.section}>
            <label style={styles.label}>Teaching Modes *</label>
            <div style={styles.checkboxGroup}>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={teachingModes.video}
                  onChange={(e) => setTeachingModes({...teachingModes, video: e.target.checked})}
                />
                Video Call (face visible)
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={teachingModes.voice}
                  onChange={(e) => setTeachingModes({...teachingModes, voice: e.target.checked})}
                />
                Voice Call (audio only)
              </label>
            </div>
          </div>

          {/* Experience */}
          <div style={styles.section}>
            <label style={styles.label}>Teaching Experience (years)</label>
            <select 
              value={experience} 
              onChange={(e) => setExperience(e.target.value)}
              style={styles.select}
            >
              <option value="0">Less than 1 year</option>
              <option value="1">1 year</option>
              <option value="2">2 years</option>
              <option value="3">3 years</option>
              <option value="4">4 years</option>
              <option value="5">5+ years</option>
            </select>
          </div>

          {/* Qualifications */}
          <div style={styles.section}>
            <label style={styles.label}>Qualifications (one per line)</label>
            <textarea
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder="TESOL Certificate&#10;Bachelor's in Education&#10;10 years tutoring experience"
              style={styles.textarea}
              rows="3"
            />
          </div>

          {/* Privacy Settings - CRITICAL: matches your requirement */}
          <div style={styles.section}>
            <label style={styles.label}>Privacy Settings</label>
            <p style={styles.privacyNote}>
              By default, your name and university details are hidden. Students will only see age, gender, and first language unless you choose to show more.
            </p>
            <div style={styles.checkboxGroup}>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={privacy.displayName}
                  onChange={(e) => setPrivacy({...privacy, displayName: e.target.checked})}
                />
                Show my name to students
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={privacy.displayUniversity}
                  onChange={(e) => setPrivacy({...privacy, displayUniversity: e.target.checked})}
                />
                Show my university details
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={privacy.displayAge}
                  onChange={(e) => setPrivacy({...privacy, displayAge: e.target.checked})}
                  disabled
                />
                Show my age (required)
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={privacy.displayGender}
                  onChange={(e) => setPrivacy({...privacy, displayGender: e.target.checked})}
                  disabled
                />
                Show my gender (required)
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={privacy.displayFirstLanguage}
                  onChange={(e) => setPrivacy({...privacy, displayFirstLanguage: e.target.checked})}
                  disabled
                />
                Show my first language (required)
              </label>
            </div>
            <small style={styles.hint}>
              Age, gender, and first language are always shown to students as per platform requirements.
            </small>
          </div>

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
              {loading ? 'Creating Profile...' : 'Become a Tutor'}
            </button>
            <Link to="/dashboard" style={styles.cancelLink}>
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
    maxWidth: '600px'
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
    gap: '25px'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none'
  },
  textarea: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  select: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
    backgroundColor: 'white'
  },
  hint: {
    fontSize: '12px',
    color: '#666'
  },
  languageInput: {
    display: 'flex',
    gap: '10px'
  },
  addButton: {
    padding: '12px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  languageTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px'
  },
  tag: {
    backgroundColor: '#e3f2fd',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  removeTag: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0 4px'
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  privacyNote: {
    fontSize: '13px',
    color: '#666',
    backgroundColor: '#f9f9f9',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  button: {
    flex: 2,
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '500',
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
    fontWeight: '500',
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
    fontWeight: '500',
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
    fontSize: '14px'
  },
  successBox: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px'
  }
}