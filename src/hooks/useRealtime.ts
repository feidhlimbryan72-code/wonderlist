import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export const useRealtimeSubscription = (activeListId: string | undefined) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // 1. Subscribe to Task changes
    const taskChannel = supabase
      .channel('tasks-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          // Determine which list was affected
          const listId = (payload.new as any)?.list_id || (payload.old as any)?.list_id
          if (listId) {
            queryClient.invalidateQueries({ queryKey: ['tasks', listId] })
            
            // If the user currently has the updated task details open, we want to make sure
            // we refresh any relevant task details queries if we separate them
          }
        }
      )
      .subscribe()

    // 2. Subscribe to List changes (e.g. list renamed or deleted)
    const listChannel = supabase
      .channel('lists-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lists' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lists'] })
        }
      )
      .subscribe()

    // 3. Subscribe to Share changes (invitations, accepts, etc.)
    const shareChannel = supabase
      .channel('shares-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'list_shares' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['invitations', user.email?.toLowerCase()] })
          queryClient.invalidateQueries({ queryKey: ['lists', user.id] })
          
          const listId = (payload.new as any)?.list_id || (payload.old as any)?.list_id
          if (listId) {
            queryClient.invalidateQueries({ queryKey: ['shares', listId] })
          }
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(taskChannel)
      supabase.removeChannel(listChannel)
      supabase.removeChannel(shareChannel)
    }
  }, [activeListId, user, queryClient])
}
