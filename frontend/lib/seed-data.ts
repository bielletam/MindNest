import type { Flashcard, MindNestDocument } from "./types";

export function seedDocs(): MindNestDocument[] {
  return [
    {
      id: "mem",
      short: "Memory Systems",
      title: "Memory Systems",
      author: "Cognitive Psychology · Ch. 4",
      color: "#10b981",
      status: "ready",
      inContext: true,
      pages: [
        {
          n: 1,
          paras: [
            { head: true, text: "1 · The Multi-Store Model" },
            {
              text: "The classic multi-store model divides memory into three connected stores through which information flows in sequence.",
            },
            {
              hi: "m1",
              text: "Sensory memory briefly buffers raw input; working memory holds a small amount of it consciously; long-term memory stores whatever survives for the future.",
            },
            {
              text: "Information that is not attended to or rehearsed decays quickly and never makes it into durable storage at all.",
            },
          ],
        },
        {
          n: 2,
          paras: [
            { head: true, text: "2 · Working vs Long-Term Memory" },
            {
              hi: "m2",
              text: "Working memory is a limited workspace — roughly four chunks held for a handful of seconds — while long-term memory is effectively unlimited and can persist for decades.",
            },
            {
              text: "The bottleneck of cognition is working memory: we can only juggle a few items at once, which is exactly why chunking and external notes are so powerful.",
            },
          ],
        },
        {
          n: 3,
          paras: [
            { head: true, text: "3 · Consolidation" },
            {
              hi: "m3",
              text: "Consolidation transforms fragile new traces into stable long-term memories, a process that depends heavily on rest and, especially, on sleep.",
            },
            {
              text: "Retrieval itself reconsolidates a memory, which is why active recall strengthens learning far more than passive re-reading.",
            },
          ],
        },
        {
          n: 4,
          paras: [
            { head: true, text: "4 · Forgetting" },
            {
              text: "Forgetting is not simply failure; it is the brain prioritizing relevant information and discarding noise so the useful signal stays accessible.",
            },
            {
              text: "Spaced repetition works against forgetting by reactivating memories just as they begin to fade, resetting the forgetting curve each time.",
            },
          ],
        },
      ],
    },
    {
      id: "sleep",
      short: "Sleep & Learning",
      title: "Sleep & Learning",
      author: "Walker, 2021",
      color: "#3b82f6",
      status: "ready",
      inContext: true,
      pages: [
        {
          n: 1,
          paras: [
            { head: true, text: "1 · Sleep Is Active Processing" },
            {
              text: "For most of history, sleep was treated as the brain simply switching off. Modern neuroscience tells the opposite story: sleep is one of the most metabolically active and cognitively important states we ever enter.",
            },
            {
              hi: "s1",
              text: "Far from downtime, sleep is when the brain sorts, files, and strengthens what was learned while awake. Skip it, and the day's learning never fully sets.",
            },
            {
              text: "Across the night the brain cycles between slow-wave and REM stages, each contributing differently to how memories are stabilized and integrated with what we already know.",
            },
          ],
        },
        {
          n: 2,
          paras: [
            { head: true, text: "2 · Sleep-Dependent Consolidation" },
            {
              text: "Consolidation is the process by which freshly encoded, fragile memories become stable and resistant to interference from new information.",
            },
            {
              hi: "s2",
              text: "During slow-wave sleep the hippocampus replays newly encoded memories, gradually transferring them to neocortical networks for durable long-term storage.",
            },
            {
              text: "REM sleep appears to specialize in emotional and procedural memory, weaving new information into existing knowledge and, on occasion, surfacing genuinely creative connections.",
            },
          ],
        },
        {
          n: 3,
          paras: [
            { head: true, text: "3 · The Cost of Sleep Loss" },
            {
              hi: "s3",
              text: "A single night of poor sleep can reduce the hippocampus's ability to encode new information by roughly 40 percent, and also impairs retrieval of what was already learned.",
            },
            {
              text: "The practical implication is clear: protect your sleep around any period of intensive learning. Spacing study across several nights reliably beats cramming it into one.",
            },
          ],
        },
      ],
    },
    {
      id: "attn",
      short: "Attention & Perception",
      title: "Attention & Perception",
      author: "Lecture Notes",
      color: "#f59e0b",
      status: "ready",
      inContext: false,
      pages: [
        {
          n: 1,
          paras: [
            { head: true, text: "1 · Selective Attention" },
            {
              hi: "a1",
              text: "Selective attention determines what ever reaches memory in the first place; we encode only the small slice of the world we actually attend to.",
            },
            {
              text: "The cocktail-party effect shows we filter aggressively, yet salient cues — like our own name — can still break through an unattended channel.",
            },
          ],
        },
        {
          n: 2,
          paras: [
            { head: true, text: "2 · Divided Attention" },
            {
              text: "Trying to attend to two demanding tasks at once degrades performance on both; true multitasking is mostly rapid switching, and the switching has a measurable cost.",
            },
          ],
        },
        {
          n: 3,
          paras: [
            { head: true, text: "3 · Perception Builds Reality" },
            {
              text: "Perception is constructive: the brain infers a stable world from noisy, incomplete sensory data, leaning heavily on prior expectations to fill the gaps.",
            },
          ],
        },
      ],
    },
  ];
}

export function seedFlashcards(): Flashcard[] {
  return [
    {
      id: "f1",
      q: "What are the three stores in the multi-store model of memory?",
      a: "Sensory memory, working (short-term) memory, and long-term memory.",
      src: "Memory Systems · p.1",
      color: "#10b981",
    },
    {
      id: "f2",
      q: "What is the typical capacity of working memory?",
      a: "About four chunks of information, held for only a few seconds.",
      src: "Memory Systems · p.2",
      color: "#10b981",
    },
    {
      id: "f3",
      q: "What does consolidation do to a memory?",
      a: "It transforms fragile new traces into stable, durable long-term memories.",
      src: "Memory Systems · p.3",
      color: "#10b981",
    },
    {
      id: "f4",
      q: "Which sleep stage most drives consolidation of facts and events?",
      a: "Slow-wave (deep) sleep.",
      src: "Sleep & Learning · p.2",
      color: "#3b82f6",
    },
    {
      id: "f5",
      q: "What happens in the hippocampus during slow-wave sleep?",
      a: "It replays newly encoded memories and transfers them to neocortical networks.",
      src: "Sleep & Learning · p.2",
      color: "#3b82f6",
    },
    {
      id: "f6",
      q: "How much can a single poor night of sleep impair new encoding?",
      a: "By roughly 40 percent.",
      src: "Sleep & Learning · p.3",
      color: "#3b82f6",
    },
    {
      id: "f7",
      q: "Why does active recall beat passive re-reading?",
      a: "Retrieving a memory reconsolidates it, which strengthens it further.",
      src: "Memory Systems · p.3",
      color: "#10b981",
    },
    {
      id: "f8",
      q: "What role does selective attention play in memory?",
      a: "It determines what ever reaches memory in the first place.",
      src: "Attention & Perception · p.1",
      color: "#f59e0b",
    },
  ];
}

