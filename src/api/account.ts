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
        await Api.post(`${this.baseUrl}/recharge`, true, { amount })
    }

    static async updateAlias(newAlias: string): Promise<void> {
        await Api.put(`${this.baseUrl}/update-alias`, true, { alias: newAlias })
    }

    static async verifyCvu(cvu: string): Promise<boolean> {
        const res = await Api.get(`${this.baseUrl}/verify-cvu?cvu=${cvu}`, true)
        return res.valid
    }

    static async verifyAlias(alias: string): Promise<boolean> {
        const res = await Api.get(`${this.baseUrl}/verify-alias?alias=${alias}`, true)
        return res.valid
    }
}