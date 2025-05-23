import { Api } from './Api';

export interface DailyReturn {
    date: string;
    amount: number;
    rate: number;
    return: number;
}

export interface FundDailyReturn {
    fund_id: string;
    fund_name: string;
    date: string;
    base_return: number;
    coefficient: number;
    adjusted_return: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface Investment {
    id: number;
    userId: string;
    amount: number;
    dailyRate: number;
    lastUpdated: string;
    totalReturns: number;
}

export const investmentApi = {
    /**
     * Get the current daily investment rate
     */
    getDailyRate: async (): Promise<number> => {
        const response = await Api.get(`${Api.baseUrl}/investment/daily-rate`, true);
        // Handle both direct number and object with interest property
        const rate = typeof response === 'object' && 'interest' in response
            ? Number(response.interest)
            : Number(response);

        if (isNaN(rate)) {
            console.error('Invalid daily rate response:', response);
            throw new Error('Invalid daily rate response from server');
        }
        return rate;
    },

    /**
     * Invest a specified amount
     * @param amount The amount to invest (must be positive)
     */
    invest: async (amount: number): Promise<Investment> => {
        const response = await Api.post(`${Api.baseUrl}/investment/invest?amount=${amount}`, true, {});
        return response as Investment;
    },

    /**
     * Divest a specified amount
     * @param amount The amount to divest (must be positive)
     */
    divest: async (amount: number): Promise<Investment> => {
        const response = await Api.post(`${Api.baseUrl}/investment/divest?amount=${amount}`, true, {});
        return response as Investment;
    },

    /**
     * Get paginated daily returns
     * @param page Page number (default: 1)
     * @param pageSize Items per page (default: 10)
     */
    getDailyReturns: async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<FundDailyReturn>> => {
        const response = await Api.get(`${Api.baseUrl}/investment/daily-returns?page=${page}&pageSize=${pageSize}`, true);
        return response as PaginatedResponse<FundDailyReturn>;
    }
};