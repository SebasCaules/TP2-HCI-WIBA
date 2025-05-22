import { Api } from './Api';
import type { ApiResponse } from './Api';

export interface Payment {
    id: number;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
    updated_at: string;
    user_id: number;
}

export class PaymentApi {
    static baseUrl = `${Api.baseUrl}/payment`;

    static async get(): Promise<Payment[]> {
        const response = await Api.get(this.baseUrl, true);
        return response as Payment[];
    }

    static async getById(id: number): Promise<Payment> {
        const response = await Api.get(`${this.baseUrl}/${id}`, true);
        return response as Payment;
    }

    static async createDeposit(amount: number): Promise<Payment> {
        const response = await Api.post(`${this.baseUrl}/pull`, true, { amount });
        return response as Payment;
    }

    static async completeDeposit(id: number): Promise<Payment> {
        const response = await Api.put(`${this.baseUrl}/push/${id}`, true, {});
        return response as Payment;
    }
} 