const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${apiUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    const headers = new Headers(options?.headers);

    if (options?.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        ...options,
        credentials: options?.credentials ?? "include",
        headers,
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    if (!text || text.trim() === "") {
        return undefined as T;
    }

    try {
        return JSON.parse(text) as T;
    } catch {
        return text as unknown as T;
    }
}
