import React from 'react'
export const LoadingScreen = () => (
  <div className="fixed inset-0 bg-surface-950 flex items-center justify-center z-50">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 relative">
        <div className="spinner w-16 h-16"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-primary-500 font-display font-bold text-lg">V</span>
        </div>
      </div>
      <p className="text-slate-400 font-body">Loading VoteSecure...</p>
    </div>
  </div>
)

export default LoadingScreen
