const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

function mergeHeaders(init: RequestInit, isFormData: boolean): HeadersInit | undefined {
  const base = new Headers(init.headers as HeadersInit);
  if (!isFormData && !base.has('Content-Type')) {
    base.set('Content-Type', 'application/json');
  }
  return base;
}

export async function apiRequest<T>(input: string, init: RequestInit = {}): Promise<T> {
  const isFormData = init.body instanceof FormData;
  const response = await fetch(`${API_URL}${input}`, {
    ...init,
    headers: mergeHeaders(init, isFormData)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export { API_URL };
