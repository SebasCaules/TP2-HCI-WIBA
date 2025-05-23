import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AccountApi, type Account } from '@/api/account'

export const useAccountStore = defineStore('account', () => {
    const account = ref<Account | null>(null)

    async function fetchAccount() {
        try {
            account.value = await AccountApi.get()
        } catch (err) {
            console.error('Error al cargar la cuenta:', err)
        }
    }

    async function recharge(amount: number) {
        try {
            await AccountApi.recharge(amount)
            await fetchAccount()
        } catch (err) {
            console.error('[AccountStore] Error during recharge:', err)
            throw err
        }
    }

    async function updateAlias(newAlias: string) {
        try {
            const updatedAccount = await AccountApi.updateAlias(newAlias)
            account.value = updatedAccount
        } catch (err) {
            console.error('[AccountStore] Error during alias update:', err)
            throw err
        }
    }

    return {
        account,
        fetchAccount,
        recharge,
        updateAlias
    }
})