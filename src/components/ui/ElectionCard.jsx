import React from 'react'
import { Clock, Users, CheckCircle, AlertCircle, XCircle, Edit3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import CountdownTimer from './CountdownTimer'
import { formatDistanceToNow, format } from 'date-fns'

export const StatusBadge = ({ status }) => {
  const configs = {
    active: { className: 'badge-active', icon: <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />, label: 'Active' },
    published: { className: 'badge-upcoming', icon: <Clock size={10} />, label: 'Upcoming' },
    completed: { className: 'badge-completed', icon: <CheckCircle size={10} />, label: 'Completed' },
    draft: { className: 'badge-draft', icon: <Edit3 size={10} />, label: 'Draft' },
    cancelled: { className: 'badge-rejected', icon: <XCircle size={10} />, label: 'Cancelled' },
    pending: { className: 'badge-pending', icon: <AlertCircle size={10} />, label: 'Pending' },
    approved: { className: 'badge-approved', icon: <CheckCircle size={10} />, label: 'Approved' },
    rejected: { className: 'badge-rejected', icon: <XCircle size={10} />, label: 'Rejected' },
  }
  const config = configs[status] || configs.draft
  return (
    <span className={config.className}>
      {config.icon}
      {config.label}
    </span>
  )
}

export const ElectionCard = ({ election, showCountdown = true }) => {
  const voterPercent = Math.round((election.registered_voters || 0) / election.max_voters * 100)

  return (
    <Link to={`/election/${election.id}`} className="card-gradient-border block p-6 hover:shadow-glow transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">
          {election.category || 'General'}
        </span>
        <StatusBadge status={election.status} />
      </div>
      
      <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
        {election.title}
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
        {election.description || 'No description provided.'}
      </p>

      {/* Voter progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span className="flex items-center gap-1"><Users size={11} /> {election.registered_voters || 0} registered</span>
          <span>of {election.max_voters}</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(voterPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Date / Countdown */}
      {election.status === 'active' && showCountdown ? (
        <CountdownTimer targetDate={election.end_date} compact />
      ) : (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {election.status === 'published'
            ? `Starts ${formatDistanceToNow(new Date(election.start_date), { addSuffix: true })}`
            : election.status === 'completed'
            ? `Ended ${format(new Date(election.end_date), 'MMM d, yyyy')}`
            : `Starts ${format(new Date(election.start_date), 'MMM d, yyyy')}`}
        </p>
      )}
    </Link>
  )
}
