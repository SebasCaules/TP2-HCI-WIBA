import { ref, computed } from "vue"
import { defineStore } from "pinia";
import { UserApi, type User, type Credentials } from "@/api/user";
import { Api } from "@/api/Api";

const SECURITY_TOKEN_KEY = "security-token";

export const useSecurityStore = defineStore("security", () => {
    const token = ref<string | null>(null);
    const user = ref<User | null>(null);

    const isLoggedIn = computed(() => {
        return token.value != null;
    });

    function initialize(): void {
        console.log('Initializing security store...');
        const storedToken = localStorage.getItem(SECURITY_TOKEN_KEY);
        console.log('Stored token found:', !!storedToken);
        if (storedToken) setToken(storedToken);
    }

    function setUser(value: User | null): void {
        console.log('Setting user:', value);
        user.value = value;
    }

    function setToken(value: string | null): void {
        console.log('Setting token:', !!value);
        token.value = value;
        Api.token = value;
    }

    function updateToken(value: string, rememberMe: boolean): void {
        console.log('Updating token, rememberMe:', rememberMe);
        if (rememberMe) {
            console.log('Storing token in localStorage');
            localStorage.setItem(SECURITY_TOKEN_KEY, value);
        }
        setToken(value);
    }

    function removeToken(): void {
        console.log('Removing token');
        localStorage.removeItem(SECURITY_TOKEN_KEY);
        setToken(null);
    }

    async function login(credentials: Credentials, rememberMe: boolean): Promise<void> {
        console.log('Login attempt with credentials:', { email: credentials.email, rememberMe });
        const result = await UserApi.login(credentials);
        console.log('Login successful, got token');
        updateToken(result.token, rememberMe);
    }

    async function logout(): Promise<void> {
        console.log('Logout attempt');
        try {
            await UserApi.logout();
            console.log('Logout API call successful');
        } finally {
            removeToken();
        }
    }

    async function getCurrentUser(): Promise<User | null> {
        console.log('Getting current user');
        if (user.value) {
            console.log('User already in store');
            return user.value;
        }
        console.log('Fetching user from API');
        const result = await UserApi.get();
        console.log('User fetched successfully');
        setUser(result);
        return result;
    }

    return { user, isLoggedIn, initialize, login, logout, getCurrentUser, setUser };
}); 