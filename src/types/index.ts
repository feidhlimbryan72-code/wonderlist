export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  updated_at: string | null
}

export interface List {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
  owner?: Profile
}

export interface ListShare {
  id: string
  list_id: string
  invited_email: string
  status: 'pending' | 'accepted'
  created_at: string
  list?: List
}

export interface Task {
  id: string
  list_id: string
  title: string
  is_completed: boolean
  due_date: string | null
  reminder_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type ThemeBackground = 'wood' | 'mountain' | 'sunset' | 'forest' | 'classic-blue' | 'charcoal';

export interface BackgroundOption {
  id: ThemeBackground
  name: string
  class: string
  previewClass: string
}
