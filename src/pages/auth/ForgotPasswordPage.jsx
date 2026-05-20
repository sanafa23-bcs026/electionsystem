import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export const ForgotPasswordPage = () => {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-8">
          <ArrowLeft size={16} /> Back to login
        </Link>

        {sent ? (
          <div className="text-center card p-8">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-2">Email sent!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Check <strong>{email}</strong> for a password reset link.</p>
            <Link to="/auth/login" className="btn-primary">Back to Login</Link>
          </div>
        ) : (
          <div className="card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Forgot password?</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Enter your email and we'll send a reset link.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required className="input pl-10" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
