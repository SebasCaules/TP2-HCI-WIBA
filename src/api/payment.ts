import { Api } from "@/api/Api";

export interface PaymentRequest {
    description?: string;
    amount: number;
    metadata?: Record<string, any>;
}

export interface Payment {
    id: number;
    uuid: string;
    amount: number;
    pending: boolean;
    created_at: string;
    updated_at?: string;
    description?: string;
    method: string;
    payer: {
        id: number;
        firstName: string;
        lastName: string;
    };
    receiver: {
        id: number;
        firstName: string;
        lastName: string;
    };
    card?: {
        id: number;
        number: string;
    };
    metadata: Record<string, any> | null;
}

export interface PaymentFilters {
    page?: number;
    pageSize?: number;
    direction?: 'ASC' | 'DESC';
    pending?: boolean;
    method?: 'ACCOUNT' | 'CARD';
    range?: 'THREE_DAYS' | 'LAST_WEEK' | 'LAST_MONTH';
    role?: 'PAYER' | 'RECEIVER';
    cardId?: number;
}

export interface PaymentResponse {
    results: Payment[];
    paging: {
        page: number;
        pages: number;
        total: number;
        totalCount: number;
    };
}

const BASE_URL = `${Api.baseUrl}/payment`;

export const PaymentApi = {
    async pull(payload: PaymentRequest): Promise<Payment> {
        const response = await Api.post(`${BASE_URL}/pull`, true, payload);
        return response as Payment;
    },

    async push(uuid: string, cardId?: string): Promise<Payment> {
        const query = new URLSearchParams({ uuid });
        if (cardId) query.append("cardId", cardId);
        const response = await Api.put(`${BASE_URL}/push?${query.toString()}`, true, {});
        return response as Payment;
    },
    
    async get(): Promise<Payment[]> {
        const response = await Api.get(BASE_URL, true);
        return response as Payment[];
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

    async getAll(filters?: PaymentFilters): Promise<PaymentResponse> {
        const query = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) {
                    query.append(key, value.toString());
                }
            });
        }
        const response = await Api.get(`${BASE_URL}?${query.toString()}`, true);
        return response as PaymentResponse;
    },

    async getById(id: number): Promise<Payment> {
        const response = await Api.get(`${BASE_URL}/${id}`, true);
        return response as Payment;
    }
};