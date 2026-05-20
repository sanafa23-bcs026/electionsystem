import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

const CountdownTimer = ({ targetDate, onEnd, label = 'Time Remaining', compact = false }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  function calculateTimeLeft() {
    const difference = new Date(targetDate) - new Date()
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      ended: false
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const t = calculateTimeLeft()
      setTimeLeft(t)
      if (t.ended && onEnd) onEnd()
    }, 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (timeLeft.ended) return (
    <div className="flex items-center gap-2 text-red-500 font-semibold">
      <Clock size={16} />
      <span>Election Ended</span>
    </div>
  )

  if (compact) return (
    <div className="flex items-center gap-1.5 text-sm font-mono font-semibold text-primary-600 dark:text-primary-400">
      <Clock size={14} />
      <span>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {String(timeLeft.hours).padStart(2,'0')}:{String(timeLeft.minutes).padStart(2,'0')}:{String(timeLeft.seconds).padStart(2,'0')}
      </span>
    </div>
  )

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ]

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Clock size={12} /> {label}
      </p>
      <div className="flex gap-2">
        {units.map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="bg-primary-600 text-white rounded-lg w-12 h-12 flex items-center justify-center font-mono font-bold text-lg shadow-glow">
              {String(value).padStart(2, '0')}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CountdownTimer
