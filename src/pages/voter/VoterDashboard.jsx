import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge } from '../../components/ui/ElectionCard'
import CountdownTimer from '../../components/ui/CountdownTimer'
import { Vote, CheckCircle, Clock, Eye, Search } from 'lucide-react'
import { format } from 'date-fns'

const VoterDashboard = () => {
  const { profile } = useAuth()
  if (!profile) return null

  const [myPolls, setMyPolls] = useState([])
  const [loading, setLoading] = useState(true)
useEffect(() => { 
  if (profile?.id) fetchMyPolls() 
}, [profile])
  useEffect(() => {
    if (profile?.id) {
      fetchMyPolls()
    } else {
      setLoading(false)
    }
  }, [profile])

  const fetchMyPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('voter_registrations')
        .select('*, elections(*, candidates(count))')
        .eq('user_id', profile?.id)
        .order('registered_at', { ascending: false })

      if (error) {
        console.error('fetchMyPolls error:', error)
      }

      setMyPolls(data || [])
    } catch (e) {
      console.error('fetchMyPolls exception:', e)
      setMyPolls([])
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    joined: myPolls.length,
    voted: myPolls.filter(p => p.has_voted).length,
    active: myPolls.filter(
      p => p.elections?.status === 'active' && !p.has_voted
    ).length,
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
          Welcome, {profile?.full_name?.split?.(' ')?.[0] || 'User'}! 👋
        </h1>

        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Your election dashboard
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Elections Joined',
            value: stats.joined,
            icon: <Vote size={18} />,
            color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20',
          },
          {
            label: 'Votes Cast',
            value: stats.voted,
            icon: <CheckCircle size={18} />,
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
          },
          {
            label: 'Action Required',
            value: stats.active,
            icon: <Clock size={18} />,
            color: 'text-accent-600 bg-accent-50 dark:bg-accent-900/20',
          },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="stat-card">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}
            >
              {icon}
            </div>

            <div>
              <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                {value}
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Action required */}
      {stats.active > 0 && (
        <div className="p-4 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-xl">
          <p className="font-semibold text-accent-700 dark:text-accent-400 mb-1">
            🗳️ You have {stats.active} active election
            {stats.active > 1 ? 's' : ''} to vote in!
          </p>

          <p className="text-sm text-accent-600 dark:text-accent-500">
            Cast your vote before the deadline
          </p>
        </div>
      )}

      {/* My elections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">
            My Elections
          </h2>

          <Link
            to="/voter/polls"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            <Search size={13} />
            Browse more
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="card p-6 animate-pulse h-28"
              />
            ))}
          </div>
        ) : myPolls.length === 0 ? (
          <div className="card p-12 text-center">
            <Vote
              size={40}
              className="text-slate-300 dark:text-slate-600 mx-auto mb-3"
            />

            <h3 className="font-display font-bold text-slate-400 mb-2">
              No elections joined yet
            </h3>

            <p className="text-sm text-slate-400 mb-4">
              Browse and join elections you care about
            </p>

            <Link to="/voter/polls" className="btn-primary">
              Browse Elections
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {myPolls.map(reg => {
              const el = reg.elections

              if (!el) return null

              const canVoteNow =
                el.status === 'active' && !reg.has_voted

              return (
                <div
                  key={reg.id}
                  className={`card p-5 ${
                    canVoteNow
                      ? 'border-accent-300 dark:border-accent-700 shadow-glow-accent'
                      : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={el.status} />

                        {reg.has_voted && (
                          <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle size={10} />
                            Voted
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-bold text-slate-900 dark:text-white truncate">
                        {el.title}
                      </h3>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span>
                          Registered{' '}
                          {reg.registered_at
                            ? format(
                                new Date(reg.registered_at),
                                'MMM d, yyyy'
                              )
                            : 'N/A'}
                        </span>

                        <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          ID: ****
                          {reg.secret_voter_id?.slice?.(-4) || '0000'}
                        </span>
                      </div>
                    </div>

                    {el.status === 'active' && (
                      <CountdownTimer
                        targetDate={el.end_date}
                        compact
                      />
                    )}

                    <div className="flex gap-2 flex-shrink-0">
                      <Link
                        to={`/election/${el.id}`}
                        className="btn-ghost py-1.5 px-3 text-xs"
                      >
                        <Eye size={13} />
                        View
                      </Link>

                      {canVoteNow && (
                        <Link
                          to={`/voter/vote/${el.id}`}
                          className="btn-accent py-1.5 px-3 text-xs"
                        >
                          🗳️ Vote Now
                        </Link>
                      )}

                      {el.status === 'completed' && (
                        <Link
                          to={`/election/${el.id}`}
                          className="btn-secondary py-1.5 px-3 text-xs"
                        >
                          📊 Results
                        </Link>
                      )}

                      {el.status === 'published' && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 px-2">
                          <Clock size={12} />
                          Waiting
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default VoterDashboard 