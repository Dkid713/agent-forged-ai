// CRUXAGI_COMPRESSION_V2/production/codex/codecs/bracketCodec.ts
// Replaces long whitespace runs with compact bracket tokens and
// normalises repeated punctuation.

const SPACE_PATTERN = / {2,}/g;
const NEWLINE_PATTERN = /\n{2,}/g;
const PUNCT_PATTERN = /(\.|!|\?){2,}/g;

export function runBracketCodec(message: string): string {
  let output = message.replace(SPACE_PATTERN, (match) => `[s${match.length}]`);
  output = output.replace(NEWLINE_PATTERN, (match) => `[n${match.length}]`);
  output = output.replace(PUNCT_PATTERN, (match) => `[p${match[0]}${match.length}]`);
  return output;
}
