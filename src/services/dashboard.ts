export interface DashboardData {
  user: { first_name: string; last_name: string }
  account: { balance: number; currency: string }
  transactions: { description: string; amount: number; date: string; type: string }[]
  investments: { total_value: number; gain: number; gain_pct: number }
  breakdown: { class: string; percentage: number; color: string }[]
  contacts: { name: string; initials: string }[]
  bills: { title: string; provider: string; amount: number; due_date: string }[]
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch('/api/dashboard')
  if (!res.ok) throw new Error('Error al obtener datos del dashboard')
  return await res.json()
} 