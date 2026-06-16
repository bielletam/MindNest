"use client";

import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { Citation, Flashcard, Message, MindNestDocument } from "./types";
import { seedDocs, seedFlashcards } from "./seed-data";
import { api } from "./api";

// ─── State ────────────────────────────────────────────────────────────────────

interface DocState {
  docs: MindNestDocument[];
  activeDocId: string;
  messages: Message[];
  input: string;
  thinking: boolean;
  showViewer: boolean;
  viewerPage: number;
  flashHi: string | null;
  dragOver: boolean;
  cards: Flashcard[];
  flipped: Record<string, boolean>;
  studyMode: boolean;
  studyIndex: number;
  studyFlipped: boolean;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_INPUT"; payload: string }
  | { type: "SEND_MESSAGE"; payload: { userMsg: Message; aiMsg: Message } }
  | { type: "UPDATE_AI_TEXT"; payload: { id: string; text: string } }
  | { type: "FINISH_AI_MSG"; payload: { id: string; text: string; cites: Citation[] } }
  | { type: "NEW_CHAT" }
  | { type: "OPEN_DOC"; payload: string }
  | { type: "TOGGLE_CONTEXT"; payload: string }
  | { type: "SET_VIEWER_PAGE"; payload: number }
  | { type: "SET_FLASH_HI"; payload: string | null }
  | { type: "SHOW_VIEWER"; payload: boolean }
  | { type: "SET_DRAG_OVER"; payload: boolean }
  | { type: "ADD_UPLOAD"; payload: Omit<MindNestDocument, "pages"> & { pages: MindNestDocument["pages"] } }
  | { type: "REPLACE_UPLOAD"; payload: { tempId: string; doc: MindNestDocument } }
  | { type: "UPLOAD_PROGRESS"; payload: { id: string; progress: number } }
  | { type: "UPLOAD_DONE"; payload: string }
  | { type: "OPEN_FLASHCARDS"; payload: Flashcard[] }
  | { type: "TOGGLE_FLIP"; payload: string }
  | { type: "SHUFFLE_CARDS" }
  | { type: "TOGGLE_STUDY_MODE" }
  | { type: "STUDY_FLIP" }
  | { type: "STUDY_PREV" }
  | { type: "STUDY_NEXT" }
  | { type: "SET_THINKING"; payload: boolean };

// ─── Reducer ──────────────────────────────────────────────────────────────────

let _msgId = 0;
export function genId() {
  return "m" + ++_msgId;
}

function reducer(state: DocState, action: Action): DocState {
  switch (action.type) {
    case "SET_INPUT":
      return { ...state, input: action.payload };

    case "SEND_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload.userMsg, action.payload.aiMsg],
        input: "",
        thinking: true,
      };

    case "UPDATE_AI_TEXT":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, text: action.payload.text } : m
        ),
      };

    case "FINISH_AI_MSG":
      return {
        ...state,
        thinking: false,
        messages: state.messages.map((m) =>
          m.id === action.payload.id
            ? { ...m, text: action.payload.text, streaming: false, cites: action.payload.cites }
            : m
        ),
      };

    case "SET_THINKING":
      return { ...state, thinking: action.payload };

    case "NEW_CHAT":
      return { ...state, messages: [], input: "", thinking: false };

    case "OPEN_DOC":
      return { ...state, activeDocId: action.payload, showViewer: true, viewerPage: 1, flashHi: null };

    case "TOGGLE_CONTEXT":
      return {
        ...state,
        docs: state.docs.map((d) =>
          d.id === action.payload ? { ...d, inContext: !d.inContext } : d
        ),
      };

    case "SET_VIEWER_PAGE":
      return { ...state, viewerPage: action.payload };

    case "SET_FLASH_HI":
      return { ...state, flashHi: action.payload };

    case "SHOW_VIEWER":
      return { ...state, showViewer: action.payload };

    case "SET_DRAG_OVER":
      return { ...state, dragOver: action.payload };

    case "ADD_UPLOAD":
      return { ...state, docs: [...state.docs, action.payload] };

    case "REPLACE_UPLOAD":
      return {
        ...state,
        docs: state.docs.map((d) =>
          d.id === action.payload.tempId ? action.payload.doc : d
        ),
        activeDocId:
          state.activeDocId === action.payload.tempId
            ? action.payload.doc.id
            : state.activeDocId,
      };

    case "UPLOAD_PROGRESS":
      return {
        ...state,
        docs: state.docs.map((d) =>
          d.id === action.payload.id ? { ...d, progress: action.payload.progress } : d
        ),
      };

    case "UPLOAD_DONE":
      return {
        ...state,
        docs: state.docs.map((d) =>
          d.id === action.payload ? { ...d, status: "ready", progress: 100 } : d
        ),
      };

    case "OPEN_FLASHCARDS":
      return { ...state, cards: action.payload, flipped: {}, studyMode: false, studyIndex: 0, studyFlipped: false };

    case "TOGGLE_FLIP":
      return { ...state, flipped: { ...state.flipped, [action.payload]: !state.flipped[action.payload] } };

    case "SHUFFLE_CARDS": {
      const c = [...state.cards];
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return { ...state, cards: c, flipped: {}, studyIndex: 0, studyFlipped: false };
    }

    case "TOGGLE_STUDY_MODE":
      return { ...state, studyMode: !state.studyMode, studyIndex: 0, studyFlipped: false };

    case "STUDY_FLIP":
      return { ...state, studyFlipped: !state.studyFlipped };

    case "STUDY_PREV":
      return { ...state, studyIndex: Math.max(0, state.studyIndex - 1), studyFlipped: false };

    case "STUDY_NEXT":
      return { ...state, studyIndex: Math.min(state.cards.length - 1, state.studyIndex + 1), studyFlipped: false };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface DocContextValue {
  state: DocState;
  activeDoc: MindNestDocument;
  send: (text?: string) => void;
  openCite: (c: Citation) => void;
  openFlashcards: () => void;
  dispatch: React.Dispatch<Action>;
  streamTimer: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  thinkTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

const DocContext = createContext<DocContextValue | null>(null);

export function useDocContext() {
  const ctx = useContext(DocContext);
  if (!ctx) throw new Error("useDocContext must be used inside DocumentProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const SEED_DOCS = seedDocs();

export function DocumentProvider({
  children,
  initialActiveDocId,
}: {
  children: ReactNode;
  initialActiveDocId?: string;
}) {
  const [state, dispatch] = useReducer(reducer, {
    docs: SEED_DOCS,
    activeDocId: initialActiveDocId ?? SEED_DOCS[0]?.id ?? "sleep",
    messages: [],
    input: "",
    thinking: false,
    showViewer: true,
    viewerPage: 1,
    flashHi: null,
    dragOver: false,
    cards: [],
    flipped: {},
    studyMode: false,
    studyIndex: 0,
    studyFlipped: false,
  });

  const streamTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeDoc =
    state.docs.find((d) => d.id === state.activeDocId) ?? state.docs[0];

  const send = useCallback(
    (raw?: string) => {
      const text = (raw ?? state.input).trim();
      if (!text || state.thinking) return;

      const contextDocIds = state.docs.filter((d) => d.inContext).map((d) => d.id);

      const uId = genId();
      const aId = genId();

      dispatch({
        type: "SEND_MESSAGE",
        payload: {
          userMsg: { id: uId, role: "user", text },
          aiMsg: { id: aId, role: "ai", text: "", streaming: true },
        },
      });

      if (contextDocIds.length === 0) {
        dispatch({
          type: "FINISH_AI_MSG",
          payload: {
            id: aId,
            text: "Please add at least one document to the chat context (use the checkboxes in the sidebar).",
            cites: [],
          },
        });
        return;
      }

      api
        .chat({ query: text, document_ids: contextDocIds })
        .then((resp) => {
          const cites: Citation[] = resp.sources.map((s) => ({
            doc: s.document_id,
            page: s.page_number,
            hi: "",
            snippet: "",
          }));
          dispatch({
            type: "FINISH_AI_MSG",
            payload: { id: aId, text: resp.answer, cites },
          });
        })
        .catch(() => {
          dispatch({
            type: "FINISH_AI_MSG",
            payload: {
              id: aId,
              text: "Something went wrong reaching the server. Make sure the backend is running.",
              cites: [],
            },
          });
        });
    },
    [state.input, state.thinking, state.docs]
  );

  const openCite = useCallback(
    (c: Citation) => {
      if (c.doc !== state.activeDocId || !state.showViewer) {
        dispatch({ type: "OPEN_DOC", payload: c.doc });
        setTimeout(() => {
          dispatch({ type: "SET_VIEWER_PAGE", payload: c.page });
          dispatch({ type: "SET_FLASH_HI", payload: null });
          setTimeout(() => dispatch({ type: "SET_FLASH_HI", payload: c.hi || null }), 30);
        }, 80);
      } else {
        dispatch({ type: "SET_VIEWER_PAGE", payload: c.page });
        dispatch({ type: "SET_FLASH_HI", payload: null });
        setTimeout(() => dispatch({ type: "SET_FLASH_HI", payload: c.hi || null }), 30);
      }
    },
    [state.activeDocId, state.showViewer]
  );

  const openFlashcards = useCallback(() => {
    dispatch({ type: "OPEN_FLASHCARDS", payload: seedFlashcards() });
  }, []);

  return (
    <DocContext.Provider
      value={{ state, activeDoc, send, openCite, openFlashcards, dispatch, streamTimer, thinkTimer }}
    >
      {children}
    </DocContext.Provider>
  );
}
