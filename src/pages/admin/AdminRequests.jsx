import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/ui/Modal'
import { CheckCircle, XCircle, Eye, Building2, Mail, Phone, Clock } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const AdminRequests = () => {
  const { profile, logAction } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [filterStatus, setFilterStatus] = useState('pending')

  useEffect(() => { fetchRequests() }, [filterStatus])

  const fetchRequests = async () => {
    setLoading(true)
    const query = supabase
      .from('creator_requests')
      .select('*, profiles!creator_requests_user_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
    
    if (filterStatus !== 'all') query.eq('status', filterStatus)
    const { data } = await query
    setRequests(data || [])
    setLoading(false)
  }

  const approve = async (req) => {
    setProcessing(true)
    try {
      await supabase.from('creator_requests').update({
        status: 'approved', reviewed_by: profile.id, reviewed_at: new Date().toISOString()
      }).eq('id', req.id)
      
      await supabase.from('profiles').update({ role: 'election_creator' }).eq('id', req.user_id)
      await logAction('approve_creator_request', 'creator_request', req.id, { user_id: req.user_id })
      
      toast.success(`${req.profiles?.full_name} is now an Election Creator!`)
      setSelected(null)
      fetchRequests()
    } catch (err) {
      toast.error('Failed to approve request')
    } finally {
      setProcessing(false)
    }
  }

  const reject = async () => {
    if (!reason.trim()) { toast.error('Please provide a rejection reason'); return }
    setProcessing(true)
    try {
      await supabase.from('creator_requests').update({
        status: 'rejected', reviewed_by: profile.id, reviewed_at: new Date().toISOString(), rejection_reason: reason
      }).eq('id', rejectModal.id)
      
      await logAction('reject_creator_request', 'creator_request', rejectModal.id, { reason })
      toast.success('Request rejected')
      setRejectModal(null)
      setReason('')
      fetchRequests()
    } catch {
      toast.error('Failed to reject request')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Creator Requests</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review and approve election creator applications</p>
        </div>
        <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
          {['pending', 'approved', 'rejected', 'all'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                filterStatus === s
                  ? 'bg-white dark:bg-surface-700 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card p-6 animate-pulse h-24" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 card">
          <Clock size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-500 dark:text-slate-400">No {filterStatus} requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="card p-5 hover:shadow-glow transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                    {req.profiles?.full_name?.[0]}
                  </div>
                  <div>
                    <p className="font-display font-bold text-slate-900 dark:text-white">{req.profiles?.full_name}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Building2 size={11} /> {req.organization}</span>
                      <span className="flex items-center gap-1"><Mail size={11} /> {req.email}</span>
                      <span className="flex items-center gap-1"><Phone size={11} /> {req.phone}</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{req.purpose}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={req.status === 'pending' ? 'badge-pending' : req.status === 'approved' ? 'badge-approved' : 'badge-rejected'}>
                    {req.status}
                  </span>
                  <button onClick={() => setSelected(req)} className="btn-ghost py-1.5 px-3 text-sm">
                    <Eye size={14} /> View
                  </button>
                  {req.status === 'pending' && (
                    <>
                      <button onClick={() => approve(req)} disabled={processing} className="btn-primary py-1.5 px-3 text-sm">
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button onClick={() => setRejectModal(req)} className="btn-danger py-1.5 px-3 text-sm">
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Creator Request Details">
        {selected && (
          <div className="space-y-4">
            {[
              ['Full Name', selected.profiles?.full_name],
              ['Email', selected.email],
              ['Phone', selected.phone],
              ['Organization', selected.organization],
              ['Purpose', selected.purpose],
              ['Submitted', format(new Date(selected.created_at), 'PPpp')],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <p className="label mb-0 w-32 flex-shrink-0">{label}</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm flex-1">{value}</p>
              </div>
            ))}
            {selected.rejection_reason && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm text-red-700 dark:text-red-400">
                <strong>Rejection reason:</strong> {selected.rejection_reason}
              </div>
            )}
            {selected.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <button onClick={() => approve(selected)} disabled={processing} className="btn-primary flex-1">
                  <CheckCircle size={15} /> Approve
                </button>
                <button onClick={() => { setRejectModal(selected); setSelected(null) }} className="btn-danger flex-1">
                  <XCircle size={15} /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setReason('') }} title="Reject Request" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Rejecting request from <strong>{rejectModal?.profiles?.full_name}</strong>. Please provide a reason.</p>
          <div>
            <label className="label">Rejection Reason</label>
            <textarea className="input min-h-24 resize-none" placeholder="Explain why this request is rejected..."
              value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setRejectModal(null); setReason('') }} className="btn-secondary flex-1">Cancel</button>
            <button onClick={reject} disabled={processing} className="btn-danger flex-1">
              {processing ? 'Rejecting...' : 'Reject Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminRequests
