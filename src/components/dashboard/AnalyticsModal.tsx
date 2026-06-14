import React from 'react'
import { useTasks, useListMembers } from '../../hooks/useQueries'
import type { List } from '../../types'
import { X, BarChart3, CheckSquare, Clock, AlertTriangle, Users, PieChart } from 'lucide-react'

interface AnalyticsModalProps {
  list: List
  onClose: () => void
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ list, onClose }) => {
  const { tasks, isLoading: loadingTasks } = useTasks(list.id)
  const { members, isLoading: loadingMembers } = useListMembers(list.id)

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.is_completed).length
  const pendingTasks = totalTasks - completedTasks

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Calculate Overdue Tasks
  const overdueTasks = tasks.filter(t => {
    if (t.is_completed || !t.due_date) return false
    const d = new Date(t.due_date)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return d < now
  }).length

  // Calculate Average Completion Time
  const completed = tasks.filter(t => t.is_completed)
  let avgCompletionText = 'N/A'
  if (completed.length > 0) {
    const totalMs = completed.reduce((sum, t) => {
      const duration = new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()
      return sum + Math.max(0, duration)
    }, 0)
    const avgMs = totalMs / completed.length
    
    const avgHours = avgMs / (1000 * 60 * 60)
    if (avgHours < 1) {
      const avgMinutes = avgMs / (1000 * 60)
      avgCompletionText = `${Math.round(avgMinutes)} mins`
    } else if (avgHours < 24) {
      avgCompletionText = `${avgHours.toFixed(1)} hrs`
    } else {
      const avgDays = avgHours / 24
      avgCompletionText = `${avgDays.toFixed(1)} days`
    }
  }

  // Workload Allocation
  const workload = members.map(m => {
    const totalAssigned = tasks.filter(t => t.assigned_to === m.id).length
    const activeAssigned = tasks.filter(t => t.assigned_to === m.id && !t.is_completed).length
    return {
      member: m,
      total: totalAssigned,
      active: activeAssigned
    }
  }).sort((a, b) => b.active - a.active)

  const unassignedActive = tasks.filter(t => !t.assigned_to && !t.is_completed).length
  const maxActiveWorkload = Math.max(...workload.map(w => w.active), unassignedActive, 1)

  const loading = loadingTasks || loadingMembers

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/5 rounded-3xl shadow-2xl p-6 overflow-hidden animate-fade-in text-slate-800 dark:text-white backdrop-blur-md max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">List Analytics</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Insights for "{list.name}"</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Completion Rate */}
              <div className="p-4 bg-slate-50 dark:bg-white/3 border border-slate-200/50 dark:border-white/5 rounded-2xl flex flex-col justify-between h-28 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completion Rate</span>
                  <PieChart className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{completionRate}%</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{completedTasks} of {totalTasks} tasks completed</p>
                </div>
              </div>

              {/* Card 2: Pending Tasks */}
              <div className="p-4 bg-slate-50 dark:bg-white/3 border border-slate-200/50 dark:border-white/5 rounded-2xl flex flex-col justify-between h-28 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Tasks</span>
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{pendingTasks}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Currently incomplete</p>
                </div>
              </div>

              {/* Card 3: Overdue Tasks */}
              <div className="p-4 bg-slate-50 dark:bg-white/3 border border-slate-200/50 dark:border-white/5 rounded-2xl flex flex-col justify-between h-28 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Overdue</span>
                  <AlertTriangle className={`w-4 h-4 ${overdueTasks > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                </div>
                <div>
                  <h4 className={`text-2xl font-bold ${overdueTasks > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{overdueTasks}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Deadlines missed</p>
                </div>
              </div>

              {/* Card 4: Avg Completion Time */}
              <div className="p-4 bg-slate-50 dark:bg-white/3 border border-slate-200/50 dark:border-white/5 rounded-2xl flex flex-col justify-between h-28 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Resolution</span>
                  <Clock className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-purple-600 dark:text-purple-400">{avgCompletionText}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Lead time per task</p>
                </div>
              </div>

            </div>

            {/* Workload Allocation Section */}
            <div className="p-5 bg-slate-50 dark:bg-white/3 border border-slate-200/50 dark:border-white/5 rounded-3xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-purple-500" />
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Resource Allocation (Workload Density)
                </h4>
              </div>

              <div className="space-y-4">
                {/* Loop Members */}
                {workload.map((w) => {
                  const percent = Math.round((w.active / maxActiveWorkload) * 100)
                  return (
                    <div key={w.member.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {w.member.full_name || w.member.email}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          {w.active} active task{w.active !== 1 ? 's' : ''} ({w.total} total)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-purple-600 dark:bg-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}

                {/* Unassigned row if any */}
                {unassignedActive > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400 italic">
                        Unassigned Tasks
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {unassignedActive} active task{unassignedActive !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-slate-400 dark:bg-slate-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((unassignedActive / maxActiveWorkload) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {totalTasks === 0 && (
                  <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                    Create tasks in this list to see workload metrics.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
