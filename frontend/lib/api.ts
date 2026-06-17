import type {
  BackendChatResponse,
  BackendDocumentOut,
  FlashcardsResponse,
  MindMapResponse,
  PageContent,
  QuizResponse,
  SummaryResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> ?? {}),
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${msg}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  uploadDocument: (file: File): Promise<BackendDocumentOut> => {
    const form = new FormData();
    form.append("file", file);
    return request<BackendDocumentOut>("/api/v1/upload", {
      method: "POST",
      body: form,
    });
  },

  chat: (body: { query: string; document_ids: string[] }): Promise<BackendChatResponse> =>
    request<BackendChatResponse>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  fetchPage: (documentId: string, pageNumber: number): Promise<PageContent> =>
    request<PageContent>(`/api/v1/documents/${documentId}/pages/${pageNumber}`),

  getSummary: (docId: string): Promise<SummaryResponse> =>
    request<SummaryResponse>(`/api/v1/documents/${docId}/summary`),

  getFlashcards: (docId: string): Promise<FlashcardsResponse> =>
    request<FlashcardsResponse>(`/api/v1/documents/${docId}/flashcards`),

  getQuiz: (docId: string): Promise<QuizResponse> =>
    request<QuizResponse>(`/api/v1/documents/${docId}/quiz`),

  getMindMap: (docId: string): Promise<MindMapResponse> =>
    request<MindMapResponse>(`/api/v1/documents/${docId}/mindmap`),
};
