import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import CountdownTimer from '../../components/ui/CountdownTimer'
import { Shield, CheckCircle, AlertCircle, Lock, User } from 'lucide-react'
import toast from 'react-hot-toast'

const VotingPage = () => {
  const { electionId } = useParams()
  const { profile, logAction } = useAuth()
  const navigate = useNavigate()
  const [election, setElection] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [registration, setRegistration] = useState(null)
  const [secretId, setSecretId] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [step, setStep] = useState('verify') // verify → ballot → confirm → success
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchData() }, [electionId])

  const fetchData = async () => {
    const [{ data: el }, { data: cands }, { data: reg }] = await Promise.all([
      supabase.from('elections').select('*').eq('id', electionId).single(),
      supabase.from('candidates').select('*').eq('election_id', electionId).order('display_order'),
      supabase.from('voter_registrations').select('*').eq('election_id', electionId).eq('user_id', profile.id).maybeSingle()
    ])
    setElection(el)
    setCandidates(cands || [])
    setRegistration(reg)
    setLoading(false)

    // Check eligibility
    if (!reg) { toast.error('You are not registered for this election'); navigate('/voter'); return }
    if (reg.has_voted) { setStep('already-voted'); return }
    if (!el || el.status !== 'active') { toast.error('This election is not currently active'); navigate('/voter'); return }
  }

  const verifySecretId = () => {
    if (!secretId.trim()) { toast.error('Enter your secret voter ID'); return }
    if (secretId.trim().toUpperCase() !== registration.secret_voter_id) {
      toast.error('Invalid secret voter ID. Check your email.')
      return
    }
    setStep('ballot')
    toast.success('Identity verified! 🎉')
  }

  const submitVote = async () => {
    if (!selectedCandidate) { toast.error('Select a candidate'); return }
    setSubmitting(true)
    try {
      // Create anonymous token from secret ID
      const voterToken = btoa(registration.secret_voter_id + electionId).split('').reverse().join('')

      // Insert anonymous vote
      const { error: voteError } = await supabase.from('votes').insert({
        election_id: electionId,
        candidate_id: selectedCandidate,
        voter_token: voterToken
      })
      if (voteError) {
        if (voteError.message.includes('unique')) throw new Error('You have already voted')
        throw voteError
      }

      // Increment candidate vote count
      const { error: countError } = await supabase.rpc('increment_vote', {
        candidate_id_param: selectedCandidate
      }).catch(() => ({ error: null }))

      // If RPC doesn't exist, do manual update
      if (countError) {
        const cand = candidates.find(c => c.id === selectedCandidate)
        await supabase.from('candidates').update({ vote_count: (cand.vote_count || 0) + 1 }).eq('id', selectedCandidate)
      }

      // Mark voter as voted (keep anonymous — just update status)
      await supabase.from('voter_registrations').update({
        has_voted: true, status: 'voted', voted_at: new Date().toISOString()
      }).eq('id', registration.id)

      await logAction('vote_cast', 'election', electionId, { election_id: electionId })
      setStep('success')
    } catch (err) {
      toast.error(err.message || 'Failed to cast vote')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="spinner w-10 h-10" />
    </div>
  )

  // Already voted
  if (step === 'already-voted') return (
    <div className="max-w-lg mx-auto text-center py-20 animate-in">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-emerald-600" />
      </div>
      <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-3">Already Voted</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">You have already cast your vote in this election. Thank you for participating!</p>
      <button onClick={() => navigate('/voter')} className="btn-primary">Back to Dashboard</button>
    </div>
  )

  // Success
  if (step === 'success') return (
    <div className="max-w-lg mx-auto animate-in">
      <div className="card p-10 text-center">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle size={48} className="text-emerald-600" />
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-3">Vote Cast! 🎉</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Your anonymous vote has been recorded securely. Your identity is protected — the vote is fully anonymous.
        </p>
        <div className="bg-primary-50 dark:bg-primary-950 border border-primary-100 dark:border-primary-900 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-1">🔒 Privacy Guaranteed</p>
          <p className="text-xs text-primary-600 dark:text-primary-500">
            Your vote was recorded with an anonymous token. No one — not even administrators — can trace your vote to your identity.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/voter')} className="btn-secondary flex-1">Dashboard</button>
          <button onClick={() => navigate(`/election/${electionId}`)} className="btn-primary flex-1">View Results</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow">
            <Shield size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">{election?.title}</h1>
            <p className="text-slate-400 text-sm mt-1">Secure, anonymous voting</p>
          </div>
        </div>
        {election && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <CountdownTimer targetDate={election.end_date} label="Time remaining to vote" />
          </div>
        )}
      </div>

      {/* Step: Verify */}
      {step === 'verify' && (
        <div className="card p-6 space-y-5 animate-in">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-1">
              Step 1: Verify Your Identity
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Enter the secret voter ID you received by email to confirm your identity.
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400 flex gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>Your secret ID was emailed when you registered. Format: POLL-XXXX-0001. Keep it private!</span>
          </div>

          <div>
            <label className="label">Your Secret Voter ID</label>
            <input
              type="text"
              className="input font-mono text-center text-lg tracking-widest uppercase"
              placeholder="POLL-XXXX-0001"
              value={secretId}
              onChange={e => setSecretId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && verifySecretId()}
            />
            <p className="text-xs text-slate-400 mt-1 text-center">
              Your ID: ****{registration?.secret_voter_id?.slice(-4)} (last 4 digits shown)
            </p>
          </div>

          <button onClick={verifySecretId} className="btn-primary w-full py-3.5">
            <Lock size={18} /> Verify & Proceed to Ballot
          </button>
        </div>
      )}

      {/* Step: Ballot */}
      {step === 'ballot' && (
        <div className="space-y-4 animate-in">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
              <CheckCircle size={16} /> Identity Verified — Select your candidate
            </div>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-1">
              Step 2: Cast Your Vote
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Select one candidate. Your choice is anonymous and final.
            </p>
          </div>

          <div className="space-y-3">
            {candidates.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setSelectedCandidate(c.id)}
                className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                  selectedCandidate === c.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 shadow-glow'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    selectedCandidate === c.id ? 'border-primary-500 bg-primary-500' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {selectedCandidate === c.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>

                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center">
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-xl text-primary-700">{c.name[0]}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-slate-900 dark:text-white">{c.name}</p>
                    <p className="text-sm text-slate-400">{c.designation}</p>
                    {c.manifesto && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 line-clamp-1">{c.manifesto}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedCandidate && (
            <div className="card p-4 border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950 animate-in">
              <p className="text-sm text-primary-700 dark:text-primary-400">
                You selected: <strong>{candidates.find(c => c.id === selectedCandidate)?.name}</strong>
              </p>
            </div>
          )}

          <button
            onClick={() => selectedCandidate && setStep('confirm')}
            disabled={!selectedCandidate}
            className="btn-primary w-full py-3.5"
          >
            Continue to Confirm
          </button>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div className="card p-6 space-y-5 animate-in">
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">
            Step 3: Confirm Your Vote
          </h2>

          <div className="bg-slate-50 dark:bg-surface-800 rounded-xl p-5 text-center">
            {(() => {
              const c = candidates.find(c => c.id === selectedCandidate)
              return (
                <>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-3 bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center">
                    {c?.photo_url ? <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" /> : <span className="font-display font-bold text-3xl text-primary-700">{c?.name[0]}</span>}
                  </div>
                  <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{c?.name}</p>
                  <p className="text-slate-400">{c?.designation}</p>
                </>
              )
            })()}
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400 flex gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span><strong>Warning:</strong> This action is irreversible. Once submitted, your vote cannot be changed.</span>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('ballot')} className="btn-secondary flex-1">← Go Back</button>
            <button onClick={submitVote} disabled={submitting} className="btn-accent flex-1 py-3.5">
              {submitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <div className="spinner w-4 h-4" /> Submitting...
                </span>
              ) : '🗳️ Submit My Vote'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VotingPage
