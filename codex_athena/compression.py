"""Implementation of the Codex Athena dictionary based compression scheme.

The compressor uses a lightweight token dictionary optimised for natural
language text.  Tokens that provide a net byte saving are stored in a
fixed-size dictionary and are referenced in the body using a single byte.
Literals are stored with a small varint length prefix.  The resulting
payload is binary and starts with the ASCII magic ``ATH1`` followed by the
encoded dictionary and token stream.  All strings are encoded as UTF-8.

The module exposes :func:`compress` and :func:`decompress`, and a
:class:`CompressionStats` dataclass that can be used when testing or
benchmarking the codec.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List
import re
from collections import Counter

_MAGIC = b"ATH1"
_MAX_DICT_SIZE = 127  # because the high bit is reserved for dictionary refs

_TOKEN_RE = re.compile(r"[A-Za-z0-9]+|[^A-Za-z0-9]")


@dataclass(frozen=True)
class CompressionStats:
    """Statistics describing the outcome of a compression operation."""

    original_bytes: int
    compressed_bytes: int
    dictionary_size: int
    literal_tokens: int
    referenced_tokens: int

    @property
    def ratio(self) -> float:
        """Return the compression ratio (compressed/original)."""

        if self.original_bytes == 0:
            return 0.0
        return self.compressed_bytes / self.original_bytes


class CompressionError(ValueError):
    """Raised when the compressed payload is invalid."""


def _tokenise(text: str) -> List[str]:
    """Split *text* into tokens while preserving every character."""

    if not text:
        return []
    return _TOKEN_RE.findall(text)


def _encode_varint(value: int) -> bytes:
    if value < 0:
        raise ValueError("Varint cannot encode negative values")
    out = bytearray()
    while True:
        to_write = value & 0x7F
        value >>= 7
        if value:
            out.append(to_write | 0x80)
        else:
            out.append(to_write)
            break
    return bytes(out)


def _decode_varint(payload: bytes, offset: int) -> tuple[int, int]:
    shift = 0
    result = 0
    while True:
        if offset >= len(payload):
            raise CompressionError("Unexpected end of data while decoding varint")
        byte = payload[offset]
        offset += 1
        result |= (byte & 0x7F) << shift
        if not byte & 0x80:
            break
        shift += 7
        if shift > 63:
            raise CompressionError("Varint is too long")
    return result, offset


def _estimate_literal_cost(token: str) -> int:
    token_bytes = token.encode("utf-8")
    length_prefix = len(_encode_varint(len(token_bytes)))
    return 1 + length_prefix + len(token_bytes)


def _dictionary_candidates(tokens: Iterable[str]) -> List[str]:
    counts = Counter(tokens)
    candidates = []
    for token, count in counts.items():
        if count < 2:
            continue
        literal_cost = _estimate_literal_cost(token)
        token_bytes = token.encode("utf-8")
        dict_entry_cost = len(_encode_varint(len(token_bytes))) + len(token_bytes)
        savings = count * literal_cost - (dict_entry_cost + count)
        if savings <= 0:
            continue
        candidates.append((savings, len(token_bytes), token))
    # sort primarily by savings (descending), then by token length (descending) to
    # favour longer tokens, and finally lexicographically for determinism.
    candidates.sort(key=lambda item: (-item[0], -item[1], item[2]))
    return [token for _, _, token in candidates[:_MAX_DICT_SIZE]]


def compress(text: str) -> tuple[bytes, CompressionStats]:
    """Compress *text* and return the binary payload and stats.

    The payload is safe to persist to disk or transmit across the wire.  The
    compression statistics are useful in tests to assert on dictionary size or
    achieved ratio.
    """

    tokens = _tokenise(text)
    token_bytes = text.encode("utf-8")
    dictionary = _dictionary_candidates(tokens)
    dictionary_index = {token: idx for idx, token in enumerate(dictionary)}

    payload = bytearray()
    payload.extend(_MAGIC)
    payload.append(len(dictionary))

    for token in dictionary:
        encoded = token.encode("utf-8")
        payload.extend(_encode_varint(len(encoded)))
        payload.extend(encoded)

    literal_tokens = 0
    referenced_tokens = 0

    for token in tokens:
        idx = dictionary_index.get(token)
        if idx is not None:
            payload.append(0x80 | idx)
            referenced_tokens += 1
        else:
            payload.append(0x00)
            encoded = token.encode("utf-8")
            payload.extend(_encode_varint(len(encoded)))
            payload.extend(encoded)
            literal_tokens += 1

    stats = CompressionStats(
        original_bytes=len(token_bytes),
        compressed_bytes=len(payload),
        dictionary_size=len(dictionary),
        literal_tokens=literal_tokens,
        referenced_tokens=referenced_tokens,
    )
    return bytes(payload), stats


def decompress(payload: bytes) -> str:
    """Decompress a payload created by :func:`compress`."""

    if not payload.startswith(_MAGIC):
        raise CompressionError("Missing Codex Athena magic header")

    pos = len(_MAGIC)
    if pos >= len(payload):
        raise CompressionError("Payload truncated before dictionary size")
    dict_size = payload[pos]
    pos += 1

    dictionary: List[str] = []
    for _ in range(dict_size):
        length, pos = _decode_varint(payload, pos)
        end = pos + length
        if end > len(payload):
            raise CompressionError("Dictionary entry overruns payload")
        dictionary.append(payload[pos:end].decode("utf-8"))
        pos = end

    tokens: List[str] = []
    while pos < len(payload):
        marker = payload[pos]
        pos += 1
        if marker & 0x80:
            index = marker & 0x7F
            if index >= len(dictionary):
                raise CompressionError("Dictionary reference out of range")
            tokens.append(dictionary[index])
        elif marker == 0x00:
            length, pos = _decode_varint(payload, pos)
            end = pos + length
            if end > len(payload):
                raise CompressionError("Literal overruns payload")
            tokens.append(payload[pos:end].decode("utf-8"))
            pos = end
        else:
            raise CompressionError("Unknown marker byte in stream")

    return "".join(tokens)

