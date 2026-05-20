import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/ui/Modal'
import { PlusCircle, Trash2, Edit3, ArrowLeft, Upload, GripVertical, User } from 'lucide-react'
import toast from 'react-hot-toast'

const ManageCandidates = () => {
  const { id: electionId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [election, setElection] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCandidate, setEditCandidate] = useState(null)
  const [saving, setSaving] = useState(false)

  const emptyForm = { name: '', designation: '', manifesto: '', photo_url: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchData() }, [electionId])

  const fetchData = async () => {
    const [{ data: el }, { data: cands }] = await Promise.all([
      supabase.from('elections').select('*').eq('id', electionId).single(),
      supabase.from('candidates').select('*').eq('election_id', electionId).order('display_order')
    ])
    setElection(el)
    setCandidates(cands || [])
    setLoading(false)
  }

  const openAdd = () => { setForm(emptyForm); setEditCandidate(null); setModalOpen(true) }
  const openEdit = (c) => { setForm({ name: c.name, designation: c.designation || '', manifesto: c.manifesto || '', photo_url: c.photo_url || '' }); setEditCandidate(c); setModalOpen(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editCandidate) {
        const { error } = await supabase.from('candidates').update(form).eq('id', editCandidate.id)
        if (error) throw error
        toast.success('Candidate updated!')
      } else {
        const { error } = await supabase.from('candidates').insert({
          ...form, election_id: electionId, display_order: candidates.length
        })
        if (error) throw error
        toast.success('Candidate added!')
      }
      setModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteCandidate = async (cid) => {
    if (!window.confirm('Remove this candidate?')) return
    await supabase.from('candidates').delete().eq('id', cid)
    toast.success('Candidate removed')
    fetchData()
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2MB'); return }
    const ext = file.name.split('.').pop()
    const path = `candidates/${electionId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('election-media').upload(path, file)
    if (error) { toast.error('Upload failed'); return }
    const { data: { publicUrl } } = supabase.storage.from('election-media').getPublicUrl(path)
    setForm(prev => ({ ...prev, photo_url: publicUrl }))
    toast.success('Photo uploaded!')
  }

  if (loading) return <div className="flex justify-center py-20"><div className="spinner w-10 h-10" /></div>

  return (
    <div className="space-y-6 animate-in max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/creator')} className="btn-ghost p-2 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Manage Candidates</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm truncate">{election?.title}</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <PlusCircle size={16} /> Add Candidate
        </button>
      </div>

      {/* Info */}
      {election?.status !== 'draft' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-700 dark:text-amber-400">
          ⚠️ Election is published/active — candidate edits may affect ongoing voting. Proceed with caution.
        </div>
      )}

      {/* Candidates grid */}
      {candidates.length === 0 ? (
        <div className="card p-16 text-center">
          <User size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-display font-bold text-slate-500 dark:text-slate-400 mb-2">No candidates yet</h3>
          <p className="text-slate-400 text-sm mb-6">Add at least 2 candidates before publishing your election</p>
          <button onClick={openAdd} className="btn-primary">
            <PlusCircle size={16} /> Add First Candidate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {candidates.map((c, i) => (
            <div key={c.id} className="card p-5 flex gap-4 hover:shadow-glow transition-all group">
              {/* Photo */}
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center">
                {c.photo_url ? (
                  <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-2xl text-primary-700">{c.name[0]}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-sm text-slate-400">{c.designation || 'No designation'}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">#{i + 1}</span>
                </div>
                {c.manifesto && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{c.manifesto}</p>
                )}
                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="btn-ghost py-1 px-2.5 text-xs">
                    <Edit3 size={12} /> Edit
                  </button>
                  <button onClick={() => deleteCandidate(c.id)} className="btn-ghost py-1 px-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCandidate ? 'Edit Candidate' : 'Add Candidate'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Photo upload */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-200 to-accent-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {form.photo_url ? (
                <img src={form.photo_url} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-primary-500" />
              )}
            </div>
            <div>
              <label className="btn-secondary py-2 px-3 text-sm cursor-pointer">
                <Upload size={14} /> Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
              <p className="text-xs text-slate-400 mt-1">Max 2MB. Or enter URL below.</p>
            </div>
          </div>

          <div>
            <label className="label">Photo URL</label>
            <input type="url" className="input text-sm" placeholder="https://..."
              value={form.photo_url} onChange={e => setForm(prev => ({ ...prev, photo_url: e.target.value }))} />
          </div>

          <div>
            <label className="label">Full Name *</label>
            <input type="text" required className="input" placeholder="Candidate name"
              value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
          </div>

          <div>
            <label className="label">Designation / Position</label>
            <input type="text" className="input" placeholder="e.g. President, Treasurer"
              value={form.designation} onChange={e => setForm(prev => ({ ...prev, designation: e.target.value }))} />
          </div>

          <div>
            <label className="label">Manifesto / Description</label>
            <textarea className="input min-h-24 resize-none text-sm" placeholder="Brief description or manifesto..."
              value={form.manifesto} onChange={e => setForm(prev => ({ ...prev, manifesto: e.target.value }))} />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editCandidate ? 'Save Changes' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ManageCandidates
