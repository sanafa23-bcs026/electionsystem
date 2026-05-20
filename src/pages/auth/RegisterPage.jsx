import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const RegisterPage = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await signUp({ email: form.email, password: form.password, fullName: form.fullName, phone: form.phone })
      setSuccess(true)
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-3">Check your email!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          We sent a verification link to <strong>{form.email}</strong>. Click the link to activate your account.
        </p>
        <Link to="/auth/login" className="btn-primary">Go to Login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow">
              <span className="text-white font-display font-bold">V</span>
            </div>
          </Link>
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Create account</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Join thousands of voters on VoteSecure</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" required className="input" placeholder="John Doe"
                value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input type="email" required className="input" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <div>
              <label className="label">Phone Number <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="tel" className="input" placeholder="+1 (555) 000-0000"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required className="input pr-11" placeholder="Min 6 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input type="password" required className="input" placeholder="Repeat password"
                value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
            </div>

            <div className="flex items-start gap-3 py-2">
              <input type="checkbox" required id="terms" className="mt-0.5 accent-primary-600 w-4 h-4" />
              <label htmlFor="terms" className="text-sm text-slate-500 dark:text-slate-400 cursor-pointer">
                I agree to the <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</a> and <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <div className="spinner w-5 h-5" /> Creating account...
                </span>
              ) : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 dark:text-slate-400 mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
