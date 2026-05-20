import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { ArrowLeft, Trophy, Download, Users, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const COLORS = ['#6366f1', '#f97316', '#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#14b8a6', '#8b5cf6']

const ElectionResults = () => {
  const { id: electionId } = useParams()
  const navigate = useNavigate()
  const [election, setElection] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [voterCount, setVoterCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [electionId])

  const fetchData = async () => {
    const [{ data: el }, { data: cands }, { count }] = await Promise.all([
      supabase.from('elections').select('*').eq('id', electionId).single(),
      supabase.from('candidates').select('*').eq('election_id', electionId).order('vote_count', { ascending: false }),
      supabase.from('voter_registrations').select('*', { count: 'exact', head: true }).eq('election_id', electionId)
    ])
    setElection(el)
    setCandidates(cands || [])
    setVoterCount(count || 0)
    setLoading(false)
  }

  const totalVotes = candidates.reduce((s, c) => s + (c.vote_count || 0), 0)
  const winner = candidates[0]
  const turnout = voterCount > 0 ? Math.round(totalVotes / voterCount * 100) : 0

  const downloadPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFillColor(99, 102, 241)
    doc.rect(0, 0, 210, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('VoteSecure — Election Results', 14, 20)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(election?.title || '', 14, 42)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 50)
    doc.text(`Status: ${election?.status}`, 14, 56)

    // Stats
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', 14, 68)
    doc.autoTable({
      startY: 72,
      head: [['Metric', 'Value']],
      body: [
        ['Total Registered Voters', voterCount],
        ['Total Votes Cast', totalVotes],
        ['Voter Turnout', `${turnout}%`],
        ['Winner', winner?.name || 'TBD'],
        ['Winning Votes', winner?.vote_count || 0],
      ],
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [99, 102, 241] }
    })

    // Results table
    doc.text('Candidate Results', 14, doc.lastAutoTable.finalY + 12)
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Rank', 'Candidate', 'Designation', 'Votes', 'Percentage']],
      body: candidates.map((c, i) => [
        i + 1,
        c.name,
        c.designation || '—',
        c.vote_count || 0,
        totalVotes > 0 ? `${Math.round(c.vote_count / totalVotes * 100)}%` : '0%'
      ]),
      styles: { font: 'helvetica', fontSize: 10 },
      headStyles: { fillColor: [99, 102, 241] }
    })

    doc.save(`election-results-${electionId.slice(0, 8)}.pdf`)
  }

  if (loading) return <div className="flex justify-center py-20"><div className="spinner w-10 h-10" /></div>

  return (
    <div className="space-y-6 animate-in max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/creator')} className="btn-ghost p-2 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Election Results</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm truncate">{election?.title}</p>
        </div>
        <button onClick={downloadPDF} className="btn-primary">
          <Download size={16} /> Download PDF
        </button>
      </div>

      {/* Winner card */}
      {winner && totalVotes > 0 && (
        <div className="card p-6 bg-gradient-to-br from-primary-600 to-accent-600 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20" />
          <div className="relative flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Trophy size={32} className="text-yellow-300" />
            </div>
            <div>
              <p className="text-primary-200 text-sm font-semibold uppercase tracking-wider mb-1">🏆 Winner</p>
              <h2 className="text-3xl font-display font-bold">{winner.name}</h2>
              <p className="text-primary-200">{winner.designation} · {winner.vote_count} votes ({totalVotes > 0 ? Math.round(winner.vote_count / totalVotes * 100) : 0}%)</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Users size={18} />, label: 'Registered Voters', value: voterCount, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { icon: <TrendingUp size={18} />, label: 'Votes Cast', value: totalVotes, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
          { icon: <Users size={18} />, label: 'Turnout', value: `${turnout}%`, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>{icon}</div>
            <div>
              <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card p-6">
        <h2 className="font-display font-bold text-slate-900 dark:text-white mb-4">Vote Distribution</h2>
        {totalVotes === 0 ? (
          <p className="text-slate-400 text-sm py-8 text-center">No votes cast yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={candidates.map((c, i) => ({ name: c.name, votes: c.vote_count || 0, fill: COLORS[i % COLORS.length] }))}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="votes" radius={[6, 6, 0, 0]}>
                {candidates.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pie chart */}
      {totalVotes > 0 && (
        <div className="card p-6">
          <h2 className="font-display font-bold text-slate-900 dark:text-white mb-4">Vote Share</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={candidates.map((c, i) => ({ name: c.name, value: c.vote_count || 0, fill: COLORS[i % COLORS.length] }))}
                cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {candidates.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-display font-bold text-slate-900 dark:text-white">Detailed Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['Rank', 'Candidate', 'Designation', 'Votes', 'Percentage', 'Progress'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {candidates.map((c, i) => {
                const pct = totalVotes > 0 ? Math.round(c.vote_count / totalVotes * 100) : 0
                return (
                  <tr key={c.id} className={`hover:bg-surface-50 dark:hover:bg-surface-800 ${i === 0 && totalVotes > 0 ? 'bg-primary-50/50 dark:bg-primary-950/30' : ''}`}>
                    <td className="px-4 py-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-sm">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{c.designation || '—'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{c.vote_count || 0}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{pct}%</td>
                    <td className="px-4 py-3 w-32">
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ElectionResults
