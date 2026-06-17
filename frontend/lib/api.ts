import type {
  BackendChatResponse,
  BackendDocumentOut,
  BackendFlashcard,
  FlashcardStatus,
  GenerateFlashcardsRequest,
  MindMapResponse,
  PageContent,
  QuizResponse,
  SummaryLength,
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

  listDocuments: (): Promise<BackendDocumentOut[]> =>
    request<BackendDocumentOut[]>("/api/v1/documents"),

  fetchPage: (documentId: string, pageNumber: number): Promise<PageContent> =>
    request<PageContent>(`/api/v1/documents/${documentId}/pages/${pageNumber}`),

  fetchSummary: (documentId: string, length: SummaryLength): Promise<SummaryResponse> =>
    request<SummaryResponse>(`/api/v1/documents/${documentId}/summarize`, {
      method: "POST",
      body: JSON.stringify({ length }),
    }),

  generateFlashcards: (
    documentId: string,
    req: GenerateFlashcardsRequest,
  ): Promise<BackendFlashcard[]> =>
    request<BackendFlashcard[]>(`/api/v1/documents/${documentId}/flashcards/generate`, {
      method: "POST",
      body: JSON.stringify(req),
    }),

  fetchFlashcards: (documentId: string): Promise<BackendFlashcard[]> =>
    request<BackendFlashcard[]>(`/api/v1/documents/${documentId}/flashcards`),

  createFlashcard: (
    documentId: string,
    body: { front: string; back: string },
  ): Promise<BackendFlashcard> =>
    request<BackendFlashcard>(`/api/v1/documents/${documentId}/flashcards`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateFlashcard: (
    id: string,
    body: { front?: string; back?: string },
  ): Promise<BackendFlashcard> =>
    request<BackendFlashcard>(`/api/v1/flashcards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  updateFlashcardStatus: (
    id: string,
    status: FlashcardStatus,
  ): Promise<BackendFlashcard> =>
    request<BackendFlashcard>(`/api/v1/flashcards/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  resetFlashcards: (documentId: string): Promise<BackendFlashcard[]> =>
    request<BackendFlashcard[]>(`/api/v1/documents/${documentId}/flashcards/reset`, {
      method: "POST",
    }),

  deleteFlashcard: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE}/api/v1/flashcards/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`API ${res.status}: ${msg}`);
    }
  },

  getQuiz: (docId: string): Promise<QuizResponse> =>
    request<QuizResponse>(`/api/v1/documents/${docId}/quiz`),

  getMindMap: (docId: string): Promise<MindMapResponse> =>
    request<MindMapResponse>(`/api/v1/documents/${docId}/mindmap`),
};
