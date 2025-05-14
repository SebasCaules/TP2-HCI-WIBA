import { supabase } from '@/plugins/supabase'
import { getUserProfile } from './users'
import { getTransactions } from './transactions'
import { getBills } from './bills'
import { getContacts } from './contacts'
import { getCards } from './cards'

export interface DashboardData {
  user: {
    first_name: string
    last_name: string
    username: string
  }
  account: {
    balance: number
    account_number: string
  }
  transactions: {
    id: string
    description: string
    amount: number
    date: string
    type: string
    card_company: string | null
  }[]
  bills: {
    id: string
    title: string
    provider: string
    amount: number
    due_date: string
    status: string
  }[]
  contacts: {
    id: string
    name: string
    alias: string
  }[]
  cards: {
    id: string
    brand: string
    number_last4: string
    expiry: string
    holder: string
  }[]
}

export async function fetchDashboardData(userId: string): Promise<DashboardData> {
  // Fetch user profile
  const user = await getUserProfile(userId)
  if (!user) {
    throw new Error('Usuario no encontrado')
  }

  // Fetch account
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('balance, account_number')
    .eq('user_id', userId)
    .single()

  if (accountError) {
    throw new Error('Error al obtener datos de la cuenta')
  }

  // Fetch transactions
  const transactions = await getTransactions(userId)

  // Fetch bills
  const bills = await getBills(userId)

  // Fetch contacts
  const contacts = await getContacts(userId)

  // Fetch cards
  const cards = await getCards(userId)

  return {
    user: {
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username
    },
    account: {
      balance: account.balance,
      account_number: account.account_number
    },
    transactions: transactions.map(t => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      date: t.created_at,
      type: t.transaction_type,
      card_company: t.card_company
    })),
    bills: bills.map(b => ({
      id: b.id,
      title: b.title,
      provider: b.provider,
      amount: b.amount,
      due_date: b.due_date,
      status: b.status
    })),
    contacts: contacts.map(c => ({
      id: c.id,
      name: c.name,
      alias: c.alias
    })),
    cards: cards.map(c => ({
      id: c.id,
      brand: c.brand,
      number_last4: c.number_last4,
      expiry: c.expiry,
      holder: c.holder
    }))
  }
} 