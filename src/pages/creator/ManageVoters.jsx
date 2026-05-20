import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, Lock, Unlock, Download, Users, CheckCircle, Clock, Search } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const ManageVoters = () => {
  const { id: electionId } = useParams()
  const { profile, logAction } = useAuth()
  const navigate = useNavigate()
  const [election, setElection] = useState(null)
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => { fetchData() }, [electionId])

  const fetchData = async () => {
    const [{ data: el }, { data: vrs }] = await Promise.all([
      supabase.from('elections').select('*').eq('id', electionId).single(),
      supabase.from('voter_registrations')
        .select('*, profiles(full_name, email, phone)')
        .eq('election_id', electionId)
        .order('registered_at', { ascending: false })
    ])
    setElection(el)
    setVoters(vrs || [])
    setLoading(false)
  }

  const toggleLock = async () => {
    if (!window.confirm(election.is_voter_list_locked
      ? 'Unlock voter list? New registrations will be allowed (admin override).'
      : 'Lock voter list? No new voters can join after this.'
    )) return

    setProcessing(true)
    try {
      const newVal = !election.is_voter_list_locked
      await supabase.from('elections').update({ is_voter_list_locked: newVal }).eq('id', electionId)
      await logAction(
        newVal ? 'admin_lock_voter_list' : 'admin_unlock_voter_list',
        'election', electionId,
        { admin_override: true }
      )
      toast.success(newVal ? 'Voter list locked!' : 'Voter list unlocked (admin override logged)')
      fetchData()
    } finally {
      setProcessing(false)
    }
  }

  const exportCSV = () => {
    const csv = [
      'Secret ID,Full Name,Email,Status,Voted,Registered At',
      ...voters.map(v => `"${v.secret_voter_id}","${v.profiles?.full_name}","${v.profiles?.email}","${v.status}","${v.has_voted}","${v.registered_at}"`)
    ].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `voters-${electionId.slice(0,8)}.csv`
    a.click()
  }

  const filtered = voters.filter(v =>
    v.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
    v.secret_voter_id.includes(search.toUpperCase())
  )

  const voted = voters.filter(v => v.has_voted).length
  const turnout = voters.length > 0 ? Math.round(voted / voters.length * 100) : 0

  if (loading) return <div className="flex justify-center py-20"><div className="spinner w-10 h-10" /></div>

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/creator')} className="btn-ghost p-2 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Voter Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm truncate">{election?.title}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Registered', value: voters.length, icon: <Users size={18} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Max Voters', value: election?.max_voters, icon: <Users size={18} />, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800' },
          { label: 'Voted', value: voted, icon: <CheckCircle size={18} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Turnout', value: `${turnout}%`, icon: <Clock size={18} />, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>{icon}</div>
            <div>
              <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9 py-2.5 text-sm" placeholder="Search voters..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary py-2 px-4 text-sm">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={toggleLock} disabled={processing} className={election?.is_voter_list_locked ? 'btn-secondary py-2 px-4 text-sm' : 'btn-danger py-2 px-4 text-sm'}>
            {election?.is_voter_list_locked ? <><Unlock size={15} /> Unlock List</> : <><Lock size={15} /> Lock List</>}
          </button>
        </div>
      </div>

      {election?.is_voter_list_locked && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-400">
          <Lock size={14} /> Voter list is locked — no new registrations allowed
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['Voter', 'Email', 'Secret ID', 'Status', 'Voted', 'Registered'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No voters found</td></tr>
              ) : filtered.map(v => (
                <tr key={v.id} className="hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {v.profiles?.full_name?.[0]}
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{v.profiles?.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{v.profiles?.email}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                      {v.secret_voter_id.slice(0, -4).replace(/./g, '*') + v.secret_voter_id.slice(-4)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${v.status === 'voted' ? 'badge-approved' : v.status === 'disqualified' ? 'badge-rejected' : 'badge-upcoming'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {v.has_voted
                      ? <span className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1"><CheckCircle size={13} /> Yes</span>
                      : <span className="text-slate-400 text-sm">No</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {format(new Date(v.registered_at), 'MMM d, HH:mm')}
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

export default ManageVoters
