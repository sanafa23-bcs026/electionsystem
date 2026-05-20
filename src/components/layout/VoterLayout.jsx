import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { LayoutDashboard, Vote, ListChecks, LogOut, Moon, Sun, Menu, X, Star } from 'lucide-react'
import toast from 'react-hot-toast'

const VoterLayout = () => {
  const { profile, signOut } = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSignOut = async () => {
    try { await signOut(); navigate('/') } catch { toast.error('Sign out failed') }
  }

  const navItems = [
    { to: '/voter', label: 'My Dashboard', icon: <LayoutDashboard size={18} />, end: true },
    { to: '/voter/polls', label: 'Browse Elections', icon: <Vote size={18} /> },
    { to: '/voter/request-access', label: 'Become a Creator', icon: <Star size={18} /> },
  ]

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 md:w-16'} transition-all duration-300 flex-shrink-0 bg-white dark:bg-surface-900 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden`}>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow">
              <span className="text-white font-display font-bold text-sm">V</span>
            </div>
            {sidebarOpen && <span className="font-display font-bold text-slate-900 dark:text-white truncate">VoteSecure</span>}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}>
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
          <button onClick={toggle} className="sidebar-link w-full">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {sidebarOpen && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
            <LogOut size={18} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-surface-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn-ghost p-2 rounded-lg">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{profile?.full_name}</p>
              <p className="text-xs text-slate-400">Voter</p>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {profile?.full_name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default VoterLayout
