import pytest

from codex_athena import compress, decompress, CompressionStats
from codex_athena.compression import CompressionError


def test_round_trip_basic():
    text = "The quick brown fox jumps over the lazy dog. " * 3
    payload, stats = compress(text)

    assert isinstance(stats, CompressionStats)
    assert stats.original_bytes == len(text.encode("utf-8"))
    assert stats.referenced_tokens > 0
    assert stats.dictionary_size > 0

    restored = decompress(payload)
    assert restored == text


def test_compression_ratio_improves_for_repetition():
    text = "Athena loves compression! " * 25
    payload, stats = compress(text)

    # The codec should beat the raw size for extremely repetitive input.
    assert stats.compressed_bytes < len(text.encode("utf-8"))
    assert stats.ratio < 1.0

    assert decompress(payload) == text


def test_handles_unicode_and_spacing():
    text = "🚀 Athena\nΔόξα  \\n" * 5
    payload, stats = compress(text)

    assert stats.dictionary_size > 0
    assert decompress(payload) == text


def test_invalid_magic_header():
    with pytest.raises(CompressionError):
        decompress(b"XXXX")


def test_corrupted_literal_stream_raises_error():
    text = "repeat me " * 5
    payload, _ = compress(text)

    # Replace the final byte with a literal marker without any length payload.
    corrupted = payload[:-1] + b"\x00"
    with pytest.raises(CompressionError):
        decompress(corrupted)


def test_empty_input():
    payload, stats = compress("")
    assert stats.original_bytes == 0
    assert stats.compressed_bytes == len(payload)
    assert stats.dictionary_size == 0
    assert stats.literal_tokens == 0
    assert stats.referenced_tokens == 0
    assert decompress(payload) == ""

