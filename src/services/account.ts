import { supabase } from '@/plugins/supabase'

export async function depositToAccount(userId: string, amount: number): Promise<{ success: boolean; message?: string }> {
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

  return { success: true }
} 