import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AccountApi, type Account, type UserVerificationResponse } from '@/api/account'

export const useAccountStore = defineStore('account', () => {
    const account = ref<Account | null>(null)
    const error = ref<string | null>(null)

    async function fetchAccount() {
        try {
            account.value = await AccountApi.get()
            error.value = null
        } catch (err) {
            console.error('Error al cargar la cuenta:', err)
            error.value = err instanceof Error ? err.message : 'Error al cargar la cuenta'
            throw err
        }
    }

    async function recharge(amount: number) {
        try {
            await AccountApi.recharge(amount)
            await fetchAccount()
            error.value = null
        } catch (err) {
            console.error('[AccountStore] Error during recharge:', err)
            error.value = err instanceof Error ? err.message : 'Error al realizar la recarga'
            throw err
        }
    }

    async function updateAlias(newAlias: string) {
        try {
            const updatedAccount = await AccountApi.updateAlias(newAlias)
            account.value = updatedAccount
            error.value = null
        } catch (err) {
            console.error('[AccountStore] Error during alias update:', err)
            error.value = err instanceof Error ? err.message : 'Error al actualizar el alias'
            throw err
        }
    }

    async function verifyCvu(cvu: string): Promise<UserVerificationResponse> {
        try {
            const response = await AccountApi.verifyCvu(cvu)
            error.value = null
            return response
        } catch (err) {
            console.error('[AccountStore] Error verifying CVU:', err)
            error.value = err instanceof Error ? err.message : 'Error al verificar el CVU'
            throw err
        }
    }

    async function verifyAlias(alias: string): Promise<UserVerificationResponse> {
        try {
            const response = await AccountApi.verifyAlias(alias)
            error.value = null
            return response
        } catch (err) {
            console.error('[AccountStore] Error verifying alias:', err)
            error.value = err instanceof Error ? err.message : 'Error al verificar el alias'
            throw err
        }
    }

    async function verifyEmail(email: string): Promise<UserVerificationResponse> {
        try {
            const response = await AccountApi.verifyEmail(email)
            error.value = null
            return response
        } catch (err) {
            console.error('[AccountStore] Error verifying email:', err)
            error.value = err instanceof Error ? err.message : 'Error al verificar el email'
            throw err
        }
    }

    return {
        account,
        error,
        fetchAccount,
        recharge,
        updateAlias,
        verifyCvu,
        verifyAlias,
        verifyEmail
    }
})