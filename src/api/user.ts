import { Api, type ApiResponse } from "./Api";

export interface Credentials {
    email: string;
    password: string;
}

export interface RegistrationData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    metadata: Record<string, any>;
}

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    birthDate: string;
    metadata: Record<string, any>;
    username: string;
}

export class UserApi {
    static getUrl(slug?: string): string {
        return `${Api.baseUrl}/user${slug ? `/${slug}` : ""}`;
    }

    static async login(credentials: Credentials, controller?: AbortController): Promise<{ token: string }> {
        const response = await Api.post(UserApi.getUrl("login"), false, credentials, controller);
        return response as { token: string };
    }

    static async logout(controller?: AbortController): Promise<void> {
        await Api.post(UserApi.getUrl("logout"), true, undefined, controller);
    }

    static async get(controller?: AbortController): Promise<User> {
        const response = await Api.get(UserApi.getUrl(), true, controller);
        return response as User;
    }

    static async createUser(registrationData: RegistrationData, controller?: AbortController): Promise<User> {
        const response = await Api.post(UserApi.getUrl(), false, registrationData, controller);
        return response as User;
    }

    static async verify(code: string, controller?: AbortController): Promise<User> {
        const response = await Api.post(`${UserApi.getUrl("verify")}?code=${code}`, false, null, controller);
        return response as User;
    }
    
    static async updateAlias(newAlias: string, controller?: AbortController): Promise<void> {
        const url = UserApi.getUrl(`update-alias?alias=${encodeURIComponent(newAlias)}`);
        await Api.put(url, true, undefined, controller);
    }
}