const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export interface User {
    id: string;
    userId: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    zoneAssignment: string;
    status: 'Active' | 'Suspended';
    avatarUrl: string | null;
    createdAt?: string;
    updatedAt?: string;
}

const requestJson = async (path: string, options: RequestInit = {}) => {
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

export const loginUser = async ({ email, password }: { email: string; password: string }): Promise<User> => {
    const payload = await requestJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

    return payload.user;
};

export const fetchUsers = async (): Promise<User[]> => {
    return requestJson('/api/users');
};

export const createUser = async (user: Partial<User> & { password?: string }): Promise<User> => {
    return requestJson('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
    });
};

export const updateUser = async (id: string, updates: Partial<User> & { password?: string }): Promise<User> => {
    return requestJson(`/api/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
};

export const deleteUser = async (id: string): Promise<{ deleted: User }> => {
    return requestJson(`/api/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    });
};
