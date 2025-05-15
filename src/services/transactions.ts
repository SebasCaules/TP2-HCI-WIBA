import { supabase } from '@/plugins/supabase'
import type { Transaction } from '@/types/types'

export async function getTransactions(userId: string): Promise<Transaction[]> {
  // Fetch all transactions where the user is either the sender or the recipient, ascending by date
  const { data: transactionsData, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .or(`user_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: true });

  if (transactionsError) {
    console.error('Error fetching transactions:', transactionsError)
    return []
  }

  if (!transactionsData) return [];

  // Gather all unique user IDs involved in the transactions
  const userIds = new Set<string>();
  transactionsData.forEach(tx => {
    if (tx.user_id) userIds.add(tx.user_id);
    if (tx.recipient_id) userIds.add(tx.recipient_id);
  });

  // Fetch user details for all involved users
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .in('id', Array.from(userIds));

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return [];
  }

  const usersMap = new Map((usersData || []).map(user => [user.id, user]));

  // Transform transactions: set amount sign and add sender/recipient names
  const transformedTransactions: Transaction[] = transactionsData.map(tx => {
    const isOutgoing = tx.user_id === userId;
    const recipient = tx.recipient_id ? usersMap.get(tx.recipient_id) : undefined;
    const sender = tx.user_id ? usersMap.get(tx.user_id) : undefined;
    let amount = Number(tx.amount);
    // If outgoing (user is sender), amount is negative; if incoming, positive
    if (tx.transaction_type === 'transfer') {
      amount = isOutgoing ? -Math.abs(amount) : Math.abs(amount);
    }
    // For deposits, always positive
    if (tx.transaction_type === 'deposit') {
      amount = Math.abs(amount);
    }
    // For withdrawals, always negative
    if (tx.transaction_type === 'withdraw') {
      amount = -Math.abs(amount);
    }
    return {
      ...tx,
      amount,
      recipient_name: recipient ? `${recipient.first_name} ${recipient.last_name}` : undefined,
      sender_name: sender ? `${sender.first_name} ${sender.last_name}` : undefined,
      recipient: recipient || undefined,
      sender: sender || undefined
    };
  });

  return transformedTransactions;
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