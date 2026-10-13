export const BASE_URL = '';

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Tunnel-Skip-AntiPhishing-Page': 'True',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
        let errorMsg = response.statusText;
        try {
            const errText = await response.text();
            if (errText) {
                try {
                    const errJson = JSON.parse(errText);
                    errorMsg = errJson.message || errJson.title || errJson.detail || errText;
                } catch {
                    errorMsg = errText;
                }
            }
        } catch {
            
        }
        throw new Error(errorMsg || `Error en la petición: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
};

