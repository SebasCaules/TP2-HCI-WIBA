import { ref, computed } from "vue"
import { defineStore } from "pinia";
import { UserApi, type User, type Credentials, generateUsername } from "@/api/user";
import { Api } from "@/api/Api";

const SECURITY_TOKEN_KEY = "security-token";

export const useSecurityStore = defineStore("security", () => {
    const token = ref<string | null>(null);
    const user = ref<User | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const isLoggedIn = computed(() => {
        return token.value != null;
    });

    function initialize(): void {

        const storedToken = localStorage.getItem(SECURITY_TOKEN_KEY);

        if (storedToken) setToken(storedToken);
    }

    function setUser(value: User | null): void {

        if (value) {
            // Generar username localmente
            try {
                value.username = generateUsername(value.firstName, value.lastName);
            } catch (err) {
                console.error('Error generando username:', err);
            }
        }
        user.value = value;
    }

    function setToken(value: string | null): void {

        token.value = value;
        Api.token = value;
    }

    function updateToken(value: string, rememberMe: boolean): void {

        if (rememberMe) {

            localStorage.setItem(SECURITY_TOKEN_KEY, value);
        }
        setToken(value);
    }

    function removeToken(): void {

        localStorage.removeItem(SECURITY_TOKEN_KEY);
        setToken(null);
    }

    async function login(credentials: Credentials, rememberMe: boolean): Promise<void> {

        const result = await UserApi.login(credentials);

        updateToken(result.token, rememberMe);
    }

    async function logout(): Promise<void> {

        try {
            await UserApi.logout();

        } finally {
            removeToken();
        }
    }

    async function getCurrentUser(): Promise<User | null> {

        if (user.value) {

            return user.value;
        }

        const result = await UserApi.get();

        setUser(result);
        return result;
    }

    async function resetPasswordRequest(email: string): Promise<void> {
        isLoading.value = true;
        error.value = null;
        
        try {
            await UserApi.requestPasswordReset(email);
        } catch (err: any) {
            error.value = err.description || 'Error al solicitar el reseteo de contraseña';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function confirmPasswordChange(code: string, password: string): Promise<void> {
        isLoading.value = true;
        error.value = null;
        
        try {
            await UserApi.changePassword(code, password);
        } catch (err: any) {
            error.value = err.description || 'Error al cambiar la contraseña';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    return { 
        user, 
        isLoggedIn, 
        isLoading,
        error,
        initialize, 
        login, 
        logout, 
        getCurrentUser, 
        setUser,
        resetPasswordRequest,
        confirmPasswordChange 
    };
}); 