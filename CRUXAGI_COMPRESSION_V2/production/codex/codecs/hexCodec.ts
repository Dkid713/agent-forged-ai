// CRUXAGI_COMPRESSION_V2/production/codex/codecs/hexCodec.ts
// Lightweight hexadecimal representation codec.

function toHex(byte: number): string {
  return byte.toString(16).padStart(2, "0");
}

export function runHexCodec(message: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(message);
  let result = "";
  for (const byte of bytes) {
    result += toHex(byte);
  }
  return result;
}
