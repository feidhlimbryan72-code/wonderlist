import React, { useState, useEffect } from 'react'
import type { Task } from '../../types'
import { useTasks, useListMembers } from '../../hooks/useQueries'
import { X, Calendar, Bell, Trash2, CheckSquare, Square, FileText, Clock, User } from 'lucide-react'

interface TaskDetailPanelProps {
  task: Task
  listId: string
  onClose: () => void
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ task, listId, onClose }) => {
  const { updateTask, deleteTask } = useTasks(listId)
  const { members } = useListMembers(listId)

  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes || '')
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.substring(0, 10) : '')
  const [reminderAt, setReminderAt] = useState(task.reminder_at ? task.reminder_at.substring(0, 16) : '')

  // Sync state with selected task
  useEffect(() => {
    setTitle(task.title)
    setNotes(task.notes || '')
    setDueDate(task.due_date ? task.due_date.substring(0, 10) : '')
    setReminderAt(task.reminder_at ? task.reminder_at.substring(0, 16) : '')
  }, [task])

  const handleTitleBlur = async () => {
    if (title.trim() && title.trim() !== task.title) {
      try {
        await updateTask({ taskId: task.id, updates: { title: title.trim() } })
      } catch (err) {
        alert('Failed to update task title')
      }
    }
  }

  const handleNotesBlur = async () => {
    if (notes !== (task.notes || '')) {
      try {
        await updateTask({ taskId: task.id, updates: { notes: notes.trim() || null } })
      } catch (err) {
        alert('Failed to update notes')
      }
    }
  }

  const handleDueDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDueDate(value)
    try {
      await updateTask({ 
        taskId: task.id, 
        updates: { due_date: value ? new Date(value).toISOString() : null } 
      })
    } catch (err) {
      alert('Failed to update due date')
    }
  }

  const handleReminderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setReminderAt(value)
    try {
      await updateTask({ 
        taskId: task.id, 
        updates: { reminder_at: value ? new Date(value).toISOString() : null } 
      })
    } catch (err) {
      alert('Failed to update reminder')
    }
  }

  const handleAssigneeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null
    try {
      await updateTask({
        taskId: task.id,
        updates: { assigned_to: value }
      })
    } catch (err) {
      alert('Failed to update assignee')
    }
  }

  const handleToggleComplete = async () => {
    try {
      await updateTask({ 
        taskId: task.id, 
        updates: { is_completed: !task.is_completed } 
      })
    } catch (err) {
      alert('Failed to update task status')
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(task.id)
        onClose()
      } catch (err) {
        alert('Failed to delete task')
      }
    }
  }

  // Format created date
  const createdDate = new Date(task.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col text-slate-900 dark:text-white">
      
      {/* Detail Header */}
      <div className="p-4 border-b border-slate-200/20 dark:border-white/5 flex items-center justify-between">
        <button
          onClick={handleToggleComplete}
          className="flex items-center gap-2 hover:bg-slate-200/50 dark:hover:bg-white/5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          {task.is_completed ? (
            <>
              <CheckSquare className="w-4 h-4 text-green-500" />
              <span>Mark Uncompleted</span>
            </>
          ) : (
            <>
              <Square className="w-4 h-4 text-slate-400" />
              <span>Mark Completed</span>
            </>
          )}
        </button>

        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4.5 h-4.5 text-slate-500" />
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Title Editor */}
        <div className="space-y-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className={`w-full bg-transparent border-0 focus:ring-0 text-lg font-bold p-0 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none ${task.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}
            placeholder="Rename task..."
          />
        </div>

        {/* Due Date Section */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>Due Date</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={handleDueDateChange}
            className="w-full px-3 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border border-slate-300/40 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white text-xs transition-all"
          />
        </div>

        {/* Assignee Section */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-purple-500" />
            <span>Assign To</span>
          </label>
          <select
            value={task.assigned_to || ''}
            onChange={handleAssigneeChange}
            className="w-full px-3 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border border-slate-300/40 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-800 dark:text-white text-xs transition-all cursor-pointer"
          >
            <option value="" className="text-slate-800 dark:text-white">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id} className="text-slate-800 dark:text-white">
                {member.full_name || member.email}
              </option>
            ))}
          </select>
        </div>

        {/* Reminder Section */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>Reminder Time</span>
          </label>
          <input
            type="datetime-local"
            value={reminderAt}
            onChange={handleReminderChange}
            className="w-full px-3 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border border-slate-300/40 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-white text-xs transition-all"
          />
        </div>

        {/* Notes Section */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span>Notes</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add a note..."
            rows={6}
            className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white text-xs transition-all resize-none placeholder-slate-400"
          />
        </div>

      </div>

      {/* Detail Footer */}
      <div className="p-4 border-t border-slate-200/20 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/2">
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Created {createdDate}
        </span>

        <button
          onClick={handleDelete}
          className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
          title="Delete Task"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
      </div>

    </div>
  )
}
