import { Api, type ApiResponse } from "./api";

export interface Credentials {
    email: string;
    password: string;
}

export interface RegistrationData {
    email: string;
    password: string;
    name: string;
    lastName: string;
    username: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    lastName: string;
    username: string;
}

export class UserApi {
    static getUrl(slug?: string): string {
        return `${Api.baseUrl}/user${slug ? `/${slug}` : ""}`;
    }

    static async login(credentials: Credentials, controller?: AbortController): Promise<{ token: string }> {
        return await Api.post(UserApi.getUrl("login"), false, credentials, controller);
    }

    static async logout(controller?: AbortController): Promise<void> {
        await Api.post(UserApi.getUrl("logout"), true, undefined, controller);
    }

    static async get(controller?: AbortController): Promise<User> {
        return await Api.get(UserApi.getUrl(), true, controller);
    }

    static async createUser(registrationData: RegistrationData, controller?: AbortController): Promise<User> {
        return await Api.post(UserApi.getUrl(), false, registrationData, controller);
    }
} 