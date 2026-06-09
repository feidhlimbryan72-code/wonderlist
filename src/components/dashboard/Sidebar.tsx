import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLists, usePendingInvites } from '../../hooks/useQueries'
import type { List } from '../../types'
import { 
  LogOut, Plus, ListTodo, Users, 
  Trash2, Edit3, Check, X, BellDot
} from 'lucide-react'

interface SidebarProps {
  activeListId: string | undefined
  setActiveListId: (id: string | undefined) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeListId,
  setActiveListId,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user, profile, signOut } = useAuth()
  const { lists, createList, updateList, deleteList } = useLists()
  const { invitations, acceptInvite, declineInvite } = usePendingInvites()
  
  const [newListName, setNewListName] = useState('')
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return
    try {
      const created = await createList(newListName.trim())
      setNewListName('')
      setActiveListId(created.id)
      setIsMobileOpen(false)
    } catch (err) {
      alert('Failed to create list.')
    }
  }

  const handleStartEdit = (list: List, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingListId(list.id)
    setEditName(list.name)
  }

  const handleSaveEdit = async (id: string, e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) return
    try {
      await updateList({ id, name: editName.trim() })
      setEditingListId(null)
    } catch (err) {
      alert('Failed to rename list.')
    }
  }

  const handleDeleteList = async (list: List, e: React.MouseEvent) => {
    e.stopPropagation()
    const isOwner = list.owner_id === user?.id
    const message = isOwner
      ? `Are you sure you want to delete "${list.name}"? This will delete all tasks inside it.`
      : `Are you sure you want to leave "${list.name}"?`

    if (confirm(message)) {
      try {
        await deleteList(list.id)
        if (activeListId === list.id) {
          setActiveListId(undefined)
        }
      } catch (err) {
        alert('Failed to delete list.')
      }
    }
  }

  const handleAcceptInvite = async (inviteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await acceptInvite(inviteId)
    } catch (err) {
      alert('Failed to accept invitation.')
    }
  }

  const handleDeclineInvite = async (inviteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await declineInvite(inviteId)
    } catch (err) {
      alert('Failed to decline invitation.')
    }
  }

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-72 
        glass-panel border-r border-slate-200/20 dark:border-white/5
        flex flex-col text-slate-800 dark:text-white
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* User Profile Header */}
        <div className="p-4 border-b border-slate-200/20 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 uppercase">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-semibold text-sm leading-tight truncate">
                {profile?.full_name || 'My Wonderlist'}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Invitations Section */}
        {invitations.length > 0 && (
          <div className="p-4 border-b border-slate-200/20 dark:border-white/5 bg-amber-500/5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2.5">
              <BellDot className="w-3.5 h-3.5 animate-pulse" />
              <span>Invitations ({invitations.length})</span>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {invitations.map((invite) => (
                <div 
                  key={invite.id} 
                  className="p-2.5 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-amber-500/20 text-xs flex flex-col gap-2"
                >
                  <div>
                    <span className="font-semibold">"{invite.list?.name}"</span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] mt-0.5">
                      Invited by {invite.list?.owner?.full_name || invite.list?.owner?.email}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => handleAcceptInvite(invite.id, e)}
                      className="flex-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-medium flex items-center justify-center gap-0.5 cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> Accept
                    </button>
                    <button
                      onClick={(e) => handleDeclineInvite(invite.id, e)}
                      className="py-1 px-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-medium cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lists Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            My Lists
          </div>

          {lists.map((list) => {
            const isSelected = activeListId === list.id
            const isOwner = list.owner_id === user?.id
            
            return (
              <div
                key={list.id}
                onClick={() => {
                  setActiveListId(list.id)
                  setIsMobileOpen(false)
                }}
                className={`
                  w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium flex items-center justify-between group cursor-pointer transition-all duration-150
                  ${isSelected 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15' 
                    : 'hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200'}
                `}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {!isOwner ? (
                    <Users className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-blue-500 dark:text-blue-400'}`} />
                  ) : (
                    <ListTodo className="w-4 h-4 shrink-0 opacity-70" />
                  )}

                  {editingListId === list.id ? (
                    <form 
                      onSubmit={(e) => handleSaveEdit(list.id, e)} 
                      onClick={(e) => e.stopPropagation()}
                      className="w-full"
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={(e) => handleSaveEdit(list.id, e)}
                        autoFocus
                        className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-0.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </form>
                  ) : (
                    <span className="truncate pr-2">{list.name}</span>
                  )}
                </div>

                {/* List Action Buttons (Hover Only or Select Only) */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  {isOwner && editingListId !== list.id && (
                    <button
                      onClick={(e) => handleStartEdit(list, e)}
                      className={`p-1 rounded-md transition-colors ${isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-300/50 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500'}`}
                      title="Rename"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteList(list, e)}
                    className={`p-1 rounded-md transition-colors ${isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-red-500/20 text-slate-400 dark:text-slate-500 hover:text-red-500'}`}
                    title={isOwner ? 'Delete List' : 'Leave List'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}

          {lists.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
              No lists yet. Create one below!
            </div>
          )}
        </div>

        {/* Bottom Create List Input */}
        <div className="p-4 border-t border-slate-200/20 dark:border-white/5">
          <form onSubmit={handleCreateList} className="relative">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Create new list..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border border-slate-300/40 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white placeholder-slate-400 text-xs transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

      </aside>
    </>
  )
}
