import type {
  BackendChatResponse,
  BackendDocumentOut,
  BackendFlashcard,
  FlashcardStatus,
  GenerateFlashcardsRequest,
  GenerateMindMapRequest,
  GenerateQuizRequest,
  MindMap,
  MindMapWithData,
  PageContent,
  Quiz,
  QuizQuestion,
  QuizWithQuestions,
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

  deleteDocument: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE}/api/v1/documents/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`API ${res.status}: ${msg}`);
    }
  },

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

  generateQuiz: (documentId: string, req: GenerateQuizRequest): Promise<QuizWithQuestions> =>
    request<QuizWithQuestions>(`/api/v1/documents/${documentId}/quizzes/generate`, {
      method: "POST",
      body: JSON.stringify(req),
    }),

  fetchQuizzes: (documentId: string): Promise<Quiz[]> =>
    request<Quiz[]>(`/api/v1/documents/${documentId}/quizzes`),

  fetchQuiz: (quizId: string): Promise<QuizWithQuestions> =>
    request<QuizWithQuestions>(`/api/v1/quizzes/${quizId}`),

  deleteQuiz: async (quizId: string): Promise<void> => {
    const res = await fetch(`${BASE}/api/v1/quizzes/${quizId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`API ${res.status}: ${msg}`);
    }
  },

  createQuestion: (
    quizId: string,
    data: Pick<QuizQuestion, "question" | "options" | "correct_index"> & { explanation?: string },
  ): Promise<QuizQuestion> =>
    request<QuizQuestion>(`/api/v1/quizzes/${quizId}/questions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateQuestion: (
    questionId: string,
    data: Partial<Pick<QuizQuestion, "question" | "options" | "correct_index" | "explanation">>,
  ): Promise<QuizQuestion> =>
    request<QuizQuestion>(`/api/v1/questions/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteQuestion: async (questionId: string): Promise<void> => {
    const res = await fetch(`${BASE}/api/v1/questions/${questionId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`API ${res.status}: ${msg}`);
    }
  },

  generateMindMap: (documentId: string, req: GenerateMindMapRequest): Promise<MindMapWithData> =>
    request<MindMapWithData>(`/api/v1/documents/${documentId}/mindmaps/generate`, {
      method: "POST",
      body: JSON.stringify(req),
    }),

  fetchMindMaps: (documentId: string): Promise<MindMap[]> =>
    request<MindMap[]>(`/api/v1/documents/${documentId}/mindmaps`),

  fetchMindMap: (mindmapId: string): Promise<MindMapWithData> =>
    request<MindMapWithData>(`/api/v1/mindmaps/${mindmapId}`),

  deleteMindMap: async (mindmapId: string): Promise<void> => {
    const res = await fetch(`${BASE}/api/v1/mindmaps/${mindmapId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`API ${res.status}: ${msg}`);
    }
  },
};
