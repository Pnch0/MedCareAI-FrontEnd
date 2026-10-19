import { supabase } from './supabaseClient';

export const BASE_URL = '';

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
    let token = localStorage.getItem('token');

    // Intentar obtener el token fresco de la sesión activa de Supabase
    try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
            token = data.session.access_token;
            localStorage.setItem('token', token);
        }
    } catch {
        // Fallback al token ya almacenado
    }

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

    let response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Si recibimos 401 Unauthorized, intentar refrescar la sesión una vez y reintentar
    if (response.status === 401) {
        try {
            const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
            if (!refreshErr && refreshData?.session?.access_token) {
                token = refreshData.session.access_token;
                localStorage.setItem('token', token);

                const retryConfig: RequestInit = {
                    ...options,
                    headers: {
                        ...defaultHeaders,
                        'Authorization': `Bearer ${token}`,
                        ...options.headers,
                    },
                };
                response = await fetch(`${BASE_URL}${endpoint}`, retryConfig);
            }
        } catch {
            // Continuar al manejo normal de error
        }
    }

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
