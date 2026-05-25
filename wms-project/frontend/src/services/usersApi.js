const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const requestJson = async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(payload?.error || `API returned ${response.status}`);
    }

    return payload;
};

export const loginUser = async ({ email, password }) => {
    const payload = await requestJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    return payload.user;
};

export const fetchUsers = async () => {
    return requestJson('/api/users');
};

export const createUser = async (user) => {
    return requestJson('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
    });
};

export const updateUser = async (id, updates) => {
    return requestJson(`/api/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
};

export const deleteUser = async (id) => {
    return requestJson(`/api/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
};
