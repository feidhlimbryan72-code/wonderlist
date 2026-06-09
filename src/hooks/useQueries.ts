import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { List, Task, ListShare } from '../types'
import { useAuth } from '../context/AuthContext'

// --- LIST HOOKS ---

export const useLists = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Fetch all lists where current user is owner OR accepted collaborator
  const { data: lists = [], isLoading } = useQuery<List[]>({
    queryKey: ['lists', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          owner:profiles!lists_owner_id_fkey(*),
          list_shares(invited_email, status)
        `)
        .order('created_at', { ascending: true })

      if (error) throw error

      const filtered = (data as any[]).filter(list => {
        if (list.owner_id === user.id) return true
        const userShare = list.list_shares?.find(
          (share: any) => share.invited_email?.toLowerCase() === user.email?.toLowerCase()
        )
        return userShare?.status === 'accepted'
      })

      return filtered as List[]
    },
    enabled: !!user,
  })

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Must be logged in')
      const { data, error } = await supabase
        .from('lists')
        .insert({ name, owner_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data as List
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
    },
  })

  // Update list mutation
  const updateListMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('lists')
        .update({ name })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as List
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
    },
  })

  // Delete list mutation
  const deleteListMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
    },
  })

  return {
    lists,
    isLoading,
    createList: createListMutation.mutateAsync,
    isCreating: createListMutation.isPending,
    updateList: updateListMutation.mutateAsync,
    deleteList: deleteListMutation.mutateAsync,
  }
}

// --- TASK HOOKS ---

export const useTasks = (listId: string | undefined) => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Fetch tasks for current active list
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', listId],
    queryFn: async () => {
      if (!listId) return []
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as Task[]
    },
    enabled: !!listId && !!user,
  })

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async ({ title, dueDate, reminderAt }: { title: string; dueDate?: string | null; reminderAt?: string | null }) => {
      if (!listId || !user) throw new Error('Missing listId or user')
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          list_id: listId,
          title,
          is_completed: false,
          due_date: dueDate || null,
          reminder_at: reminderAt || null,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      return data as Task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', listId] })
    },
  })

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      return data as Task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', listId] })
    },
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error
      return taskId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', listId] })
    },
  })

  return {
    tasks,
    isLoading,
    createTask: createTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
  }
}

// --- COLLABORATION HOOKS ---

export const useShares = (listId: string | undefined) => {
  const queryClient = useQueryClient()

  // Get active shares for the list
  const { data: shares = [], isLoading } = useQuery<ListShare[]>({
    queryKey: ['shares', listId],
    queryFn: async () => {
      if (!listId) return []
      const { data, error } = await supabase
        .from('list_shares')
        .select('*')
        .eq('list_id', listId)

      if (error) throw error
      return data as ListShare[]
    },
    enabled: !!listId,
  })

  // Invite user to list by email
  const inviteUserMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!listId) throw new Error('Missing listId')
      const normalizedEmail = email.trim().toLowerCase()

      const { data, error } = await supabase
        .from('list_shares')
        .insert({
          list_id: listId,
          invited_email: normalizedEmail,
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('This list is already shared with this email.')
        }
        throw error
      }
      return data as ListShare
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', listId] })
    },
  })

  // Cancel/Remove share mutation
  const removeShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase
        .from('list_shares')
        .delete()
        .eq('id', shareId)

      if (error) throw error
      return shareId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', listId] })
    },
  })

  return {
    shares,
    isLoading,
    inviteUser: inviteUserMutation.mutateAsync,
    removeShare: removeShareMutation.mutateAsync,
  }
}

// --- INVITATION HOOKS ---

export const usePendingInvites = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Fetch pending list invitations for current user email
  const { data: invitations = [], isLoading } = useQuery<ListShare[]>({
    queryKey: ['invitations', user?.email],
    queryFn: async () => {
      if (!user?.email) return []
      const { data, error } = await supabase
        .from('list_shares')
        .select(`
          *,
          list:lists(
            *,
            owner:profiles!lists_owner_id_fkey(*)
          )
        `)
        .eq('invited_email', user.email.toLowerCase())
        .eq('status', 'pending')

      if (error) throw error
      return data as any[]
    },
    enabled: !!user?.email,
  })

  // Accept invitation mutation
  const acceptInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { data, error } = await supabase
        .from('list_shares')
        .update({ status: 'accepted' })
        .eq('id', inviteId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })

  // Decline/Reject invitation mutation
  const declineInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('list_shares')
        .delete()
        .eq('id', inviteId)

      if (error) throw error
      return inviteId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })

  return {
    invitations,
    isLoading,
    acceptInvite: acceptInviteMutation.mutateAsync,
    declineInvite: declineInviteMutation.mutateAsync,
  }
}
