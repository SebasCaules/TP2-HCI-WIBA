import { supabase } from '@/plugins/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function depositToAccount(userId: string, amount: number, cardLast4?: string): Promise<{ success: boolean; message?: string }> {
  // Fetch the current account
  const { data: account, error: fetchError } = await supabase
    .from('accounts')
    .select('id, balance')
    .eq('user_id', userId)
    .single();

  if (fetchError || !account) {
    return { success: false, message: fetchError?.message || 'Cuenta no encontrada' }
  }

  // Calculate new balance
  const newBalance = Number(account.balance) + Number(amount);

  // Update the balance
  const { error: updateError } = await supabase
    .from('accounts')
    .update({ balance: newBalance })
    .eq('id', account.id);

  if (updateError) {
    return { success: false, message: updateError.message }
  }

  // Insert transaction record
  const { error: transactionError } = await supabase
    .from('transactions')
    .insert({
      id: uuidv4(),
      description: cardLast4 ? `Depósito desde tarjeta *${cardLast4}` : 'Depósito',
      user_id: userId,
      transaction_type: 'deposit',
      amount: amount,
      recipient_id: null,
      created_at: new Date()
    });

  if (transactionError) {
    console.error('Error inserting transaction:', transactionError);
    // We don't return error here since the deposit was successful
  }

  return { success: true }
} 