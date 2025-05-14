import { supabase } from '@/plugins/supabase'

export interface User {
  id: string
  first_name: string
  last_name: string
  created_at: string
  username: string
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
} 