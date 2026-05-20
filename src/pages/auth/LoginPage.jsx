import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const { signIn, profile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await signIn(form)
      toast.success('Welcome back!')
      // Route based on role (profile may not be set immediately, redirect to role page)
      setTimeout(() => {
        const role = data?.user?.user_metadata?.role
        if (role === 'super_admin') navigate('/admin')
        else if (role === 'election_creator') navigate('/creator')
        else navigate('/voter')
      }, 100)
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex">
      {/* Left decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-surface-900 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full opacity-10 bg-white"
              style={{
                width: `${100 + i * 80}px`, height: `${100 + i * 80}px`,
                top: `${10 + i * 12}%`, left: `${5 + i * 8}%`,
                animation: `float ${4 + i}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>
        <div className="relative text-center text-white px-12">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-4">VoteSecure</h1>
          <p className="text-primary-200 text-lg leading-relaxed">
            The most trusted platform for secure, transparent, and democratic elections.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[['256-bit', 'Encryption'], ['100%', 'Anonymous'], ['Real-time', 'Results']].map(([num, label]) => (
              <div key={label}>
                <p className="text-2xl font-display font-bold text-white">{num}</p>
                <p className="text-primary-300 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="font-display font-bold text-lg">VoteSecure</span>
            </Link>
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Welcome back</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email" required
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="label mb-0">Password</label>
                <Link to="/auth/forgot-password" className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} required
                  className="input pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <div className="spinner w-5 h-5" /> Signing in...
                </span>
              ) : (
                <><LogIn size={18} /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 dark:text-slate-400 mt-6 text-sm">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
              Create account
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-950 rounded-xl border border-primary-100 dark:border-primary-900">
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-2">📌 Demo Note</p>
            <p className="text-xs text-primary-600 dark:text-primary-500">
              Create an account to get started. Admin accounts must be set via Supabase dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
