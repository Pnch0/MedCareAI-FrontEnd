export const BASE_URL = '';

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'X-Tunnel-Skip-AntiPhishing-Page': 'True',
    };

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        throw new Error(`Error en la petición: ${response.statusText}`);
    }


    const text = await response.text();
    return text ? JSON.parse(text) : {};
};

