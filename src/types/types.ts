export interface Contact {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    initials: string;
}

export interface ContactResponse {
    contact_id: string;
    contact: {
        id: string;
        first_name: string;
        last_name: string;
        username: string;
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