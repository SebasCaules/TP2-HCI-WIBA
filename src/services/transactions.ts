import { supabase } from '@/plugins/supabase'

export interface Transaction {
  id: string
  description: string
  user_id: string
  transaction_type: string
  amount: number
  recipient_id: string | null
  created_at: string
  card_company: string | null
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }

  return data || []
}

export async function getTransactionById(transactionId: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (error) {
    console.error('Error fetching transaction:', error)
    return null
  }

  return data
}

export async function createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('transactions')
    .insert(transaction)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
} 