import { Api } from "@/api/Api";

export interface PaymentRequest {
    description?: string;
    amount: number;
    metadata?: Record<string, any>;
}

export interface Payment {
    id: number;
    uuid?: string;
    amount: number;
    pending: boolean;
    created_at: string;
    updated_at?: string;
    user_id?: number;
    description?: string;
    method: "ACCOUNT" | "CARD" | null;
    payer: {
        id: number;
        firstName: string;
        lastName: string;
    } | null;
    receiver: {
        id: number;
        firstName: string;
        lastName: string;
    } | null;
    card: any | null;
    metadata: Record<string, any> | null;
}

export interface PaginatedResponse {
    paging: {
        page: number;
        pageSize: number;
        pageCount: number;
        totalCount: number;
    };
    results: Payment[];
}

const BASE_URL = `${Api.baseUrl}/payment`;

export const PaymentApi = {
    async pull(payload: PaymentRequest): Promise<Payment> {
        const response = await Api.post(BASE_URL + "/pull", true, payload);
        return response as Payment;
    },

    async push(uuid: string, cardId?: string): Promise<void> {
        const query = new URLSearchParams({ uuid });
        if (cardId) query.append("cardId", cardId);
        await Api.put(`${BASE_URL}/push?${query.toString()}`, true, {});
    },

    async transferByEmail(email: string, payload: PaymentRequest, cardId?: string): Promise<Payment> {
        const query = new URLSearchParams({ email });
        if (cardId) query.append("cardId", cardId);
        const response = await Api.post(`${BASE_URL}/transfer-email?${query.toString()}`, true, payload);
        return response as Payment;
    },

    async transferByCVU(cvu: string, payload: PaymentRequest, cardId?: string): Promise<Payment> {
        const query = new URLSearchParams({ cvu });
        if (cardId) query.append("cardId", cardId);
        const response = await Api.post(`${BASE_URL}/transfer-cvu?${query.toString()}`, true, payload);
        return response as Payment;
    },

    async transferByAlias(alias: string, payload: PaymentRequest, cardId?: string): Promise<Payment> {
        const query = new URLSearchParams({ alias });
        if (cardId) query.append("cardId", cardId);
        const response = await Api.post(`${BASE_URL}/transfer-alias?${query.toString()}`, true, payload);
        return response as Payment;
    },

    async getAll(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse> {
        const query = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString()
        });
        const response = await Api.get(`${BASE_URL}?${query.toString()}`, true);
        return response as PaginatedResponse;
    },

    async getByUuid(uuid: string): Promise<Payment> {
        console.log('🔍 API: Getting payment by UUID:', uuid);
        // First get all payments to find the one with matching UUID
        const response = await this.getAll(1, 1000) as PaginatedResponse;
        console.log('📦 API: All payments:', response);
        
        // Verify response structure
        if (!response || !Array.isArray(response.results)) {
            console.error('Invalid response structure:', response);
            throw new Error('Invalid response from server');
        }
        
        // Find the payment with matching UUID in the results array
        const payment = response.results.find(p => p.uuid === uuid);
        if (!payment) {
            throw new Error('Payment not found');
        }
        
        console.log('✅ Found payment with index:', payment.id);
        // Now get the specific payment using its ID
        const specificPayment = await this.getById(payment.id);
        console.log('📦 API: Specific payment response:', specificPayment);
        return specificPayment;
    },

    // NUEVAS FUNCIONES DEL OTRO CÓDIGO
    async get(): Promise<Payment[]> {
        const response = await Api.get(BASE_URL, true);
        return response as Payment[];
    },

    async getById(id: number): Promise<Payment> {
        const response = await Api.get(`${BASE_URL}/${id}`, true);
        return response as Payment;
    },

    async createDeposit(amount: number): Promise<Payment> {
        const response = await Api.post(`${BASE_URL}/pull`, true, { amount });
        return response as Payment;
    },

    async completeDeposit(id: number): Promise<Payment> {
        const response = await Api.put(`${BASE_URL}/push/${id}`, true, {});
        return response as Payment;
    }
};