import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function SearchTutors() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [tutors, setTutors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    language: '',
    minRating: 0,
    maxPrice: 100,
    teachingMode: 'any'
  })
  
  const [languages, setLanguages] = useState([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 })

  useEffect(() => {
    fetchTutors()
    fetchLanguages()
  }, [])

  useEffect(() => {
    fetchTutors()
  }, [filters])

  const fetchLanguages = async () => {
    try {
      // Get unique languages from tutor profiles
      const { data, error } = await supabase
        .from('tutor_profiles')
        .select('languages_taught')

      if (error) throw error

      // Flatten and get unique languages
      const allLanguages = [...new Set(data.flatMap(t => t.languages_taught))]
      setLanguages(allLanguages.sort())
    } catch (error) {
      console.error('Error fetching languages:', error)
    }
  }

  const fetchTutors = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('tutor_profiles')
        .select(`
          *,
          profile:profile_id (
            id,
            email,
            gender,
            age,
            first_language,
            institution,
            avatar_url
          )
        `)
        .eq('is_active', true)

      // Apply filters
      if (filters.language) {
        query = query.contains('languages_taught', [filters.language])
      }

      if (filters.minRating > 0) {
        query = query.gte('average_rating', filters.minRating)
      }

      if (filters.maxPrice < 100) {
        query = query.lte('hourly_rate', filters.maxPrice)
      }

      if (filters.teachingMode !== 'any') {
        query = query.contains('teaching_modes', [filters.teachingMode])
      }

      const { data, error } = await query

      if (error) throw error
      setTutors(data || [])

      // Update price range based on actual data
      if (data && data.length > 0) {
        const prices = data.map(t => t.hourly_rate)
        setPriceRange({
          min: Math.min(...prices),
          max: Math.max(...prices)
        })
      }

    } catch (error) {
      console.error('Error fetching tutors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      language: '',
      minRating: 0,
      maxPrice: 100,
      teachingMode: 'any'
    })
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Find a Tutor</h1>
        <Link to="/dashboard" style={styles.backLink}>← Back to Dashboard</Link>
      </div>

      <div style={styles.main}>
        {/* Filters Sidebar */}
        <div style={styles.filters}>
          <h3 style={styles.filterTitle}>Filters</h3>
          
          {/* Language Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Language</label>
            <select 
              value={filters.language} 
              onChange={(e) => handleFilterChange('language', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Teaching Mode Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Teaching Mode</label>
            <select 
              value={filters.teachingMode} 
              onChange={(e) => handleFilterChange('teachingMode', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="any">Any Mode</option>
              <option value="video">Video Call</option>
              <option value="voice">Voice Call</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Minimum Rating: {filters.minRating} ⭐</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={filters.minRating}
              onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
              style={styles.rangeInput}
            />
            <div style={styles.rangeLabels}>
              <span>Any</span>
              <span>⭐ 5</span>
            </div>
          </div>

          {/* Price Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Max Price: RM {filters.maxPrice}</label>
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              step="5"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', parseInt(e.target.value))}
              style={styles.rangeInput}
            />
            <div style={styles.rangeLabels}>
              <span>RM {priceRange.min}</span>
              <span>RM {priceRange.max}</span>
            </div>
          </div>

          <button onClick={clearFilters} style={styles.clearButton}>
            Clear Filters
          </button>
        </div>

        {/* Results */}
        <div style={styles.results}>
          <div style={styles.resultsHeader}>
            <span>{tutors.length} tutors found</span>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading tutors...</div>
          ) : tutors.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No tutors match your filters.</p>
              <button onClick={clearFilters} style={styles.emptyButton}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={styles.tutorGrid}>
              {tutors.map(tutor => (
                <Link 
                  to={`/tutor/${tutor.id}`} 
                  key={tutor.id} 
                  style={styles.tutorCardLink}
                >
                  <div style={styles.tutorCard}>
                    {/* Avatar/Initial */}
                    <div style={styles.tutorAvatar}>
                      {tutor.profile?.avatar_url ? (
                        <img 
                          src={tutor.profile.avatar_url} 
                          alt="tutor"
                          style={styles.avatarImage}
                        />
                      ) : (
                        <div style={styles.avatarPlaceholder}>
                          {tutor.profile?.first_language?.[0] || 'T'}
                        </div>
                      )}
                    </div>

                    {/* Tutor Info */}
                    <div style={styles.tutorInfo}>
                      <h3 style={styles.tutorName}>
                        {tutor.display_name ? tutor.profile?.full_name : 'Language Tutor'}
                      </h3>
                      
                      <div style={styles.tutorDetails}>
                        {/* Rating */}
                        <div style={styles.rating}>
                          {'⭐'.repeat(Math.floor(tutor.average_rating || 0))}
                          <span style={styles.ratingValue}>
                            ({tutor.total_reviews || 0})
                          </span>
                        </div>

                        {/* Languages */}
                        <div style={styles.languages}>
                          {tutor.languages_taught?.join(' • ')}
                        </div>

                        {/* Student-visible info (per requirements) */}
                        <div style={styles.publicInfo}>
                          <span>🎂 {tutor.profile?.age || '?'} yrs</span>
                          <span>⚥ {tutor.profile?.gender || 'Not specified'}</span>
                          <span>🗣️ {tutor.profile?.first_language || '?'}</span>
                          <span>🏫 {tutor.display_university ? tutor.profile?.institution : 'UTeM'}</span>
                        </div>

                        {/* Teaching Modes */}
                        <div style={styles.modes}>
                          {tutor.teaching_modes?.map(mode => (
                            <span key={mode} style={mode === 'video' ? styles.videoBadge : styles.voiceBadge}>
                              {mode === 'video' ? '📹 Video' : '🎧 Voice'}
                            </span>
                          ))}
                        </div>

                        {/* Price */}
                        <div style={styles.price}>
                          <span style={styles.priceValue}>RM {tutor.hourly_rate}</span>
                          <span style={styles.priceUnit}>/hour</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
  backLink: {
    color: '#4CAF50',
    textDecoration: 'none',
    fontSize: '16px'
  },
  main: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '20px'
  },
  filters: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px',
    height: 'fit-content'
  },
  filterTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginTop: 0,
    marginBottom: '20px',
    borderBottom: '2px solid #4CAF50',
    paddingBottom: '10px'
  },
  filterGroup: {
    marginBottom: '20px'
  },
  filterLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '8px'
  },
  filterSelect: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none'
  },
  rangeInput: {
    width: '100%',
    margin: '10px 0'
  },
  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666'
  },
  clearButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  results: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px'
  },
  resultsHeader: {
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee',
    color: '#666'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  emptyButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  tutorGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '15px'
  },
  tutorCardLink: {
    textDecoration: 'none',
    color: 'inherit'
  },
  tutorCard: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    border: '1px solid #eee',
    borderRadius: '8px',
    transition: 'box-shadow 0.2s',
    cursor: 'pointer',
    ':hover': {
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }
  },
  tutorAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4CAF50',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold'
  },
  tutorInfo: {
    flex: 1
  },
  tutorName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    margin: '0 0 10px 0'
  },
  tutorDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  rating: {
    color: '#ffc107'
  },
  ratingValue: {
    color: '#666',
    fontSize: '14px',
    marginLeft: '5px'
  },
  languages: {
    fontSize: '14px',
    color: '#4CAF50',
    fontWeight: '500'
  },
  publicInfo: {
    display: 'flex',
    gap: '15px',
    fontSize: '13px',
    color: '#666',
    flexWrap: 'wrap'
  },
  modes: {
    display: 'flex',
    gap: '10px'
  },
  videoBadge: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  voiceBadge: {
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  price: {
    marginTop: '5px'
  },
  priceValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  priceUnit: {
    fontSize: '14px',
    color: '#666',
    marginLeft: '5px'
  }
}