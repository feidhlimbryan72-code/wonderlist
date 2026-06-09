import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type { Task } from '../types'

export interface ReminderAlert {
  id: string
  task: Task
  dismissed: boolean
}

export const useReminders = () => {
  const { user } = useAuth()
  const [activeAlerts, setActiveAlerts] = useState<ReminderAlert[]>([])

  // 1. Fetch active tasks with reminders
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['reminder-tasks', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .not('reminder_at', 'is', null)
        .eq('is_completed', false)

      if (error) throw error
      return data as Task[]
    },
    refetchInterval: 15000, // Refetch every 15 seconds to stay updated
    enabled: !!user,
  })

  // Request browser Notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  // Programmatic synth sound using Web Audio API (C5 -> E5 chime)
  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      
      const audioCtx = new AudioContextClass()
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        
        osc.type = 'sine'
        osc.frequency.value = freq
        
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.2, start + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
        
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        
        osc.start(start)
        osc.stop(start + duration)
      }

      const now = audioCtx.currentTime
      playTone(523.25, now, 0.3) // C5
      playTone(659.25, now + 0.15, 0.45) // E5
    } catch (e) {
      console.warn('AudioContext failed to play sound:', e)
    }
  }

  // 2. Scan tasks for reminders that have passed
  useEffect(() => {
    if (!user || tasks.length === 0) return

    const interval = setInterval(() => {
      const now = new Date()
      
      tasks.forEach((task) => {
        if (!task.reminder_at || task.is_completed) return
        
        const reminderTime = new Date(task.reminder_at)
        
        // Trigger if:
        // 1. Current time has passed reminder time
        // 2. It passed recently (within the last 15 minutes, to prevent flooding on page load with old tasks)
        const timeDiff = now.getTime() - reminderTime.getTime()
        const isRecent = timeDiff >= 0 && timeDiff < 15 * 60 * 1000

        if (isRecent) {
          const storageKey = `reminder_triggered_${task.id}_${task.reminder_at}`
          if (!localStorage.getItem(storageKey)) {
            localStorage.setItem(storageKey, 'true')
            
            // Play sound
            playChime()

            // Trigger System Notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(`Task Reminder`, {
                body: `Don't forget: ${task.title}`,
                tag: task.id,
              })
            }

            // Trigger In-App Alert
            setActiveAlerts((prev) => [
              ...prev,
              { id: `${task.id}_${Date.now()}`, task, dismissed: false },
            ])
          }
        }
      })
    }, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [tasks, user])

  const dismissAlert = (alertId: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }

  return {
    activeAlerts,
    dismissAlert,
  }
}
