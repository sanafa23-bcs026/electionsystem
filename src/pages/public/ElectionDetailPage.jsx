import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/ui/Navbar'
import CountdownTimer from '../../components/ui/CountdownTimer'
import { StatusBadge } from '../../components/ui/ElectionCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { QRCodeSVG } from 'qrcode.react'
import { Users, Calendar, Clock, Lock, UserCheck, ChevronLeft, Share2, Download } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const COLORS = ['#6366f1','#f97316','#10b981','#3b82f6','#ec4899','#f59e0b']

const ElectionDetailPage = () => {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [election, setElection] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [registrations, setRegistrations] = useState(0)
  const [myReg, setMyReg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [showQR, setShowQR] = useState(false)

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    const [{ data: el }, { data: cands }, { count }, { data: reg }] = await Promise.all([
      supabase.from('elections').select('*').eq('id', id).single(),
      supabase.from('candidates').select('*').eq('election_id', id).order('display_order'),
      supabase.from('voter_registrations').select('*', { count: 'exact', head: true }).eq('election_id', id),
      user ? supabase.from('voter_registrations').select('*').eq('election_id', id).eq('user_id', user.id).maybeSingle() : { data: null }
    ])
    setElection(el)
    setCandidates(cands || [])
    setRegistrations(count || 0)
    setMyReg(reg)
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!user) { navigate('/auth/login'); return }
    if (election.is_voter_list_locked) { toast.error('Voter registration is full/locked'); return }
    if (registrations >= election.max_voters) { toast.error('Maximum voters reached'); return }
    const deadline = new Date(election.registration_deadline)
    if (new Date() > deadline) { toast.error('Registration deadline has passed'); return }
    
    setJoining(true)
    try {
      const secretId = `POLL-${election.id.slice(0,4).toUpperCase()}-${String(registrations + 1).padStart(4,'0')}`
      const { error } = await supabase.from('voter_registrations').insert({
        election_id: id,
        user_id: user.id,
        secret_voter_id: secretId
      })
      if (error) throw error
      toast.success('🎉 You joined this election! Check your email for your secret voter ID.')
      await fetchAll()
    } catch (err) {
      toast.error(err.message?.includes('unique') ? 'You have already joined this election' : err.message)
    } finally {
      setJoining(false)
    }
  }

  const voterPercent = election ? Math.round(registrations / election.max_voters * 100) : 0
  const totalVotes = candidates.reduce((s, c) => s + (c.vote_count || 0), 0)
  const canRegister = election && !election.is_voter_list_locked && new Date() < new Date(election.registration_deadline) && election.status !== 'completed'
  const canVote = myReg && !myReg.has_voted && election?.status === 'active'
  const showResults = election?.status === 'completed' || election?.status === 'active'

  if (loading) return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Navbar />
      <div className="page-container py-20 text-center">
        <div className="spinner w-10 h-10 mx-auto" />
      </div>
    </div>
  )

  if (!election) return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Navbar />
      <div className="page-container py-20 text-center">
        <h2 className="text-2xl font-display font-bold text-slate-700 dark:text-slate-300">Election not found</h2>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Navbar />
      <div className="page-container py-10 max-w-5xl">
        {/* Back */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 mb-6 group">
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to elections
        </Link>

        {/* Header */}
        <div className="card p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">{election.category}</span>
                <StatusBadge status={election.status} />
              </div>
              <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-3">{election.title}</h1>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{election.description}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowQR(!showQR)} className="btn-secondary py-2 px-3 text-sm">
                <Share2 size={15} /> Share
              </button>
            </div>
          </div>

          {showQR && (
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex items-center gap-4">
              <QRCodeSVG value={window.location.href} size={100} bgColor="transparent" fgColor="#6366f1" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white mb-1">Scan to share</p>
                <p className="text-sm text-slate-400 break-all">{window.location.href}</p>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { icon: <Users size={16} />, label: 'Registered', value: `${registrations} / ${election.max_voters}` },
              { icon: <Calendar size={16} />, label: 'Start Date', value: format(new Date(election.start_date), 'MMM d, yyyy') },
              { icon: <Clock size={16} />, label: 'End Date', value: format(new Date(election.end_date), 'MMM d, yyyy') },
              { icon: <Lock size={16} />, label: 'Reg. Deadline', value: format(new Date(election.registration_deadline), 'MMM d, yyyy') },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">{icon} {label}</div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">{value}</p>
              </div>
            ))}
          </div>

          {/* Voter progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-500 dark:text-slate-400">Registration Progress</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{voterPercent}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(voterPercent, 100)}%` }} />
            </div>
          </div>

          {/* Countdown */}
          {election.status === 'active' && (
            <div className="mt-6">
              <CountdownTimer targetDate={election.end_date} label="Voting ends in" />
            </div>
          )}
          {election.status === 'published' && (
            <div className="mt-6">
              <CountdownTimer targetDate={election.start_date} label="Voting starts in" />
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            {!user && canRegister && (
              <Link to="/auth/login" className="btn-primary">
                <UserCheck size={18} /> Sign in to Participate
              </Link>
            )}
            {user && !myReg && canRegister && (
              <button onClick={handleJoin} disabled={joining} className="btn-primary">
                {joining ? <><div className="spinner w-4 h-4" /> Joining...</> : <><UserCheck size={18} /> I Want to Participate</>}
              </button>
            )}
            {myReg && !myReg.has_voted && election.status === 'active' && (
              <Link to={`/voter/vote/${election.id}`} className="btn-accent">
                <Vote size={18} /> Cast Your Vote
              </Link>
            )}
            {myReg?.has_voted && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-semibold">
                ✓ You have voted
              </div>
            )}
            {election.is_voter_list_locked && !myReg && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-semibold">
                <Lock size={15} /> Registration Locked
              </div>
            )}
          </div>
        </div>

        {/* Candidates */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-6">
            Candidates ({candidates.length})
          </h2>
          {candidates.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No candidates added yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((c, i) => {
                const pct = totalVotes > 0 ? Math.round(c.vote_count / totalVotes * 100) : 0
                return (
                  <div key={c.id} className="flex gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center">
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display font-bold text-xl text-primary-700">{c.name[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-sm text-slate-400 mb-2">{c.designation}</p>
                      {showResults && (
                        <div>
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{c.vote_count || 0} votes</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Live Results Chart */}
        {showResults && candidates.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2">
              {election.status === 'active' ? '🔴 Live Results' : '🏆 Final Results'}
            </h2>
            <p className="text-sm text-slate-400 mb-6">Total votes cast: {totalVotes} | Turnout: {registrations > 0 ? Math.round(totalVotes/registrations*100) : 0}%</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={candidates.map((c, i) => ({ name: c.name, votes: c.vote_count || 0, fill: COLORS[i % COLORS.length] }))}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'DM Sans' }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontFamily: 'DM Sans' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                  {candidates.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

const Vote = ({ size, ...rest }) => {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
}

export default ElectionDetailPage
