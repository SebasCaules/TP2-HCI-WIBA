import { ref, computed } from "vue"
import { defineStore } from "pinia";
import { UserApi, type User, type Credentials, generateUsername } from "@/api/user";
import { Api } from "@/api/Api";

const SECURITY_TOKEN_KEY = "security-token";

export const useSecurityStore = defineStore("security", () => {
    const token = ref<string | null>(null);
    const user = ref<User | null>(null);

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

    return { user, isLoggedIn, initialize, login, logout, getCurrentUser, setUser };
}); 