import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Moon, Sun, Menu, X, ChevronDown, LogOut, LayoutDashboard, User } from 'lucide-react'
import toast from 'react-hot-toast'

const Navbar = () => {
  const { user, profile, signOut } = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      navigate('/')
    } catch {
      toast.error('Sign out failed')
    }
  }

  const getDashboardPath = () => {
    if (profile?.role === 'super_admin') return '/admin'
    if (profile?.role === 'election_creator') return '/creator'
    return '/voter'
  }

  return (
    <nav className="sticky top-0 z-40 glass border-b border-slate-200/60 dark:border-slate-700/60">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-glow">
              <span className="text-white font-display font-bold text-sm">V</span>
            </div>
            <span className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Vote<span className="gradient-text">Secure</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/" className="btn-ghost text-sm">Elections</Link>
            
            {/* Theme toggle */}
            <button onClick={toggle} className="btn-ghost p-2 rounded-lg">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {profile.full_name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 max-w-24 truncate">
                    {profile.full_name}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 card py-2 shadow-xl">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                      <p className="text-xs text-slate-400 uppercase tracking-wider">
                        {profile.role?.replace('_', ' ')}
                      </p>
                    </div>
                    <Link
                      to={getDashboardPath()}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-950 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                    >
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login" className="btn-secondary py-2 px-4 text-sm">Sign In</Link>
                <Link to="/auth/register" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden btn-ghost p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-700 py-4 space-y-1 animate-in">
            <Link to="/" className="block px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg" onClick={() => setMenuOpen(false)}>
              Elections
            </Link>
            <button onClick={toggle} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            {user && profile ? (
              <>
                <Link to={getDashboardPath()} className="block px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg">
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/auth/login" className="btn-secondary flex-1 py-2 text-sm text-center" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/auth/register" className="btn-primary flex-1 py-2 text-sm text-center" onClick={() => setMenuOpen(false)}>Register</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
