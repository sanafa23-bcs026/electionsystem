import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Force loading false after 5 seconds no matter what
    const timeout = setTimeout(() => setLoading(false), 5000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (data) {
        setProfile(data)
      } else {
        // Profile nahi mila — manually create karo
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          const newProfile = {
            id: userData.user.id,
            full_name: userData.user.user_metadata?.full_name || userData.user.email.split('@')[0],
            email: userData.user.email,
            role: 'voter'
          }
          const { data: created } = await supabase.from('profiles').insert(newProfile).select().single()
          if (created) setProfile(created)
        }
      }
    } catch (e) {
      console.error('fetchProfile error:', e)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async ({ email, password, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: 'voter' },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    if (data.user && phone) {
      await supabase.from('profiles').update({ phone }).eq('id', data.user.id)
    }
    await logAction('signup', 'user', data.user?.id, { email })
    return data
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await fetchProfile(data.user.id)
    await logAction('login', 'user', data.user.id, { email })
    return data
  }

  const signOut = async () => {
    await logAction('logout', 'user', user?.id, {})
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const updateProfile = async (updates) => {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    if (error) throw error
    await fetchProfile(user.id)
  }

  const logAction = async (action, entityType, entityId, details) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: user?.id || null,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details
      })
    } catch (e) {}
  }

  const isAdmin = () => profile?.role === 'super_admin'
  const isCreator = () => profile?.role === 'election_creator'
  const isVoter = () => profile?.role === 'voter'

  const value = {
    user, profile, loading,
    signUp, signIn, signOut,
    resetPassword, updatePassword, updateProfile,
    fetchProfile, logAction,
    isAdmin, isCreator, isVoter,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}