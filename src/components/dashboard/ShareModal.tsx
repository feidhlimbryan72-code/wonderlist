import React, { useState } from 'react'
import { useShares } from '../../hooks/useQueries'
import type { List } from '../../types'
import { X, Mail, UserPlus, Trash2, Clock, Check } from 'lucide-react'

interface ShareModalProps {
  list: List
  onClose: () => void
}

export const ShareModal: React.FC<ShareModalProps> = ({ list, onClose }) => {
  const { shares, inviteUser, removeShare } = useShares(list.id)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    if (!email.trim()) return

    setLoading(true)
    try {
      await inviteUser(email.trim())
      setSuccess(`Invitation sent to ${email.trim()}!`)
      setEmail('')
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (shareId: string, userEmail: string) => {
    if (confirm(`Are you sure you want to stop sharing this list with ${userEmail}?`)) {
      try {
        await removeShare(shareId)
      } catch (err) {
        alert('Failed to remove share.')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/95 border border-white/20 dark:border-white/5 rounded-2xl shadow-2xl p-6 overflow-hidden animate-fade-in text-slate-800 dark:text-white backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold tracking-tight">Share "{list.name}"</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Collaborators can view and edit tasks in real-time</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="space-y-3 mb-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-600 dark:text-green-400">
              {success}
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collaborator@example.com"
                required
                className="w-full pl-9.5 pr-4 py-2.5 bg-slate-100/55 dark:bg-slate-800/40 border border-slate-300/40 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder-slate-400 transition-all text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center font-medium shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {/* Collaborators List */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Active Members
          </h4>
          
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {/* Owner Row */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-sm border border-slate-200/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold uppercase text-xs">
                  {list.owner?.full_name?.charAt(0) || list.owner?.email.charAt(0) || 'O'}
                </div>
                <div>
                  <p className="font-semibold text-xs leading-none">{list.owner?.full_name || 'Owner'}</p>
                  <p className="text-[10px] text-slate-400 leading-normal">{list.owner?.email}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
                Owner
              </span>
            </div>

            {/* Invited Collaborators */}
            {shares.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs dark:text-slate-500">
                No collaborators yet. Share the list to work together!
              </div>
            ) : (
              shares.map((share) => (
                <div 
                  key={share.id} 
                  className="flex items-center justify-between p-3 bg-slate-50/70 dark:bg-white/5 rounded-xl text-sm border border-slate-200/20 group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium uppercase text-xs">
                      {share.invited_email.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-xs leading-none break-all">{share.invited_email}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {share.status === 'pending' ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span className="text-[9px] text-amber-500 font-semibold">Pending Invite</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-green-500" />
                            <span className="text-[9px] text-green-500 font-semibold">Collaborating</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(share.id, share.invited_email)}
                    className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
                    title="Remove collaborator"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
