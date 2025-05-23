import { Api } from '@/api/Api'

export interface Account {
    id: number
    balance: number
    invested: number
    cvu: string
    alias: string
}

export interface UserVerificationResponse {
    firstName: string
    lastName: string
}

export class AccountApi {
    static baseUrl = `${Api.baseUrl}/account`

    static async get(): Promise<Account> {
        const response = await Api.get(this.baseUrl, true)
        return response as Account
    }

    static async recharge(amount: number): Promise<void> {
        const url = `${this.baseUrl}/recharge?amount=${encodeURIComponent(amount)}`
        try {
            await Api.post(url, true, {})
        } catch (error) {
            throw error
        }
    }

    static async verifyCvu(cvu: string): Promise<UserVerificationResponse> {
        try {
            const res = await Api.get(`${this.baseUrl}/verify-cvu?cvu=${encodeURIComponent(cvu)}`, true)
            return res as UserVerificationResponse
        } catch (error: any) {
            if (error?.response?.status === 404) {
                throw new Error('CVU no encontrado')
            }
            throw error
        }
    }

    static async verifyAlias(alias: string): Promise<UserVerificationResponse> {
        try {
            const res = await Api.get(`${this.baseUrl}/verify-alias?alias=${encodeURIComponent(alias)}`, true)
            return res as UserVerificationResponse
        } catch (error: any) {
            if (error?.response?.status === 404) {
                throw new Error('Alias no encontrado')
            }
            throw error
        }
    }

    static async updateAlias(newAlias: string): Promise<Account> {
        if (!newAlias || newAlias.trim() === '') {
            throw new Error('El alias no puede estar vacío')
        }

        const url = `${this.baseUrl}/update-alias?alias=${encodeURIComponent(newAlias.trim())}`
        const response = await Api.put(url, true, {})
        return response as Account
    }
}