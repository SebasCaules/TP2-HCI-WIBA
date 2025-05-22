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
        console.log('[AccountStore] Starting recharge with amount:', amount)
        try {
            console.log('[AccountStore] Calling AccountApi.recharge')
            await AccountApi.recharge(amount)
            console.log('[AccountStore] Recharge API call successful')
            
            console.log('[AccountStore] Refreshing account data')
            await fetchAccount()
            console.log('[AccountStore] Account data refreshed successfully')
        } catch (err) {
            console.error('[AccountStore] Error during recharge:', err)
            throw err
        }
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