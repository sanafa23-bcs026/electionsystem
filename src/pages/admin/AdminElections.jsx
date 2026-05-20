import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { StatusBadge } from '../../components/ui/ElectionCard'
import { format } from 'date-fns'
import { Search, Download } from 'lucide-react'

export const AdminElections = () => {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('elections').select('*, profiles(full_name), voter_registrations(count)')
      .order('created_at', { ascending: false }).then(({ data }) => {
        setElections(data?.map(e => ({ ...e, voter_count: e.voter_registrations?.[0]?.count || 0 })) || [])
        setLoading(false)
      })
  }, [])

  const filtered = elections.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">All Elections</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{elections.length} elections on platform</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9 py-2.5 text-sm w-60" placeholder="Search elections..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['Title', 'Creator', 'Status', 'Voters', 'Start Date', 'End Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.map(e => (
                <tr key={e.id} className="hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-sm max-w-48 truncate">{e.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{e.profiles?.full_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{e.voter_count} / {e.max_voters}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{format(new Date(e.start_date), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{format(new Date(e.end_date), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false) })
  }, [])

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const roleBadge = (role) => {
    if (role === 'super_admin') return <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Super Admin</span>
    if (role === 'election_creator') return <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Creator</span>
    return <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">Voter</span>
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Users</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{users.length} registered users</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9 py-2.5 text-sm w-60" placeholder="Search users..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['User', 'Email', 'Phone', 'Role', 'Joined'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></td></tr>)
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {u.full_name?.[0]}
                      </div>
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{u.phone || '—'}</td>
                  <td className="px-4 py-3">{roleBadge(u.role)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('audit_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { setLogs(data || []); setLoading(false) })
  }, [])

  const downloadCSV = () => {
    const csv = ['Timestamp,User,Action,Entity Type,Details',
      ...logs.map(l => `"${l.created_at}","${l.profiles?.full_name || 'System'}","${l.action}","${l.entity_type || ''}","${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`)
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `audit-logs-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const actionColor = (action) => {
    if (action.includes('login') || action.includes('signup')) return 'bg-blue-500'
    if (action.includes('approve')) return 'bg-emerald-500'
    if (action.includes('reject')) return 'bg-red-500'
    if (action.includes('vote')) return 'bg-accent-500'
    return 'bg-primary-500'
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Audit Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Complete activity history — {logs.length} entries</p>
        </div>
        <button onClick={downloadCSV} className="btn-secondary py-2 px-4 text-sm">
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['Timestamp', 'User', 'Action', 'Entity', 'Details'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {loading ? (
                [...Array(8)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></td></tr>)
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                    {format(new Date(log.created_at), 'MMM d HH:mm:ss')}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {log.profiles?.full_name || 'System'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${actionColor(log.action)}`} />
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{log.entity_type || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono max-w-48 truncate">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminElections
