// CRUXAGI_COMPRESSION_V2/production/codex/codecs/hybridCodec.ts
// Combines multiple codecs and selects the shortest result.

import { runHexCodec } from "./hexCodec.js";
import { runBracketCodec } from "./bracketCodec.js";

function bestByLength(candidates: string[]): string {
  return candidates.reduce((shortest, current) =>
    current.length < shortest.length ? current : shortest
  );
}

export function runHybridCodec(message: string): string {
  const baseline = message;
  const bracket = runBracketCodec(message);
  const hex = runHexCodec(message);

  return bestByLength([baseline, bracket, hex]);
}
