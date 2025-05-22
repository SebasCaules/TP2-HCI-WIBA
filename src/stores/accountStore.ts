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
        await AccountApi.recharge(amount)
        await fetchAccount()
    }

    async function updateAlias(newAlias: string) {
        await AccountApi.updateAlias(newAlias)
        await fetchAccount()
    }

    return {
        account,
        fetchAccount,
        recharge,
        updateAlias,
    }
})