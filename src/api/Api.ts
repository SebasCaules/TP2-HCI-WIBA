interface ApiError {
    code: number;
    description: string;
}

interface ApiResponse {
    [key: string]: any;
}

interface FetchOptions extends RequestInit {
    signal?: AbortSignal;
    headers?: HeadersInit;
}

class Api {
    static token: string | null = null;

    static get baseUrl(): string {
        return "http://localhost:8080/api";
    }

    static get timeout(): number {
        return 60 * 1000;
    }

    static async fetch(url: string, secure: boolean, init: FetchOptions = {}, controller?: AbortController): Promise<ApiResponse> {

        
        if (secure && Api.token) {

            if (!init.headers) {
                init.headers = new Headers();
            } else if (typeof init.headers === 'object' && !(init.headers instanceof Headers)) {
                init.headers = new Headers(init.headers);
            }
            (init.headers as Headers).set("Authorization", `bearer ${Api.token}`);
        } else if (secure && !Api.token) {
            console.error('Secure request made without token');
        }

        controller = controller || new AbortController();
        init.signal = controller.signal;
        const timer = setTimeout(() => controller.abort(), Api.timeout);

        try {

            const response = await fetch(url, init);

            const text = await response.text();

            const json = text ? JSON.parse(text) : {};
            
            if (!response.ok) {
                console.error('API error:', { status: response.status, json });
                throw { 
                    code: response.status, 
                    description: json.message || response.statusText || 'Error en la solicitud'
                } as ApiError;
            }
            
            if (json.message) {
                console.error('API message error:', json.message);
                throw { code: 97, description: json.message } as ApiError;
            }
            return json;
        } catch (error) {
            console.error('API fetch error:', error);
            if (error instanceof Error) {
                if (error.name === "AbortError")
                    throw { code: 98, description: error.message.toLowerCase() } as ApiError;
                else if (error.name === "TypeError")
                    throw { code: 99, description: error.message.toLowerCase() } as ApiError;
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }

    static async get(url: string, secure: boolean, controller?: AbortController): Promise<ApiResponse> {
        return await Api.fetch(url, secure, {}, controller);
    }

    static async post(url: string, secure: boolean, data: unknown, controller?: AbortController): Promise<ApiResponse> {
        return await Api.fetch(url, secure, {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/json; charset=utf-8"
            }),
            body: JSON.stringify(data)
        }, controller);
    }

    static async put(url: string, secure: boolean, data: unknown, controller?: AbortController): Promise<ApiResponse> {
        return await Api.fetch(url, secure, {
            method: "PUT",
            headers: new Headers({
                "Content-Type": "application/json; charset=utf-8"
            }),
            body: JSON.stringify(data)
        }, controller);
    }

    static async delete(url: string, secure: boolean, controller?: AbortController): Promise<ApiResponse> {
        return await Api.fetch(url, secure, {
            method: "DELETE",
        }, controller);
    }
}

export { Api, type ApiError, type ApiResponse }; 