import { supabase } from '@/plugins/supabase'

export interface Contact {
  id: string
  user_id: string
  name: string
  alias: string
}

export async function getContacts(userId: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching contacts:', error)
    return []
  }

  return data || []
}

export async function createContact(contact: Omit<Contact, 'id'>): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('contacts')
    .insert(contact)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}

export async function deleteContact(contactId: string): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
} 