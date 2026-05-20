import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge } from '../../components/ui/ElectionCard'
import CountdownTimer from '../../components/ui/CountdownTimer'
import { PlusCircle, Users, Vote, BarChart3, Settings, PlayCircle, StopCircle, Eye, Edit3, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const CreatorDashboard = () => {
  const { profile, logAction } = useAuth()
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchElections() }, [])

  const fetchElections = async () => {
    const { data } = await supabase
      .from('elections')
      .select('*, candidates(count), voter_registrations(count)')
      .eq('creator_id', profile.id)
      .order('created_at', { ascending: false })
    setElections(data?.map(e => ({
      ...e,
      candidate_count: e.candidates?.[0]?.count || 0,
      voter_count: e.voter_registrations?.[0]?.count || 0
    })) || [])
    setLoading(false)
  }

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase.from('elections').update({ status: newStatus }).eq('id', id)
    if (error) { toast.error('Failed to update status'); return }
    await logAction(`election_${newStatus}`, 'election', id, {})
    toast.success(`Election ${newStatus === 'active' ? 'started' : newStatus === 'completed' ? 'stopped' : newStatus}!`)
    fetchElections()
  }

  const deleteElection = async (id) => {
    if (!window.confirm('Delete this election? This cannot be undone.')) return
    await supabase.from('elections').delete().eq('id', id)
    toast.success('Election deleted')
    fetchElections()
  }

  const stats = {
    total: elections.length,
    active: elections.filter(e => e.status === 'active').length,
    completed: elections.filter(e => e.status === 'completed').length,
    totalVoters: elections.reduce((s, e) => s + e.voter_count, 0),
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">My Elections</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your elections and campaigns</p>
        </div>
        <Link to="/creator/elections/new" className="btn-primary">
          <PlusCircle size={18} /> Create Election
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Elections', value: stats.total, icon: <Vote size={20} />, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400' },
          { label: 'Active Now', value: stats.active, icon: <PlayCircle size={20} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
          { label: 'Completed', value: stats.completed, icon: <BarChart3 size={20} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
          { label: 'Total Voters', value: stats.totalVoters, icon: <Users size={20} />, color: 'text-accent-600 bg-accent-50 dark:bg-accent-900/20 dark:text-accent-400' },
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

      {/* Elections list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card p-6 animate-pulse h-32" />)}
        </div>
      ) : elections.length === 0 ? (
        <div className="card p-16 text-center">
          <Vote size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-slate-500 dark:text-slate-400 mb-2">No elections yet</h3>
          <p className="text-slate-400 dark:text-slate-500 mb-6">Create your first election to get started</p>
          <Link to="/creator/elections/new" className="btn-primary">
            <PlusCircle size={16} /> Create Election
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {elections.map(election => (
            <div key={election.id} className="card p-5 hover:shadow-glow transition-all group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusBadge status={election.status} />
                    <span className="text-xs text-slate-400">{election.category}</span>
                  </div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg truncate">{election.title}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Users size={11} /> {election.voter_count}/{election.max_voters} voters</span>
                    <span className="flex items-center gap-1"><Vote size={11} /> {election.candidate_count} candidates</span>
                    <span>{format(new Date(election.start_date), 'MMM d')} → {format(new Date(election.end_date), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                {/* Countdown */}
                {election.status === 'active' && (
                  <div className="flex-shrink-0">
                    <CountdownTimer targetDate={election.end_date} compact />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <Link to={`/election/${election.id}`} className="btn-ghost py-1.5 px-3 text-xs">
                    <Eye size={13} /> View
                  </Link>
                  <Link to={`/creator/elections/${election.id}/candidates`} className="btn-ghost py-1.5 px-3 text-xs">
                    <Users size={13} /> Candidates
                  </Link>
                  <Link to={`/creator/elections/${election.id}/voters`} className="btn-ghost py-1.5 px-3 text-xs">
                    <Settings size={13} /> Voters
                  </Link>
                  <Link to={`/creator/elections/${election.id}/results`} className="btn-ghost py-1.5 px-3 text-xs">
                    <BarChart3 size={13} /> Results
                  </Link>

                  {election.status === 'draft' && (
                    <>
                      <Link to={`/creator/elections/${election.id}/edit`} className="btn-secondary py-1.5 px-3 text-xs">
                        <Edit3 size={13} /> Edit
                      </Link>
                      <button onClick={() => updateStatus(election.id, 'published')} className="btn-primary py-1.5 px-3 text-xs">
                        Publish
                      </button>
                    </>
                  )}
                  {election.status === 'published' && (
                    <button onClick={() => updateStatus(election.id, 'active')} className="btn-primary py-1.5 px-3 text-xs">
                      <PlayCircle size={13} /> Start
                    </button>
                  )}
                  {election.status === 'active' && (
                    <button onClick={() => updateStatus(election.id, 'completed')} className="btn-danger py-1.5 px-3 text-xs">
                      <StopCircle size={13} /> End
                    </button>
                  )}
                  {election.status === 'draft' && (
                    <button onClick={() => deleteElection(election.id)} className="btn-danger py-1.5 px-3 text-xs">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CreatorDashboard
