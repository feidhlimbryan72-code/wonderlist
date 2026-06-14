import React, { useState } from 'react'
import { useShares } from '../../hooks/useQueries'
import type { List, ListShare } from '../../types'
import { X, Mail, UserPlus, Trash2, Clock, Check, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface ShareModalProps {
  list: List
  onClose: () => void
}

export const ShareModal: React.FC<ShareModalProps> = ({ list, onClose }) => {
  const { user } = useAuth()
  const { shares, inviteUser, removeShare, updateShareRole } = useShares(list.id)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastInvitedEmail, setLastInvitedEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Determine the logged-in user's role on this list
  const userRole = list.owner_id === user?.id 
    ? 'owner' 
    : (shares.find(s => s.invited_email.toLowerCase() === user?.email?.toLowerCase())?.role || 'viewer')

  const canManageShares = userRole === 'owner' || userRole === 'admin'

  const canModifyRoleOf = (targetShare: ListShare) => {
    if (userRole === 'owner') return true
    if (userRole === 'admin') {
      // Admins can change roles of members or viewers, but not other admins
      return targetShare.role !== 'admin'
    }
    return false
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    if (!email.trim()) return
    if (!canManageShares) {
      setError('You do not have permission to invite collaborators.')
      return
    }

    setLoading(true)
    try {
      await inviteUser({ email: email.trim(), role })
      setSuccess(`Invitation sent to ${email.trim()}!`)
      setLastInvitedEmail(email.trim())
      setEmail('')
      setRole('member')
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

  const getMailtoLink = (invitedEmail: string) => {
    const subject = encodeURIComponent(`Invitation to collaborate on "${list.name}"`)
    const body = encodeURIComponent(
      `Hi,\n\n` +
      `I have invited you to collaborate on my task list "${list.name}" on the Festival Flags Task Tracker.\n\n` +
      `Please sign in or create an account at:\n` +
      `https://task-tracker.onrender.com\n\n` +
      `Once logged in, you will see the invitation notification banner at the top of your sidebar to accept it and start collaborating!\n\n` +
      `Best regards`
    )
    return `mailto:${invitedEmail}?subject=${subject}&body=${body}`
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

        {/* Invite Form / Permissions Alert */}
        {!canManageShares ? (
          <div className="p-3.5 bg-slate-100/55 dark:bg-white/5 border border-slate-200/20 dark:border-white/5 rounded-xl text-xs text-slate-500 dark:text-slate-400 text-center mb-6">
            Only list owners and admins can invite collaborators and manage roles.
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-3 mb-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            {success && lastInvitedEmail && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-600 dark:text-green-400 space-y-2 flex flex-col items-start">
                <p>{success}</p>
                <a
                  href={getMailtoLink(lastInvitedEmail)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-[11px] shadow-sm transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email Invitation Details</span>
                </a>
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
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="px-2 bg-slate-100/55 dark:bg-slate-800/40 border border-slate-300/40 dark:border-white/5 rounded-xl focus:outline-none text-xs text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
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
            <p className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-200/20 dark:border-white/5 leading-normal mt-3">
              <strong>Roles:</strong> Admins can manage tasks and users. Members can edit tasks. Viewers have read-only access.
            </p>
          </form>
        )}

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
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" /> Owner
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
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium uppercase text-xs shrink-0">
                      {share.invited_email.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs leading-none truncate break-all pr-2">{share.invited_email}</p>
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

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role Select Dropdown */}
                    {canManageShares && canModifyRoleOf(share) ? (
                      <select
                        value={share.role}
                        onChange={async (e) => {
                          try {
                            await updateShareRole({ shareId: share.id, role: e.target.value as any })
                          } catch (err) {
                            alert('Failed to update collaborator role.')
                          }
                        }}
                        className="text-[10px] bg-white dark:bg-slate-800 border border-slate-300/40 dark:border-white/5 rounded-lg px-2 py-1 font-semibold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-1 bg-slate-200/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-full capitalize">
                        {share.role}
                      </span>
                    )}

                    {/* Delete button (Only for admin/owner and if permitted) */}
                    {canManageShares && (share.invited_email.toLowerCase() !== user?.email?.toLowerCase()) && (
                      <button
                        onClick={() => handleRemove(share.id, share.invited_email)}
                        className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
                        title="Remove collaborator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
