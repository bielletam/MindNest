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
  quiz_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  source: "ai" | "manual";
  source_pages: number[] | null;
  created_at: string;
}

export interface Quiz {
  id: string;
  document_id: string;
  title: string | null;
  scope_description: string | null;
  created_at: string;
  question_count: number;
}

export type QuizWithQuestions = Quiz & { questions: QuizQuestion[] };

export interface GenerateQuizRequest {
  page_start?: number;
  page_end?: number;
  topic?: string;
  count?: number;
  title?: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  description: string | null;
  node_type: "root" | "branch" | "leaf";
}

export interface MindMapEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_label: string;
}

export interface MindMap {
  id: string;
  document_id: string;
  title: string | null;
  scope_description: string | null;
  created_at: string;
  node_count: number;
  edge_count: number;
}

export type MindMapWithData = MindMap & { nodes: MindMapNode[]; edges: MindMapEdge[] };

export interface GenerateMindMapRequest {
  page_start?: number;
  page_end?: number;
  topic?: string;
  title?: string;
}

// ─── Backend API shapes ───────────────────────────────────────────────────────

export type FlashcardStatus = "still_learning" | "know";

export interface BackendFlashcard {
  id: string;
  front: string;
  back: string;
  source: "ai" | "manual";
  source_pages: number[] | null;
  status: FlashcardStatus;
  created_at: string;
}

export interface GenerateFlashcardsRequest {
  page_start?: number;
  page_end?: number;
  topic?: string;
  count?: number;
}

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

export type SummaryLength = "short" | "medium" | "detailed";

export interface SummaryResponse {
  summary: string;
  length: SummaryLength;
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

export interface FlashcardsResponse {
  cards: Omit<Flashcard, "id">[];
}

// QuizResponse removed — quiz is now fully backend-driven

