import { supabase } from '@/plugins/supabase'

export interface LoginResponse {
  success: boolean
  message?: string
  user?: {
    id: string
    email: string
    name?: string
  }
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  lastName: string
}

export interface RegisterResponse {
  success: boolean
  message?: string
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return {
          success: false,
          message: error.message
        }
      }

      const user = data.user
      if (user) {
        // Guardar nombre de usuario en localStorage
        const name = user.user_metadata.name
        if (name) {
          localStorage.setItem('user_name', encodeURIComponent(name))
        }
        localStorage.setItem('user_id', user.id)

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email!,
            name: name
          }
        }
      }

      return {
        success: false,
        message: 'Error al iniciar sesión'
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error al iniciar sesión'
      }
    }
  },
  async register({ email, password, name, lastName }: RegisterRequest): Promise<RegisterResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            lastName,
          },
        },
      })
      if (error) {
        return { success: false, message: error.message }
      }
      const user = data.user
      if (user) {
        // Insertar en tabla users (si existe en tu Supabase)
        // await supabase.from('users').insert({ id: user.id, first_name: name, last_name: lastName })
        return { success: true }
      }
      return { success: false, message: 'Error desconocido al registrar' }
    } catch (error: any) {
      return { success: false, message: error.message || 'Error al registrar' }
    }
  }
} 