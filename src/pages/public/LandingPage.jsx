import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Navbar from '../../components/ui/Navbar'
import { ElectionCard } from '../../components/ui/ElectionCard'
import { Shield, Vote, Users, BarChart3, ArrowRight, Search, Filter, ChevronRight, Lock, Eye, Zap } from 'lucide-react'

const features = [
  { icon: <Shield size={24} />, title: 'Military-grade Security', desc: 'End-to-end encryption, RLS, and anonymous voting protect every ballot.' },
  { icon: <Vote size={24} />, title: 'Unique Voter IDs', desc: 'Every eligible voter receives a secret ID — no impersonation, ever.' },
  { icon: <Eye size={24} />, title: 'Full Transparency', desc: 'Live results, audit logs, and real-time turnout visible to all.' },
  { icon: <Lock size={24} />, title: 'Anti-Fraud Built-in', desc: 'One person, one vote. Duplicate prevention at every layer.' },
  { icon: <BarChart3 size={24} />, title: 'Live Analytics', desc: 'Real-time vote counting with beautiful charts and winner declaration.' },
  { icon: <Zap size={24} />, title: 'Instant Setup', desc: 'Create an election in minutes. Manage thousands of voters effortlessly.' },
]

const LandingPage = () => {
  const [elections, setElections] = useState([])
  const [filtered, setFiltered] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, active: 0, voters: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchElections() }, [])

  const fetchElections = async () => {
    const { data } = await supabase
      .from('elections')
      .select(`*, voter_registrations(count)`)
      .in('status', ['published', 'active', 'completed'])
      .order('created_at', { ascending: false })
    
    if (data) {
      const enriched = data.map(e => ({
        ...e,
        registered_voters: e.voter_registrations?.[0]?.count || 0
      }))
      setElections(enriched)
      setFiltered(enriched)
      setStats({
        total: enriched.length,
        active: enriched.filter(e => e.status === 'active').length,
        voters: enriched.reduce((s, e) => s + (e.registered_voters || 0), 0)
      })
    }
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
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-36">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-accent-500/10 dark:bg-accent-500/5 rounded-full blur-3xl" />
        </div>

        <div className="page-container relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded-full text-primary-700 dark:text-primary-400 text-sm font-semibold mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Trusted by organizations worldwide
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            Elections that are
            <br />
            <span className="gradient-text">actually secure</span>
          </h1>

          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Run transparent, fair, and tamper-proof elections. From student councils to corporate boards — VoteSecure handles it all.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/auth/register" className="btn-primary px-8 py-4 text-base">
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link to="#elections" className="btn-secondary px-8 py-4 text-base">
              Browse Elections
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
            {[
              ['10K+', 'Voters'],
              [stats.active || '0', 'Live Now'],
              [stats.total || '0', 'Elections'],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <p className="text-2xl md:text-3xl font-display font-bold gradient-text">{num}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Elections Section */}
      <section id="elections" className="py-16 page-container">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="section-title">Active Elections</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Find and join elections you care about</p>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text" placeholder="Search elections..."
                className="input pl-9 w-full sm:w-60 py-2.5 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1">
              {['all', 'active', 'published', 'completed'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                    filter === f
                      ? 'bg-white dark:bg-surface-700 text-primary-700 dark:text-primary-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {f === 'published' ? 'Upcoming' : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-4" />
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Vote size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-display font-bold text-slate-500 dark:text-slate-400 mb-2">No elections found</h3>
            <p className="text-slate-400 dark:text-slate-500">Try a different filter or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(election => (
              <ElectionCard key={election.id} election={election} />
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="py-24 bg-white dark:bg-surface-900">
        <div className="page-container">
          <div className="text-center mb-14">
            <h2 className="section-title mb-4">Why VoteSecure?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              Built with the same principles governments use, made accessible for everyone.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="group p-6 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-950 transition-all duration-300">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
                  {icon}
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 page-container">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-surface-900 rounded-3xl p-12 text-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl translate-x-32 -translate-y-32" />
          <div className="relative">
            <h2 className="text-4xl font-display font-bold text-white mb-4">Ready to run your first election?</h2>
            <p className="text-primary-200 mb-8 max-w-xl mx-auto">Join thousands of organizations already using VoteSecure. It's free to start.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/auth/register" className="btn-accent px-8 py-4">
                Get Started Free <ChevronRight size={18} />
              </Link>
              <Link to="/auth/login" className="btn-secondary px-8 py-4 bg-white/10 text-white border-white/20 hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/20">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="page-container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-accent-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">V</span>
            </div>
            <span className="font-display font-bold text-slate-700 dark:text-slate-300">VoteSecure</span>
          </div>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} VoteSecure. Built for secure, transparent elections.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
