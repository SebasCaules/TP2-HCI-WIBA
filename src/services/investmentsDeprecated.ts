import { supabase } from '@/plugins/supabase'
import { getAccountBalance, updateAccountBalance } from './accountDeprecated'

export interface Stock {
  id: number
  symbol: string
  name: string
  current_price: number
  updated_at: string
  price_history?: {
    date: string
    price: number
  }[]
}

export interface PortfolioItem {
  id: number
  user_id: string
  stock_id: number
  quantity: number
  average_price: number
  total_value: number
  stock?: Stock
  variation_percentage: number
}

export interface InvestmentTransaction {
  id: number
  user_id: string
  stock_id: number
  type: 'buy' | 'sell'
  quantity: number
  price_at_transaction: number
  total_value: number
  created_at: string
}

export const getStocks = async (): Promise<Stock[]> => {
  const { data, error } = await supabase
    .from('stocks')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching stocks:', error)
    throw error
  }

  return data || []
}

export const getPortfolio = async (userId: string): Promise<PortfolioItem[]> => {
  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      *,
      stock:stocks(*)
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching portfolio:', error)
    throw error
  }

  return (data || []).map((item: any) => {
    const variation = item.stock && item.average_price
      ? ((item.stock.current_price - item.average_price) / item.average_price) * 100
      : 0
    const totalValue = (item.total_value != null)
      ? item.total_value
      : (item.quantity * (item.stock?.current_price ?? 0))
    return {
      id: item.id,
      user_id: item.user_id,
      stock_id: item.stock_id,
      quantity: item.quantity,
      average_price: item.average_price,
      total_value: totalValue,
      stock: item.stock,
      variation_percentage: variation
    }
  })
}

export const getStockPriceHistory = async (stockId: number): Promise<{ date: string; price: number }[]> => {
  const { data, error } = await supabase
    .from('stock_price_history')
    .select('*')
    .eq('stock_id', stockId)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching price history:', error)
    throw error
  }

  return data || []
}

export const performInvestmentTransaction = async (
  userId: string,
  stockId: number,
  type: 'buy' | 'sell',
  quantity: number,
  amount: number
): Promise<void> => {
  try {
    // Validate type and quantity
    if (!['buy', 'sell'].includes(type)) throw new Error('Tipo de transacción inválido')
    quantity = typeof quantity === 'string' ? parseFloat(quantity) : quantity
    if (isNaN(quantity) || quantity <= 0) throw new Error('Cantidad inválida')

    // Get current stock price
    const { data: stockData, error: stockError } = await supabase
      .from('stocks')
      .select('current_price')
      .eq('id', stockId)
      .single()

    if (stockError || !stockData) {
      console.error('[performInvestmentTransaction] Error fetching stock price', stockError)
      throw new Error('Error fetching stock price')
    }

    const currentPrice = stockData.current_price

    // Validate balance for buy transactions
    if (type === 'buy') {
      const balance = await getAccountBalance(userId)
      if (balance < amount) {
        throw new Error('Saldo insuficiente')
      }
    }

    // Start transaction
    const insertObj = {
      user_id: userId,
      stock_id: stockId,
      transaction_type: type,
      quantity,
      price_at_transaction: parseFloat(currentPrice)
    }

    const { data: transaction, error: transactionError } = await supabase
      .from('investment_transactions')
      .insert(insertObj)
      .select()
      .single()

    if (transactionError) {
      console.error('[performInvestmentTransaction] Error creating transaction', transactionError)
      throw new Error('Error creating transaction')
    }

    // Update portfolio
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('stock_id', stockId)
      .single()

    if (portfolioError && portfolioError.code !== 'PGRST116') {
      console.error('[performInvestmentTransaction] Error fetching portfolio', portfolioError)
      throw new Error('Error fetching portfolio')
    }

    if (portfolioData) {
      // Update existing position
      const newQuantity = type === 'buy'
        ? portfolioData.quantity + quantity
        : portfolioData.quantity - quantity

      if (newQuantity < 0) {
        throw new Error('Cantidad insuficiente de cuotapartes')
      }

      const { error: updateError } = await supabase
        .from('portfolios')
        .update({
          quantity: newQuantity,
          average_price: type === 'buy'
            ? ((portfolioData.average_price * portfolioData.quantity) + (currentPrice * quantity)) / newQuantity
            : portfolioData.average_price
        })
        .eq('id', portfolioData.id)

      if (updateError) {
        throw new Error('Error updating portfolio')
      }
    } else if (type === 'buy') {
      // Create new position
      const { error: insertError } = await supabase
        .from('portfolios')
        .insert({
          user_id: userId,
          stock_id: stockId,
          quantity,
          average_price: currentPrice
        })

      if (insertError) {
        throw new Error('Error creating portfolio position')
      }
    } else {
      throw new Error('No tienes cuotapartes para vender')
    }

    // Update account balance
    const balanceChange = type === 'buy' ? -amount : amount
    const updateBalanceResult = await updateAccountBalance(userId, balanceChange)
  } catch (error: any) {
    console.error('Investment transaction error:', error)
    throw error
  }
}

export async function fetchUserInvestments(userId: string) {
  type PortfolioRow = {
    stock_id: number;
    quantity: number;
    average_price: number;
    stock: {
      name: string;
      symbol: string;
      current_price: number;
    };
  };

  const { data, error } = await supabase
    .from('portfolios')
    .select(`
      stock_id,
      quantity,
      average_price,
      stock (
        name,
        symbol,
        current_price
      )
    `)
    .eq('user_id', userId)
    .gt('quantity', 0)

  if (error) throw error

  return (data as unknown as PortfolioRow[]).map((row) => {
    const totalValue = row.quantity * row.stock.current_price
    const variation = row.stock.current_price - row.average_price
    const variationPercent = (variation / row.average_price) * 100

    return {
      symbol: row.stock.symbol,
      name: row.stock.name,
      quantity: row.quantity,
      price: row.stock.current_price,
      variation: variation.toFixed(2),
      variationPercent: variationPercent.toFixed(2),
      totalValue: totalValue.toFixed(2)
    }
  })
}

// Llama a la función SQL almacenada 'update_prices'
export async function updateStockPrices() {
  const { error } = await supabase.rpc('update_prices')

  if (error) {
    console.error('Error al actualizar precios:', error.message)
    return false
  }

  return true
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
    .from('portfolios')
    .update({ quantity: quantity })
    .eq('user_id', userId)
    .eq('stock_id', stockId)

  if (error) {
    console.error('Error al actualizar cartera:', error.message)
    return false
  }

  return data || null
}

export async function validateInvestmentAmount(userId: string, amount: number): Promise<{ valid: boolean; message?: string }> {
  const balance = await getAccountBalance(userId)
  if (balance < amount) {
    return {
      valid: false,
      message: `Saldo insuficiente. Saldo disponible: $${balance.toFixed(2)}`
    }
  }
  return { valid: true }
}
