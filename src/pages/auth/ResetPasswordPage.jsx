import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export const ResetPasswordPage = () => {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await updatePassword(form.password)
      toast.success('Password updated successfully!')
      navigate('/auth/login')
    } catch (err) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md card p-8">
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-2">Reset Password</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Choose a new secure password.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} required minLength={6} className="input pr-11" placeholder="Min 6 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <input type="password" required className="input" placeholder="Repeat password"
              value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export const EmailVerifiedPage = () => (
  <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-8">
    <div className="text-center max-w-md card p-8">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-emerald-600" />
      </div>
      <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-3">Email Verified!</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Your account is now active. You can sign in and start participating in elections.</p>
      <Link to="/auth/login" className="btn-primary">Sign In Now</Link>
    </div>
  </div>
)

export default ResetPasswordPage
