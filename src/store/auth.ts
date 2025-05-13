import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: string
  email: string
  name?: string
  username?: string
}

const USER_KEY = 'wiba_user'
const EXP_KEY = 'wiba_user_exp'
const EXP_MINUTES = 60

function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY)
  const expStr = localStorage.getItem(EXP_KEY)
  if (!userStr || !expStr) return null
  const exp = parseInt(expStr, 10)
  if (Date.now() > exp) {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(EXP_KEY)
    return null
  }
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(getStoredUser())
  const isAuthenticated = ref(!!user.value)

  function setUser(newUser: User) {
    user.value = newUser
    isAuthenticated.value = true
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    localStorage.setItem(EXP_KEY, (Date.now() + EXP_MINUTES * 60 * 1000).toString())
  }

  function clearUser() {
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(EXP_KEY)
  }

  // Auto-logout si expira
  if (user.value) {
    const expStr = localStorage.getItem(EXP_KEY)
    if (expStr && Date.now() > parseInt(expStr, 10)) {
      clearUser()
    }
  }

  return {
    user,
    isAuthenticated,
    setUser,
    clearUser
  }
}) 