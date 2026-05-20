import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Save, ArrowLeft, Calendar, Users, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const ElectionForm = ({ isEdit = false }) => {
  const { profile, logAction } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  const [form, setForm] = useState({
    title: '', description: '', category: 'general',
    start_date: '', end_date: '', registration_deadline: '', max_voters: 1000
  })

  const categories = ['general', 'student council', 'corporate', 'community', 'government', 'sports', 'other']

  useEffect(() => {
    if (isEdit && id) {
      supabase.from('elections').select('*').eq('id', id).single().then(({ data }) => {
        if (data) setForm({
          title: data.title,
          description: data.description || '',
          category: data.category,
          start_date: data.start_date?.slice(0, 16),
          end_date: data.end_date?.slice(0, 16),
          registration_deadline: data.registration_deadline?.slice(0, 16),
          max_voters: data.max_voters
        })
        setFetching(false)
      })
    }
  }, [id, isEdit])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (new Date(form.registration_deadline) >= new Date(form.start_date)) {
      toast.error('Registration deadline must be before start date')
      return
    }
    if (new Date(form.start_date) >= new Date(form.end_date)) {
      toast.error('Start date must be before end date')
      return
    }

    setLoading(true)
    try {
      const payload = { ...form, max_voters: parseInt(form.max_voters) }

      if (isEdit) {
        const { error } = await supabase.from('elections').update(payload).eq('id', id)
        if (error) throw error
        await logAction('edit_election', 'election', id, { title: form.title })
        toast.success('Election updated!')
        navigate('/creator')
      } else {
        const { data, error } = await supabase.from('elections').insert({
          ...payload, creator_id: profile.id, status: 'draft'
        }).select().single()
        if (error) throw error
        await logAction('create_election', 'election', data.id, { title: form.title })
        toast.success('Election created! Now add candidates.')
        navigate(`/creator/elections/${data.id}/candidates`)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save election')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="flex justify-center py-20"><div className="spinner w-10 h-10" /></div>

  return (
    <div className="space-y-6 animate-in max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/creator')} className="btn-ghost p-2 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {isEdit ? 'Edit Election' : 'Create New Election'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">
            {isEdit ? 'Update election details' : 'Set up your election details'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info size={18} className="text-primary-500" /> Basic Information
          </h2>
          <div>
            <label className="label">Election Title *</label>
            <input type="text" required className="input" placeholder="e.g. Student Council Election 2025"
              value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-24 resize-none" placeholder="Describe what this election is about..."
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              {categories.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Schedule */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar size={18} className="text-primary-500" /> Schedule
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Registration Deadline *</label>
              <input type="datetime-local" required className="input"
                value={form.registration_deadline} onChange={e => set('registration_deadline', e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">Voters must join before this date</p>
            </div>
            <div>
              <label className="label">Election Start *</label>
              <input type="datetime-local" required className="input"
                value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Election End *</label>
            <input type="datetime-local" required className="input"
              value={form.end_date} onChange={e => set('end_date', e.target.value)} />
          </div>
        </div>

        {/* Voter Settings */}
        <div className="card p-6 space-y-4">
          <h2 className="font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users size={18} className="text-primary-500" /> Voter Settings
          </h2>
          <div>
            <label className="label">Maximum Voters *</label>
            <input type="number" required min="1" max="100000" className="input"
              value={form.max_voters} onChange={e => set('max_voters', e.target.value)} />
            <p className="text-xs text-slate-400 mt-1">
              Registration locks automatically when this limit is reached
            </p>
          </div>

          {/* Info box */}
          <div className="bg-primary-50 dark:bg-primary-950 border border-primary-100 dark:border-primary-900 rounded-xl p-4 text-sm">
            <p className="font-semibold text-primary-700 dark:text-primary-400 mb-1">How it works</p>
            <ul className="text-primary-600 dark:text-primary-500 space-y-1 text-xs list-disc list-inside">
              <li>Users join during the registration window</li>
              <li>When max voters is reached, registration locks automatically</li>
              <li>Each voter gets a unique secret ID via email</li>
              <li>Only registered voters can cast votes during active period</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/creator')} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <div className="spinner w-4 h-4" /> {isEdit ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              <><Save size={16} /> {isEdit ? 'Save Changes' : 'Create Election'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export const CreateElection = () => <ElectionForm isEdit={false} />
export const EditElection = () => <ElectionForm isEdit={true} />

export default CreateElection
