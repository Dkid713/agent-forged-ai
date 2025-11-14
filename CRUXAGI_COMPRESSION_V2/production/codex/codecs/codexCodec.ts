// CRUXAGI_COMPRESSION_V2/production/codex/codecs/codexCodec.ts
// Dictionary-driven codec that blends hybrid compression with word-level
// substitution tokens for highly repetitive content.

import { runHybridCodec } from "./hybridCodec.js";

const WORD_PATTERN = /[A-Za-z0-9_]{4,}/g;

interface CandidateToken {
  token: string;
  value: string;
}

function buildDictionary(message: string): CandidateToken[] {
  const counts = new Map<string, number>();
  for (const match of message.matchAll(WORD_PATTERN)) {
    const word = match[0];
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  const candidates: CandidateToken[] = [];
  let index = 0;
  for (const [value, count] of counts) {
    if (count < 3) continue;
    const token = `⟦${index}⟧`;
    index += 1;
    candidates.push({ token, value });
  }

  return candidates;
}

function applyDictionary(message: string, dictionary: CandidateToken[]): string {
  if (dictionary.length === 0) {
    return message;
  }

  let result = message;
  for (const { token, value } of dictionary) {
    const pattern = new RegExp(value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "g");
    result = result.replace(pattern, token);
  }

  const header = dictionary
    .map(({ token, value }) => `${token}:${value}`)
    .join("|");

  return `⟦dict:${header}⟧${result}`;
}

export function runCodexCodec(message: string): string {
  const hybrid = runHybridCodec(message);
  const dictionary = buildDictionary(message);
  const dictionaryEncoded = applyDictionary(message, dictionary);

  const candidates = [message, hybrid, dictionaryEncoded];
  return candidates.reduce((shortest, current) =>
    current.length < shortest.length ? current : shortest
  );
}
