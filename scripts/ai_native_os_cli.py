"""
AI-Native OS CLI Prototype (v0.1)

This script implements a runnable Python prototype for three core behaviors:
- CruxAGI-style compression (via LZMA)
- Hive6D agent coordination
- Agent spawning against a semantic graph context

Usage examples:
  python scripts/ai_native_os_cli.py compress input.txt output.xz
  python scripts/ai_native_os_cli.py compress input.txt output.xz --preset 6
  python scripts/ai_native_os_cli.py coordinate --agents 5 --dimensions 6 --seed 42
  python scripts/ai_native_os_cli.py spawn knowledge-graph-A
"""

import argparse
import json
import lzma
import os
import random
from typing import Dict, List, Optional


# -------------------------------
# Core Components
# -------------------------------


def validate_positive_int(value: str, *, name: str) -> int:
    parsed = int(value)
    if parsed <= 0:
        raise argparse.ArgumentTypeError(f"{name} must be a positive integer")
    return parsed


def validate_lzma_preset(value: str) -> int:
    preset = int(value)
    if not 0 <= preset <= 9:
        raise argparse.ArgumentTypeError("preset must be between 0 and 9 (inclusive)")
    return preset


def compress_alloc(input_data: bytes, preset: int = 6) -> Dict[str, object]:
    """Compress bytes using LZMA and return compressed data with ratio."""

    if not 0 <= preset <= 9:
        raise ValueError("LZMA preset must be between 0 and 9")

    compressed = lzma.compress(input_data, preset=preset)
    ratio = 1 - len(compressed) / len(input_data)
    return {"compressed_data": compressed, "ratio": ratio}


def hive6d_coordinate(
    num_agents: int = 10, dimensions: int = 6, seed: Optional[int] = None
) -> Dict[int, List[float]]:
    """Simulate Hive6D scheduling by assigning random slots to agents."""

    rng = random.Random(seed)
    assignments: Dict[int, List[float]] = {}
    for agent_id in range(1, num_agents + 1):
        assignments[agent_id] = [rng.random() for _ in range(dimensions)]
    return assignments


class SemanticGraph:
    def __init__(self, name: str):
        self.name = name
        self.nodes: List[str] = []


class Kernel:
    agent_counter = 0

    @classmethod
    def agent_spawn(cls, semantic_graph: SemanticGraph) -> Dict[str, object]:
        cls.agent_counter += 1
        agent_id = cls.agent_counter
        return {
            "agent_id": agent_id,
            "graph": semantic_graph.name,
            "status": "spawned",
        }


# -------------------------------
# CLI Command Handlers
# -------------------------------


def handle_compress(args: argparse.Namespace) -> None:
    if not os.path.exists(args.input):
        raise FileNotFoundError(f"Input file not found: {args.input}")

    with open(args.input, "rb") as input_file:
        data = input_file.read()

    if not data:
        raise ValueError("Input file is empty; nothing to compress.")

    result = compress_alloc(data, preset=args.preset)

    output_data = {
        "original_size": len(data),
        "compressed_size": len(result["compressed_data"]),
        "compression_ratio": round(result["ratio"] * 100, 2),
    }

    output_dir = os.path.dirname(os.path.abspath(args.output))
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with open(args.output, "wb") as output_file:
        output_file.write(result["compressed_data"])

    print(json.dumps(output_data, indent=2))


def handle_coordinate(args: argparse.Namespace) -> None:
    assignments = hive6d_coordinate(args.agents, args.dimensions, seed=args.seed)
    print(json.dumps(assignments, indent=2))


def handle_spawn(args: argparse.Namespace) -> None:
    graph = SemanticGraph(args.graph)
    agent_info = Kernel.agent_spawn(graph)
    print(json.dumps(agent_info, indent=2))


# -------------------------------
# CLI Setup
# -------------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="AI-Native OS CLI Prototype")
    subparsers = parser.add_subparsers(dest="command", required=True)

    parser_compress = subparsers.add_parser(
        "compress", help="Run CruxAGI compression simulation"
    )
    parser_compress.add_argument("input", help="Input file path")
    parser_compress.add_argument("output", help="Output compressed file path")
    parser_compress.add_argument(
        "--preset",
        type=validate_lzma_preset,
        default=6,
        help="LZMA compression preset (0-9)",
    )
    parser_compress.set_defaults(func=handle_compress)

    parser_coord = subparsers.add_parser(
        "coordinate", help="Run Hive6D coordination simulation"
    )
    parser_coord.add_argument(
        "--agents",
        type=lambda value: validate_positive_int(value, name="agents"),
        default=10,
        help="Number of agents",
    )
    parser_coord.add_argument(
        "--dimensions",
        type=lambda value: validate_positive_int(value, name="dimensions"),
        default=6,
        help="Number of scheduling dimensions",
    )
    parser_coord.add_argument(
        "--seed", type=int, default=None, help="Optional seed for reproducible slots"
    )
    parser_coord.set_defaults(func=handle_coordinate)

    parser_spawn = subparsers.add_parser(
        "spawn", help="Spawn a simulated AI agent"
    )
    parser_spawn.add_argument("graph", help="Semantic graph name or file")
    parser_spawn.set_defaults(func=handle_spawn)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
