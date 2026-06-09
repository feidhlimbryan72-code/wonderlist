import React, { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { TaskView } from './TaskView'
import { TaskDetailPanel } from './TaskDetailPanel'
import { ShareModal } from './ShareModal'
import { useLists, useTasks } from '../../hooks/useQueries'
import { useRealtimeSubscription } from '../../hooks/useRealtime'
import type { Task, ThemeBackground, BackgroundOption } from '../../types'
import { Image, CheckCircle, Moon, Sun } from 'lucide-react'

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
  const { lists } = useLists()
  const [activeListId, setActiveListId] = useState<string | undefined>(undefined)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showThemePanel, setShowThemePanel] = useState(false)
  
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
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
            <div className="p-4 bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/5 rounded-3xl mb-4 shadow-xl backdrop-blur-md">
              <CheckCircle className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold">Welcome to Wonderlist</h3>
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
    </div>
  )
}
