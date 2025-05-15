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


export async function performInvestmentTransaction(
  userId: string,
  stockId: number,
  type: 'buy' | 'sell',
  quantity: number,
  price: number
) {
  const totalValue = quantity * price

  // 1. Insertar en investment_transactions
  const { error: insertError } = await supabase
    .from('investment_transactions')
    .insert({
      user_id: userId,
      stock_id: stockId,
      transaction_type: type,
      quantity,
      price_at_transaction: price,
      total_value: totalValue
    })

  if (insertError) throw insertError

  // 2. Buscar si el usuario ya tiene el fondo en su portfolio
  const { data: portfolioRow, error: fetchError } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .eq('stock_id', stockId)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    // Error que no es "no hay fila encontrada"
    throw fetchError
  }

  if (type === 'buy') {
    if (portfolioRow) {
      // Calcular nuevo promedio ponderado
      const totalCuotapartes = parseFloat(portfolioRow.quantity) + quantity
      const nuevoAverage =
        (parseFloat(portfolioRow.average_price) * parseFloat(portfolioRow.quantity) +
          price * quantity) /
        totalCuotapartes

      const { error: updateError } = await supabase
        .from('portfolios')
        .update({
          quantity: totalCuotapartes,
          average_price: nuevoAverage
        })
        .eq('user_id', userId)
        .eq('stock_id', stockId)

      if (updateError) throw updateError
    } else {
      // No tenía el fondo, lo insertamos
      const { error: insertPortfolioError } = await supabase
        .from('portfolios')
        .insert({
          user_id: userId,
          stock_id: stockId,
          quantity,
          average_price: price
        })

      if (insertPortfolioError) throw insertPortfolioError
    }
  } else if (type === 'sell') {
    if (!portfolioRow || portfolioRow.quantity < quantity) {
      throw new Error('No hay suficientes cuotapartes para vender')
    }

    const nuevaCantidad = portfolioRow.quantity - quantity

    const { error: updateError } = await supabase
      .from('portfolios')
      .update({
        quantity: nuevaCantidad
        // El average_price no se toca al vender
      })
      .eq('user_id', userId)
      .eq('stock_id', stockId)

    if (updateError) throw updateError
  }
}
