import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CheckCircle, Clock, XCircle, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const RequestCreatorAccess = () => {
  const { profile, logAction } = useAuth()
  const [form, setForm] = useState({ organization: '', purpose: '', phone: profile?.phone || '', email: profile?.email || '' })
  const [loading, setLoading] = useState(false)
  const [existingRequest, setExistingRequest] = useState(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    supabase.from('creator_requests').select('*').eq('user_id', profile.id).maybeSingle()
      .then(({ data }) => { setExistingRequest(data); setFetching(false) })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.from('creator_requests').insert({
        user_id: profile.id, ...form, status: 'pending'
      }).select().single()
      if (error) throw error
      await logAction('submit_creator_request', 'creator_request', data.id, { organization: form.organization })
      toast.success('Request submitted! You\'ll be notified by email once reviewed.')
      setExistingRequest(data)
    } catch (err) {
      toast.error(err.message?.includes('unique') ? 'You already have a pending request' : err.message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="flex justify-center py-20"><div className="spinner w-10 h-10" /></div>

  if (profile?.role === 'election_creator') return (
    <div className="max-w-md mx-auto text-center py-20 animate-in">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-emerald-600" />
      </div>
      <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-3">You're a Creator!</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">You already have election creator access. Head to your creator dashboard to manage elections.</p>
    </div>
  )

  if (existingRequest) return (
    <div className="max-w-lg mx-auto animate-in">
      <div className={`card p-8 text-center ${
        existingRequest.status === 'approved' ? 'border-emerald-300 dark:border-emerald-700' :
        existingRequest.status === 'rejected' ? 'border-red-300 dark:border-red-700' : ''
      }`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          existingRequest.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' :
          existingRequest.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
          'bg-red-100 dark:bg-red-900/30'
        }`}>
          {existingRequest.status === 'pending' && <Clock size={40} className="text-amber-600" />}
          {existingRequest.status === 'approved' && <CheckCircle size={40} className="text-emerald-600" />}
          {existingRequest.status === 'rejected' && <XCircle size={40} className="text-red-600" />}
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-3 capitalize">
          Request {existingRequest.status}
        </h2>
        {existingRequest.status === 'pending' && (
          <p className="text-slate-500 dark:text-slate-400">Your request is under review. You'll be notified by email once an admin approves it.</p>
        )}
        {existingRequest.status === 'approved' && (
          <p className="text-slate-500 dark:text-slate-400">Your request was approved! You now have creator access. Please log out and log back in to see your creator dashboard.</p>
        )}
        {existingRequest.status === 'rejected' && (
          <>
            <p className="text-slate-500 dark:text-slate-400 mb-3">Your request was rejected.</p>
            {existingRequest.rejection_reason && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400 text-left">
                <strong>Reason:</strong> {existingRequest.rejection_reason}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Zap size={24} className="text-accent-500" /> Become an Election Creator
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Submit a request to create and manage elections on VoteSecure. Our team will review your application.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-3">
        {['Create unlimited elections', 'Manage candidates', 'View detailed results', 'Export voter data'].map(b => (
          <div key={b} className="flex items-center gap-2 p-3 bg-primary-50 dark:bg-primary-950 rounded-xl text-sm text-primary-700 dark:text-primary-400">
            <CheckCircle size={14} className="flex-shrink-0" /> {b}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Organization / Institution *</label>
          <input type="text" required className="input" placeholder="e.g. University of XYZ, ABC Corp"
            value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} />
        </div>
        <div>
          <label className="label">Email *</label>
          <input type="email" required className="input"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone Number *</label>
          <input type="tel" required className="input" placeholder="+1 (555) 000-0000"
            value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Purpose / Reason for Access *</label>
          <textarea required className="input min-h-28 resize-none" placeholder="Describe why you need to create elections, what type of elections you plan to run, and how many people will be participating..."
            value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
          {loading ? 'Submitting...' : '🚀 Submit Request'}
        </button>
      </form>
    </div>
  )
}

export default RequestCreatorAccess
