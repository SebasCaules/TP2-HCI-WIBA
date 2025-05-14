import { supabase } from '@/plugins/supabase'

export interface Bill {
  id: string
  user_id: string
  title: string
  provider: string
  amount: number
  due_date: string
  status: string
}

export async function getBills(userId: string): Promise<Bill[]> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching bills:', error)
    return []
  }

  return data || []
}

export async function createBill(bill: Omit<Bill, 'id'>): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('bills')
    .insert(bill)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}

export async function updateBillStatus(billId: string, status: string): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('bills')
    .update({ status })
    .eq('id', billId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
} 