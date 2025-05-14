import { supabase } from '@/plugins/supabase'

export interface Stock {
    id: number;
    symbol: string;
    name: string;
    current_price: number;
    updated_at: string;
  }
  
  export interface Portfolio {
    id: number;
    user_id: string;
    stock_id: number;
    quantity: number;
    average_price: number;
    stock?: Stock; // Optional joined relation
  }
  
  export interface InvestmentTransaction {
    id: number;
    user_id: string;
    stock_id: number;
    transaction_type: 'buy' | 'sell';
    quantity: number;
    price_at_transaction: number;
    total_value: number;
    created_at: string;
    stock?: Stock; // Optional joined relation
  }

// Llama a la función SQL almacenada 'update_prices'
export async function updateStockPrices() {
    const { error } = await supabase.rpc('update_prices')
  
    if (error) {
      console.error('Error al actualizar precios:', error.message)
      return false
    }
  
    console.log('Precios actualizados correctamente')
    return true
  }

  export async function getStocks() {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error al obtener acciones:', error.message)
        return []
      }

      return data || []
  }
  
  export async function getStockById(id: number) {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('id', id)
      .single()

      if (error) {
        console.error('Error al obtener acción por ID:', error.message)
        return null
      }
      
      return data || null
  }

  export async function getPortfolio(userId: string) {
    const { data, error } = await supabase
      .from('portfolio')
      .select('*')
      .eq('user_id', userId)

      if (error) {
        console.error('Error al obtener cartera:', error.message)
        return []
      }

      return data || []
  }
  
  export async function getInvestmentTransactions(userId: string) {
    const { data, error } = await supabase
      .from('investment_transactions')
      .select('*')
      .eq('user_id', userId)

      if (error) {
        console.error('Error al obtener transacciones de inversión:', error.message)
        return []
      }

      return data || [] 
  }

  export async function createInvestmentTransaction(transaction: InvestmentTransaction) {
    const { data, error } = await supabase
      .from('investment_transactions')
      .insert(transaction)

      if (error) {
        console.error('Error al crear transacción de inversión:', error.message)
        return false
      }     

      return data || null
  }

  export async function updatePortfolio(userId: string, stockId: number, quantity: number) {
    const { data, error } = await supabase
      .from('portfolio')
      .update({ quantity: quantity })
      .eq('user_id', userId)
      .eq('stock_id', stockId)

      if (error) {
        console.error('Error al actualizar cartera:', error.message)
        return false
      }

      return data || null
  }

  