import { supabase } from '@/plugins/supabase'
import { v4 as uuidv4 } from 'uuid'

export const getAccountBalance = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching account balance:', error)
      throw error
    }

    return data?.balance || 0
  } catch (error) {
    console.error('Error in getAccountBalance:', error)
    return 0
  }
}

export const updateAccountBalance = async (userId: string, amount: number): Promise<boolean> => {
  try {
    // Get current balance
    const currentBalance = await getAccountBalance(userId)
    const newBalance = currentBalance + amount

    if (newBalance < 0) {
      throw new Error('Saldo insuficiente')
    }

    // Update balance
    const { error } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating account balance:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in updateAccountBalance:', error)
    throw error
  }
}

export const depositToAccount = async (
  userId: string,
  amount: number,
  cardLast4?: string,
  cardBrand?: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    // Update balance
    await updateAccountBalance(userId, amount)

    // Log transaction
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount,
        status: 'completed',
        card_last4: cardLast4,
        card_brand: cardBrand
      })

    if (error) {
      console.error('Error logging deposit transaction:', error)
      throw error
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in depositToAccount:', error)
    return {
      success: false,
      message: error.message || 'Error al procesar el depósito'
    }
  }
} 