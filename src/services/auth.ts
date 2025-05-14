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
  username: string
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
        // Get user data from users table to get first and last name
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
        }

        // Construct display name from first and last name
        const displayName = userData ? `${userData.first_name} ${userData.last_name}`.trim() : user.email?.split('@')[0]

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email!,
            name: displayName
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
  async register({ email, password, name, lastName, username }: RegisterRequest): Promise<RegisterResponse> {
    try {
      // Create display name from first and last name
      const displayName = `${name} ${lastName}`.trim()

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: displayName,  // Set display name in user metadata
            username,
          },
        },
      })
      if (error) {
        return { success: false, message: error.message }
      }
      const user = data.user
      if (user) {
        // 1. Insert into users table
        const { error: userError } = await supabase.from('users').insert({
          id: user.id,
          first_name: name,
          last_name: lastName,
          username: username,
        })
        if (userError) {
          return { success: false, message: userError.message }
        }

        // 2. Insert into accounts table
        function generateAccountNumber() {
          return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
        }
        const { error: accountError } = await supabase.from('accounts').insert({
          user_id: user.id,
          balance: 0,
          account_number: generateAccountNumber(),
        })
        if (accountError) {
          return { success: false, message: accountError.message }
        }

        return { success: true }
      }
      return { success: false, message: 'Error desconocido al registrar' }
    } catch (error: any) {
      return { success: false, message: error.message || 'Error al registrar' }
    }
  },
  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        return {
          success: false,
          message: error.message || 'Error al solicitar el restablecimiento de contraseña'
        }
      }

      return {
        success: true,
        message: 'Se ha enviado un correo con instrucciones para restablecer tu contraseña'
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error al solicitar el restablecimiento de contraseña'
      }
    }
  },
  async resetPasswordWithToken(accessToken: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('Error resetting password:', error)
        return { 
          success: false, 
          error: error.message 
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected error resetting password:', error)
      return { 
        success: false, 
        error: 'Error inesperado al restablecer la contraseña' 
      }
    }
  }
} 