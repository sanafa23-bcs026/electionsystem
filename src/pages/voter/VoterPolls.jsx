import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { ElectionCard } from '../../components/ui/ElectionCard'
import { Search, Vote } from 'lucide-react'

const VoterPolls = () => {
  const [elections, setElections] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchElections() }, [])

  const fetchElections = async () => {
    const { data } = await supabase
      .from('elections')
      .select('*, voter_registrations(count)')
      .in('status', ['published', 'active', 'completed'])
      .order('created_at', { ascending: false })
    setElections(data?.map(e => ({ ...e, registered_voters: e.voter_registrations?.[0]?.count || 0 })) || [])
    setLoading(false)
  }

  useEffect(() => {
    let res = elections
    if (filter !== 'all') res = res.filter(e => e.status === filter)
    if (search) res = res.filter(e =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.description || '').toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(res)
  }, [filter, search, elections])

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Browse Elections</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Find elections to participate in</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9 py-2.5 text-sm" placeholder="Search elections..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
          {['all', 'active', 'published', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-white dark:bg-surface-700 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}>
              {f === 'published' ? 'Upcoming' : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card p-6 animate-pulse h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 card">
          <Vote size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-500 dark:text-slate-400">No elections found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(el => <ElectionCard key={el.id} election={el} />)}
        </div>
      )}
    </div>
  )
}

export default VoterPolls
