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
        console.log('[AccountApi] Starting recharge request with amount:', {
            amount,
            amountType: typeof amount,
            isFinite: Number.isFinite(amount),
            isNaN: isNaN(amount),
            stringified: JSON.stringify(amount)
        })
        console.log('[AccountApi] Using base URL:', this.baseUrl)
        const url = `${this.baseUrl}/recharge?amount=${encodeURIComponent(amount)}`
        console.log('[AccountApi] Request URL:', url)
        try {
            const response = await Api.post(url, true, {})
            console.log('[AccountApi] Recharge request successful:', response)
        } catch (error) {
            console.error('[AccountApi] Error during recharge request:', error)
            if (error instanceof Error) {
                console.error('[AccountApi] Error details:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                })
            }
            throw error
        }
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