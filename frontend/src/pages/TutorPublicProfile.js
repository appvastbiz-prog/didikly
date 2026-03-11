import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'

export default function TutorPublicProfile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [tutor, setTutor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    fetchTutorProfile()
  }, [id])

  const fetchTutorProfile = async () => {
    try {
      // Fetch tutor profile with related profile data
      const { data: tutorData, error: tutorError } = await supabase
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
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (tutorError) throw tutorError
      setTutor(tutorData)

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          student:student_id (
            id,
            email
          )
        `)
        .eq('tutor_profile_id', id)
        .order('created_at', { ascending: false })

      if (reviewsError) throw reviewsError
      setReviews(reviewsData || [])

    } catch (error) {
      console.error('Error fetching tutor:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookSession = () => {
    if (!user) {
      navigate('/signup')
    } else {
      navigate(`/book/${id}`)
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading tutor profile...</div>
      </div>
    )
  }

  if (!tutor) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2>Tutor Not Found</h2>
          <p>The tutor you're looking for doesn't exist or is no longer active.</p>
          <Link to="/search" style={styles.backLink}>← Back to Search</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Link to="/search" style={styles.backLink}>← Back to Search</Link>
      </div>

      <div style={styles.profileCard}>
        {/* Left Column - Basic Info */}
        <div style={styles.leftColumn}>
          {/* Avatar */}
          <div style={styles.avatarContainer}>
            {tutor.profile?.avatar_url ? (
              <img 
                src={tutor.profile.avatar_url} 
                alt="tutor"
                style={styles.avatarLarge}
              />
            ) : (
              <div style={styles.avatarPlaceholderLarge}>
                {tutor.profile?.first_language?.[0] || 'T'}
              </div>
            )}
          </div>

          {/* Name (hidden by default) */}
          <h2 style={styles.tutorName}>
            {tutor.display_name ? tutor.profile?.full_name : 'Language Tutor'}
          </h2>

          {/* Public Info (always shown) */}
          <div style={styles.publicInfoCard}>
            <h3 style={styles.sectionTitle}>About</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Age</span>
                <span style={styles.infoValue}>{tutor.profile?.age || 'Not specified'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Gender</span>
                <span style={styles.infoValue}>{tutor.profile?.gender || 'Not specified'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>First Language</span>
                <span style={styles.infoValue}>{tutor.profile?.first_language || 'Not specified'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Institution</span>
                <span style={styles.infoValue}>
                  {tutor.display_university ? tutor.profile?.institution : 'UTeM Student'}
                </span>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Languages Taught</h3>
            <div style={styles.languageTags}>
              {tutor.languages_taught?.map(lang => (
                <span key={lang} style={styles.languageTag}>{lang}</span>
              ))}
            </div>
          </div>

          {/* Teaching Modes */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Teaching Modes</h3>
            <div style={styles.modesList}>
              {tutor.teaching_modes?.map(mode => (
                <div key={mode} style={styles.modeItem}>
                  {mode === 'video' ? '📹 Video Call (Face visible)' : '🎧 Voice Call (Audio only)'}
                </div>
              ))}
            </div>
          </div>

          {/* Experience & Qualifications */}
          {tutor.teaching_experience_years > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Experience</h3>
              <p>{tutor.teaching_experience_years} years teaching experience</p>
            </div>
          )}

          {tutor.qualifications?.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Qualifications</h3>
              <ul style={styles.qualificationsList}>
                {tutor.qualifications.map((qual, index) => (
                  <li key={index}>{qual}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column - Booking & Reviews */}
        <div style={styles.rightColumn}>
          {/* Price Card */}
          <div style={styles.priceCard}>
            <div style={styles.priceHeader}>
              <span style={styles.priceValue}>RM {tutor.hourly_rate}</span>
              <span style={styles.priceUnit}>/hour</span>
            </div>
            
            <div style={styles.ratingDisplay}>
              <div style={styles.stars}>
                {'⭐'.repeat(Math.floor(tutor.average_rating || 0))}
                {tutor.average_rating % 1 >= 0.5 && '⭐'}
              </div>
              <span style={styles.reviewCount}>
                {tutor.total_reviews || 0} reviews
              </span>
            </div>

            <button onClick={handleBookSession} style={styles.bookButton}>
              Book a Session
            </button>
          </div>

          {/* Bio */}
          <div style={styles.bioCard}>
            <h3 style={styles.sectionTitle}>About Me</h3>
            <p style={styles.bio}>{tutor.bio}</p>
          </div>

          {/* Reviews */}
          <div style={styles.reviewsCard}>
            <h3 style={styles.sectionTitle}>Reviews</h3>
            {reviews.length === 0 ? (
              <p style={styles.noReviews}>No reviews yet</p>
            ) : (
              <div style={styles.reviewsList}>
                {reviews.map(review => (
                  <div key={review.id} style={styles.reviewItem}>
                    <div style={styles.reviewHeader}>
                      <span style={styles.reviewRating}>
                        {'⭐'.repeat(review.rating)}
                      </span>
                      <span style={styles.reviewDate}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={styles.reviewComment}>{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
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
    marginBottom: '20px'
  },
  backLink: {
    color: '#4CAF50',
    textDecoration: 'none',
    fontSize: '16px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  errorCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '40px',
    textAlign: 'center'
  },
  profileCard: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '20px'
  },
  leftColumn: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px'
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  avatarContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  avatarLarge: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  avatarPlaceholderLarge: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    backgroundColor: '#4CAF50',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    fontWeight: 'bold'
  },
  tutorName: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px'
  },
  publicInfoCard: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginTop: 0,
    marginBottom: '15px'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#666'
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  section: {
    marginBottom: '20px'
  },
  languageTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  languageTag: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px'
  },
  modesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  modeItem: {
    fontSize: '14px',
    color: '#333'
  },
  qualificationsList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '14px'
  },
  priceCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px'
  },
  priceHeader: {
    textAlign: 'center',
    marginBottom: '10px'
  },
  priceValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  priceUnit: {
    fontSize: '16px',
    color: '#666'
  },
  ratingDisplay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px'
  },
  stars: {
    color: '#ffc107'
  },
  reviewCount: {
    color: '#666',
    fontSize: '14px'
  },
  bookButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  bioCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px'
  },
  bio: {
    lineHeight: '1.6',
    color: '#333',
    margin: 0
  },
  reviewsCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    padding: '20px'
  },
  noReviews: {
    textAlign: 'center',
    color: '#999',
    padding: '20px'
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  reviewItem: {
    borderBottom: '1px solid #eee',
    paddingBottom: '15px'
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  reviewRating: {
    color: '#ffc107'
  },
  reviewDate: {
    fontSize: '12px',
    color: '#999'
  },
  reviewComment: {
    margin: 0,
    fontSize: '14px',
    color: '#333'
  }
}