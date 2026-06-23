const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export interface Activity {
    id: string;
    timestamp: string;
    timeStr: string;
    type: 'pick' | 'pack' | 'receive' | 'rma' | 'relocate';
    user: string;
    message: string;
    details: string;
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

export const fetchActivities = async (): Promise<Activity[]> => {
    return requestJson('/api/activities');
};

export const logActivityApi = async (activity: { type: string; user: string; message: string; details: string }): Promise<Activity> => {
    return requestJson('/api/activities', {
        method: 'POST',
        body: JSON.stringify(activity),
    });
};
