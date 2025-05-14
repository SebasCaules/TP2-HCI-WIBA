import { supabase } from '@/plugins/supabase'

export interface Card {
  id: string
  user_id: string
  brand: string
  number_last4: string
  expiry: string
  holder: string
  created_at: string
}

export async function getCards(userId: string): Promise<Card[]> {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching cards:', error)
    return []
  }

  return data || []
}

export async function addCard(card: Omit<Card, 'id' | 'created_at'>): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('cards')
    .insert(card)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}

export async function deleteCard(cardId: string): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
} 