import { supabase } from '@/plugins/supabase'
import { getUserProfile } from './userDeprecated'
import { getTransactions } from './transactions'
import { getBills } from './bills'
import { fetchContacts } from './contactsDeprecated'
import { getCards } from '../api/cards'
import type {
  User,
  Account,
  Transaction,
  Bill,
  Contact,
  Card
} from '@/types/types'

export interface DashboardData {
  user: User;
  account: Account;
  transactions: Transaction[];
  bills: Bill[];
  contacts: Contact[];
  cards: Card[];
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
  const { contacts } = await fetchContacts(userId)

  // Fetch cards
  const cards = await getCards(userId)

  const dashboardUser: User = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username
  }

  const dashboardAccount: Account = {
    balance: account.balance,
    account_number: account.account_number
  }

  const dashboardTransactions: Transaction[] = transactions.map(t => {
    let description = t.description;
    if (t.transaction_type === 'transfer') {
      const isOutgoing = t.user_id === user.id;
      if (isOutgoing) {
        description = `Enviado a ${t.recipient_name || ''}`;
      } else {
        description = `Recibido de ${t.sender_name || ''}`;
      }
      if (t.description) {
        description += `: ${t.description}`;
      }
    }
    return {
      id: t.id,
      description,
      user_id: t.user_id,
      transaction_type: t.transaction_type as 'deposit' | 'withdraw' | 'transfer',
      amount: t.amount,
      recipient_id: t.recipient_id,
      created_at: t.created_at,
      card_company: t.card_company,
      recipient_name: t.recipient_name,
      sender_name: t.sender_name,
      recipient: t.recipient,
      sender: t.sender
    };
  })
  .reverse();

  const dashboardBills: Bill[] = bills.map(b => ({
    id: b.id,
    title: b.title,
    provider: b.provider,
    amount: b.amount,
    due_date: b.due_date,
    status: b.status
  }))

  const dashboardContacts: Contact[] = contacts.map(c => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    username: c.username,
    initials: c.initials
  }))

  const dashboardCards: Card[] = cards.map(c => ({
    id: c.id,
    brand: c.brand,
    number_last4: c.number_last4,
    expiry: c.expiry,
    holder: c.holder
  }))

  return {
    user: dashboardUser,
    account: dashboardAccount,
    transactions: dashboardTransactions,
    bills: dashboardBills,
    contacts: dashboardContacts,
    cards: dashboardCards
  }
} 