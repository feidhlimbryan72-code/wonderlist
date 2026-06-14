import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { TaskView } from './TaskView'
import { TaskDetailPanel } from './TaskDetailPanel'
import { ShareModal } from './ShareModal'
import { AnalyticsModal } from './AnalyticsModal'
import { useLists, useTasks, usePendingInvites } from '../../hooks/useQueries'
import { useRealtimeSubscription } from '../../hooks/useRealtime'
import { useAuth } from '../../context/AuthContext'
import type { Task, ThemeBackground, BackgroundOption } from '../../types'
import { Image, CheckCircle, Moon, Sun, BellDot, X, Check } from 'lucide-react'
import { useReminders } from '../../hooks/useReminders'

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  { 
    id: 'wood', 
    name: 'Polished Wood', 
    class: 'bg-cover bg-center', 
    previewClass: 'bg-amber-800' 
  },
  { 
    id: 'mountain', 
    name: 'Mountain Peak', 
    class: 'bg-cover bg-center', 
    previewClass: 'bg-sky-700' 
  },
  { 
    id: 'sunset', 
    name: 'Warm Sunset', 
    class: 'bg-cover bg-center', 
    previewClass: 'bg-orange-400' 
  },
  { 
    id: 'forest', 
    name: 'Misty Forest', 
    class: 'bg-cover bg-center', 
    previewClass: 'bg-emerald-800' 
  },
  { 
    id: 'classic-blue', 
    name: 'Classic Blue', 
    class: 'bg-cover bg-center', 
    previewClass: 'bg-blue-600' 
  },
  { 
    id: 'charcoal', 
    name: 'Charcoal Dark', 
    class: 'bg-gradient-to-br from-slate-800 to-slate-950', 
    previewClass: 'bg-slate-900' 
  },
]

