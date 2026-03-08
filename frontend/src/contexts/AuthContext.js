import React, { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password) => {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: 'https://didikly.com'
      }
    })
  }

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })
  }

  const signOut = async () => {
    return await supabase.auth.signOut()
  }

  const resendConfirmation = async (email) => {
    return await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: 'https://didikly.com'
      }
    })
  }

  const checkVerification = async () => {
    if (!user) return false
    
    // Refresh the user data to get latest email confirmation status
    const { data: { user: refreshedUser }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error checking verification:', error)
      return false
    }
    
    setUser(refreshedUser)
    return refreshedUser?.email_confirmed_at ? true : false
  }

  // NEW: Reset password function
  const resetPassword = async (email) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://didikly.com/reset-password'
    })
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resendConfirmation,
    checkVerification,
    resetPassword,        // Added here
    isTutor: profile?.is_tutor || false,
    isEmailVerified: user?.email_confirmed_at ? true : false
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}