import { Api } from '@/api/Api'

export interface Account {
    id: number
    balance: number
    invested: number
    cvu: string
    alias: string
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

    static async verifyCvu(cvu: string): Promise<boolean> {
        const res = await Api.get(`${this.baseUrl}/verify-cvu?cvu=${cvu}`, true)
        return res.valid
    }

    static async verifyAlias(alias: string): Promise<boolean> {
        const res = await Api.get(`${this.baseUrl}/verify-alias?alias=${alias}`, true)
        return res.valid
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