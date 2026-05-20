import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Users, Vote, ClipboardList, TrendingUp, Clock, CheckCircle, AlertCircle, Activity } from 'lucide-react'

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, elections: 0, active: 0, pending: 0, votes: 0 })
  const [recentLogs, setRecentLogs] = useState([])
  const [recentElections, setRecentElections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [
      { count: users },
      { count: elections },
      { count: active },
      { count: pending },
      { count: votes },
      { data: logs },
      { data: elecs }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('elections').select('*', { count: 'exact', head: true }),
      supabase.from('elections').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('creator_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase.from('audit_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(8),
      supabase.from('elections').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(5)
    ])
    setStats({ users: users || 0, elections: elections || 0, active: active || 0, pending: pending || 0, votes: votes || 0 })
    setRecentLogs(logs || [])
    setRecentElections(elecs || [])
    setLoading(false)
  }

  const statCards = [
    { icon: <Users size={22} />, label: 'Total Users', value: stats.users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400', link: '/admin/users' },
    { icon: <Vote size={22} />, label: 'Total Elections', value: stats.elections, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400', link: '/admin/elections' },
    { icon: <Activity size={22} />, label: 'Active Elections', value: stats.active, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', link: '/admin/elections' },
    { icon: <AlertCircle size={22} />, label: 'Pending Requests', value: stats.pending, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400', link: '/admin/requests' },
    { icon: <TrendingUp size={22} />, label: 'Total Votes Cast', value: stats.votes, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400', link: '/admin/elections' },
  ]

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of the entire platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map(({ icon, label, value, color, link }) => (
          <Link key={label} to={link} className="stat-card hover:shadow-glow transition-all group">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>{icon}</div>
            <div>
              <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{loading ? '—' : value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Elections */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-slate-900 dark:text-white">Recent Elections</h2>
            <Link to="/admin/elections" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentElections.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No elections yet</p>}
            {recentElections.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {e.title[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{e.title}</p>
                  <p className="text-xs text-slate-400">by {e.profiles?.full_name}</p>
                </div>
                <span className={`badge ${
                  e.status === 'active' ? 'badge-active' :
                  e.status === 'published' ? 'badge-upcoming' :
                  e.status === 'completed' ? 'badge-completed' : 'badge-draft'
                }`}>
                  {e.status === 'published' ? 'upcoming' : e.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-slate-900 dark:text-white">Recent Activity</h2>
            <Link to="/admin/audit-logs" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentLogs.length === 0 && <p className="text-sm text-slate-400 py-4 text-center">No activity yet</p>}
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">{log.profiles?.full_name || 'System'}</span>
                    {' '}{log.action}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
