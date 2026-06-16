export interface Paragraph {
  head?: boolean;
  hi?: string;
  text: string;
}

export interface DocumentPage {
  n: number;
  paras: Paragraph[];
}

export interface MindNestDocument {
  id: string;
  title: string;
  short: string;
  author: string;
  color: string;
  status: "uploading" | "ready";
  progress?: number;
  inContext: boolean;
  pages?: DocumentPage[];
}

export interface Citation {
  doc: string;
  page: number;
  hi: string;
  snippet: string;
}

export interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  streaming?: boolean;
  full?: string;
  fullCites?: Citation[];
  cites?: Citation[];
}

export interface Flashcard {
  id: string;
  q: string;
  a: string;
  src: string;
  color: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
  color?: string;
}

// ─── Backend API shapes ───────────────────────────────────────────────────────

export interface Source {
  document_id: string;
  page_number: number;
}

export interface BackendChatResponse {
  answer: string;
  sources: Source[];
}

export interface PageContent {
  document_id: string;
  page_number: number;
  content: string;
  total_pages: number;
}

export interface BackendDocumentOut {
  id: string;
  filename: string;
  status: string;
  created_at: string;
}

// ─── Legacy API response shapes (kept for mock features) ─────────────────────

export interface UploadResponse {
  id: string;
  title: string;
  pageCount: number;
}

export interface ChatRequest {
  doc_ids: string[];
  message: string;
}

export interface ChatResponse {
  text: string;
  citations: Citation[];
}

export interface SummaryResponse {
  text: string;
  citations: Citation[];
}

export interface FlashcardsResponse {
  cards: Omit<Flashcard, "id">[];
}

export interface QuizResponse {
  questions: Omit<QuizQuestion, "id">[];
}

export interface MindMapResponse {
  root: MindMapNode;
}