const BACKGROUND_IMAGES: Record<string, string> = {
  'wood': 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1920&q=80',
  'mountain': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
  'sunset': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
  'forest': 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
  'classic-blue': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80'
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { lists } = useLists()
  const { activeAlerts, dismissAlert } = useReminders()
  const { invitations, acceptInvite, declineInvite } = usePendingInvites()
  const [activeListId, setActiveListId] = useState<string | undefined>(undefined)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [showThemePanel, setShowThemePanel] = useState(false)

  const handleAcceptInvite = async (inviteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await acceptInvite(inviteId)
      const invite = invitations.find(i => i.id === inviteId)
      if (invite?.list_id) {
        setActiveListId(invite.list_id)
      }
    } catch (err: any) {
      alert('Failed to accept invitation: ' + (err.message || err))
    }
  }

  const handleDeclineInvite = async (inviteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await declineInvite(inviteId)
    } catch (err: any) {
      alert('Failed to decline invitation: ' + (err.message || err))
    }
  }
  
  const [bgTheme, setBgTheme] = useState<ThemeBackground>(() => {
    return (localStorage.getItem('wonderlist-bg') as ThemeBackground) || 'forest'
  })
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('wonderlist-dark-mode') === 'true'
  })

  // Set default active list on load
  useEffect(() => {
    if (lists.length > 0 && !activeListId) {
      setActiveListId(lists[0].id)
    }
  }, [lists, activeListId])

  // Subscribes to Postgres realtime updates on activeListId (and all lists/shares)
  useRealtimeSubscription(activeListId)

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('wonderlist-dark-mode', String(isDarkMode))
  }, [isDarkMode])

  const handleSelectBackground = (themeId: ThemeBackground) => {
    setBgTheme(themeId)
    localStorage.setItem('wonderlist-bg', themeId)
    setShowThemePanel(false)
  }

  const activeList = lists.find(l => l.id === activeListId)
  
  const userShare = activeList?.list_shares?.find(
    (s: any) => s.invited_email?.toLowerCase() === user?.email?.toLowerCase()
  )
  const userRole = activeList?.owner_id === user?.id 
    ? 'owner' 
    : (userShare?.role || 'viewer')
  
  // Clean up selected task if active list changes or tasks are updated
  const { tasks } = useTasks(activeListId)
  useEffect(() => {
    if (selectedTask) {
      const refreshedTask = tasks.find(t => t.id === selectedTask.id)
      if (refreshedTask) {
        setSelectedTask(refreshedTask)
      } else {
        setSelectedTask(null)
      }
    }
  }, [tasks])

  const bgStyle = BACKGROUND_IMAGES[bgTheme] 
    ? { backgroundImage: `url('${BACKGROUND_IMAGES[bgTheme]}')` }
    : undefined

  const activeBgClass = BACKGROUND_OPTIONS.find(b => b.id === bgTheme)?.class || 'bg-cover bg-center'

  return (
    <div 
      className={`min-h-screen h-screen flex overflow-hidden select-none transition-all duration-300 relative ${activeBgClass}`}
      style={bgStyle}
    >
      {/* Background Overlay for Soft Contrast */}
      <div className="absolute inset-0 bg-slate-950/30 dark:bg-black/60 pointer-events-none z-0"></div>

      {/* Main Sidebar */}
      <Sidebar
        activeListId={activeListId}
        setActiveListId={setActiveListId}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 z-10 relative">
        
        {/* Quick Toolbar (Dark Mode toggle, Theme Picker) */}
        <div className="absolute top-3 right-4 z-20 flex items-center gap-2">
          
          {/* Theme background button */}
          <div className="relative">
            <button
              onClick={() => setShowThemePanel(!showThemePanel)}
              className="p-2 bg-white/40 dark:bg-slate-900/40 hover:bg-white/70 dark:hover:bg-slate-900/70 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-white/5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Change Theme Background"
            >
              <Image className="w-4 h-4" />
            </button>

            {showThemePanel && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowThemePanel(false)}></div>
                <div className="absolute right-0 mt-2 z-40 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 p-3 rounded-2xl shadow-2xl w-48 text-slate-800 dark:text-white animate-fade-in backdrop-blur-md">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Backgrounds
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {BACKGROUND_OPTIONS.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => handleSelectBackground(bg.id)}
                        className={`group relative rounded-xl h-12 flex flex-col items-center justify-center border overflow-hidden cursor-pointer ${bgTheme === bg.id ? 'border-blue-600 scale-[1.03] ring-1 ring-blue-500/20' : 'border-slate-200 dark:border-white/5'}`}
                      >
                        {BACKGROUND_IMAGES[bg.id] ? (
                          <div 
                            className="absolute inset-0 bg-cover bg-center" 
                            style={{ backgroundImage: `url('${BACKGROUND_IMAGES[bg.id]}')` }}
                          />
                        ) : (
                          <div className={`absolute inset-0 ${bg.previewClass}`} />
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                        <span className="relative z-10 text-[9px] text-white font-bold leading-tight break-words text-center px-1">
                          {bg.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Dark Mode toggle button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-white/40 dark:bg-slate-900/40 hover:bg-white/70 dark:hover:bg-slate-900/70 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-white/5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {activeList ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Task View */}
            <TaskView
              list={activeList}
              onShareClick={() => setShowShareModal(true)}
              onAnalyticsClick={() => setShowAnalyticsModal(true)}
              onTaskClick={setSelectedTask}
              selectedTaskId={selectedTask?.id}
              onMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
            />

            {/* Task Details panel overlay/drawer */}
            {selectedTask && (
              <div className="fixed inset-y-0 right-0 z-40 lg:relative lg:z-10 shadow-2xl flex shrink-0 h-full animate-slide-in">
                <div className="absolute inset-0 bg-black/30 lg:hidden" onClick={() => setSelectedTask(null)}></div>
                <div className="relative z-10 h-full">
                  <TaskDetailPanel
                    task={selectedTask}
                    listId={activeList.id}
                    onClose={() => setSelectedTask(null)}
                    readOnly={userRole === 'viewer'}
                  />
                </div>
              </div>
            )}
          </div>
        ) : invitations.length > 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-800 dark:text-white relative z-10">
            <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative z-10 backdrop-blur-md animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-4 justify-center">
                <BellDot className="w-5 h-5 animate-pulse" />
                <span>Pending Invitations ({invitations.length})</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                You have been invited to collaborate on the following task lists. Accept to start sharing tasks!
              </p>
              
              <div className="space-y-3 max-h-72 overflow-y-auto text-left pr-1">
                {invitations.map((invite) => (
                  <div 
                    key={invite.id} 
                    className="p-4 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col gap-3.5 shadow-sm"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-950 dark:text-white leading-snug">
                        "{invite.list?.name}"
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Invited by <strong className="text-slate-700 dark:text-slate-300 font-semibold">{invite.list?.owner?.full_name || invite.list?.owner?.email}</strong>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleAcceptInvite(invite.id, e)}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button
                        onClick={(e) => handleDeclineInvite(invite.id, e)}
                        className="py-2 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400 relative z-10">
            <div className="p-4 bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/5 rounded-3xl mb-4 shadow-xl backdrop-blur-md">
              <CheckCircle className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold">Welcome to Festival Flags</h3>
            <p className="text-xs max-w-sm mt-1">
              Select an existing list from the sidebar, or create a brand new task list to get started.
            </p>
            <button
              onClick={() => setIsMobileOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all lg:hidden cursor-pointer"
            >
              Open Lists
            </button>
          </div>
        )}
      </main>

      {/* Share Modal popup */}
      {showShareModal && activeList && (
        <ShareModal
          list={activeList}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* Analytics Modal popup */}
      {showAnalyticsModal && activeList && (
        <AnalyticsModal
          list={activeList}
          onClose={() => setShowAnalyticsModal(false)}
        />
      )}

      {/* Floating In-App Reminder Alerts */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2.5 w-full max-w-sm px-4">
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className="w-full bg-slate-900/95 dark:bg-white/95 border border-amber-500/30 text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-slide-in backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 rounded-xl shrink-0">
                <BellDot className="w-4.5 h-4.5 animate-bounce" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider leading-none mb-1">
                  Reminder
                </p>
                <p className="text-xs font-semibold truncate leading-tight">
                  {alert.task.title}
                </p>
              </div>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="p-1 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-lg text-slate-400 dark:text-slate-500 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
