export interface Contact {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    initials: string;
    account_number?: string;
    type: 'cvu' | 'alias';
    addedAt: string;
    error?: string;  // Optional error message for UI feedback
}

export interface ContactResponse {
    contact_id: string;
    contact: {
        id: string;
        first_name: string;
        last_name: string;
        username: string;
        account_number?: string;
    };
}

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
}

export interface Account {
    balance: number;
    account_number: string;
}

export interface Transaction {
    id: string;
    description: string;
    user_id: string;
    transaction_type: 'deposit' | 'withdraw' | 'transfer';
    amount: number;
    recipient_id: string | null;
    created_at: string;
    card_company: string | null;
    recipient?: User;
    sender?: User;
    recipient_name?: string;
    sender_name?: string;
}

export interface Bill {
    id: string;
    title: string;
    provider: string;
    amount: number;
    due_date: string;
    status: string;
}

export interface Card {
    id: string;
    brand: string;
    number_last4: string;
    expiry: string;
    holder: string;
    logo?: string;
}
export interface Stock {
    id: number;
    symbol: string;
    name: string;
    current_price: number;
    updated_at: string;
    logo?: string;  // Optional logo URL
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
    created_at: string;
    stock?: Stock; // Optional joined relation
}

export const investmentTypeColors = {
    'FND-A': 'var(--chart-1)',
    'FND-B': 'var(--chart-2)',
    'FND-C': 'var(--chart-3)',
    'FND-D': 'var(--chart-4)',
    'FND-E': 'var(--chart-5)',
} as const;

export const investmentTypeLabels = {
    'FND-A': 'Clase A',
    'FND-B': 'Clase B',
    'FND-C': 'Conservador',
    'FND-D': 'Balanceado',
    'FND-E': 'Clase C',
} as const;