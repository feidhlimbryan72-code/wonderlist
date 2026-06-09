import React, { useState } from 'react'
import type { List, Task } from '../../types'
import { useTasks } from '../../hooks/useQueries'
import { useAuth } from '../../context/AuthContext'
import { 
  Plus, Calendar, Bell, ChevronDown, 
  ChevronRight, Circle, CheckCircle2, 
  FileText, Menu, Share2
} from 'lucide-react'

interface TaskViewProps {
  list: List
  onShareClick: () => void
  onTaskClick: (task: Task) => void
  selectedTaskId: string | undefined
  onMenuToggle: () => void
}

export const TaskView: React.FC<TaskViewProps> = ({
  list,
  onShareClick,
  onTaskClick,
  selectedTaskId,
  onMenuToggle,
}) => {
  const { user } = useAuth()
  const { tasks, createTask, updateTask } = useTasks(list.id)
  
  const [taskTitle, setTaskTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [showCompleted, setShowCompleted] = useState(true)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    try {
      await createTask({
        title: taskTitle.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      })
      setTaskTitle('')
      setDueDate('')
      setShowDatePicker(false)
    } catch (err) {
      alert('Failed to add task.')
    }
  }

  const handleToggleComplete = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await updateTask({
        taskId: task.id,
        updates: { is_completed: !task.is_completed }
      })
    } catch (err) {
      alert('Failed to update task status.')
    }
  }

  const activeTasks = tasks.filter(t => !t.is_completed)
  const completedTasks = tasks.filter(t => t.is_completed)
  const isOwner = list.owner_id === user?.id

  // Format date helper
  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const isOverdue = (dateStr: string | null, isCompleted: boolean) => {
    if (!dateStr || isCompleted) return false
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden text-slate-800 dark:text-white">
      
      {/* Task List Header */}
      <header className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuToggle}
            className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-lg text-slate-600 dark:text-slate-300 lg:hidden cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">
              {list.name}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isOwner ? 'Personal list' : `Shared by ${list.owner?.full_name || list.owner?.email}`}
            </p>
          </div>
        </div>

        {/* Share Button (Only Owner can manage invites) */}
        {isOwner && (
          <button
            onClick={onShareClick}
            className="px-3.5 py-2 bg-white/40 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 border border-slate-300/40 dark:border-white/5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer text-blue-600 dark:text-blue-400"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share List</span>
          </button>
        )}
      </header>

      {/* Tasks Scrolling Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Task Creation Form */}
        <form onSubmit={handleCreateTask} className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="p-1 text-slate-400">
              <Plus className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Add a task..."
              className="flex-1 bg-transparent border-0 focus:ring-0 p-0 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
            
            {/* Quick Due Date Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`p-1.5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer ${dueDate ? 'text-blue-500' : 'text-slate-400'}`}
                title="Set due date"
              >
                <Calendar className="w-4 h-4" />
              </button>
              
              {showDatePicker && (
                <div className="absolute right-0 top-10 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-3 rounded-xl shadow-xl">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white px-2 py-1 rounded text-xs focus:outline-none"
                  />
                  <div className="flex justify-end gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => { setDueDate(''); setShowDatePicker(false); }}
                      className="px-2 py-1 text-[10px] text-red-500 hover:bg-red-500/10 rounded cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(false)}
                      className="px-2 py-1 text-[10px] bg-blue-600 text-white rounded cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!taskTitle.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
            >
              Add
            </button>
          </div>
          
          {dueDate && (
            <div className="flex items-center gap-1.5 mt-2 ml-7 text-[10px] text-blue-500 font-semibold bg-blue-500/10 w-fit px-2 py-0.5 rounded-full">
              <Calendar className="w-3 h-3" />
              <span>Due: {formatDueDate(dueDate)}</span>
            </div>
          )}
        </form>

        {/* Active Tasks list */}
        <div className="space-y-1.5">
          {activeTasks.map((task) => {
            const isSelected = selectedTaskId === task.id
            const overdue = isOverdue(task.due_date, task.is_completed)

            return (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={`
                  w-full px-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-left text-sm flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer border border-slate-200 dark:border-slate-700/50 shadow-sm
                  ${isSelected 
                    ? 'border-blue-500/60 shadow-md ring-1 ring-blue-500/20 bg-slate-50 dark:bg-slate-950' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-750/50'}
                `}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Custom Checkbox */}
                  <button
                    onClick={(e) => handleToggleComplete(task, e)}
                    className="text-slate-400 hover:text-blue-500 transition-colors cursor-pointer shrink-0"
                  >
                    <Circle className="w-5 h-5" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate text-slate-900 dark:text-white">{task.title}</p>
                    
                    {/* Meta info row */}
                    <div className="flex items-center gap-2 mt-1">
                      {task.due_date && (
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${overdue ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>{formatDueDate(task.due_date)}</span>
                        </span>
                      )}
                      {task.reminder_at && (
                        <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">
                          <Bell className="w-3 h-3 shrink-0" />
                          <span>Remind</span>
                        </span>
                      )}
                      {task.notes && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <FileText className="w-3 h-3 shrink-0" />
                          <span>Note</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-slate-300 dark:text-slate-700">
                  <ChevronRight className="w-4.5 h-4.5" />
                </div>
              </div>
            )
          })}

          {activeTasks.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
              All tasks completed! Enjoy your day.
            </div>
          )}
        </div>

        {/* Completed Tasks Accordion */}
        {completedTasks.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer mb-2.5 uppercase tracking-wider"
            >
              {showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span>Completed ({completedTasks.length})</span>
            </button>

            {showCompleted && (
              <div className="space-y-1.5">
                {completedTasks.map((task) => {
                  const isSelected = selectedTaskId === task.id

                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`
                        w-full px-4 py-2.5 bg-white dark:bg-slate-800 rounded-xl text-left text-sm flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer border border-slate-200 dark:border-slate-700/50 opacity-75 shadow-sm
                        ${isSelected 
                          ? 'border-blue-500/60 bg-slate-50 dark:bg-slate-950' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-750/50'}
                      `}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Custom Checkbox */}
                        <button
                          onClick={(e) => handleToggleComplete(task, e)}
                          className="text-green-500 hover:text-slate-400 transition-colors cursor-pointer shrink-0"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate text-slate-600 dark:text-slate-400 line-through strikethrough-active">{task.title}</p>
                          
                          {/* Meta info row */}
                          <div className="flex items-center gap-2 mt-0.5">
                            {task.due_date && (
                              <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{formatDueDate(task.due_date)}</span>
                              </span>
                            )}
                            {task.notes && (
                              <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                                <FileText className="w-2.5 h-2.5" />
                                <span>Note</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-slate-300 dark:text-slate-700">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
