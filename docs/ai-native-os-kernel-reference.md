# AI-Native OS Kernel API and Developer Reference (v0.1)

This document summarizes the AI-Native OS Kernel API surface, security model, boot sequence, hardware abstraction layer, and developer tooling. It combines the kernel system call specification with the SDK-oriented developer guide provided in the v0.1 release.

## 1. Overview

The AI-Native OS treats compression, semantics, and agents as first-class primitives. Version v0.1 introduces:

- Sandboxed agent capabilities enforced through semantic ACLs.
- Deterministic boot sequencing that initializes compression dictionaries, the 6D scheduler, and the semantic filesystem.
- Error handling for compression, semantic deduplication, and scheduling operations.
- A Neural Fabric abstraction that unifies CPU/GPU/TPU memory for token-native workloads.
- Enhanced debugging and introspection for live agents and compression metadata.

## 2. Kernel API Surface (System Calls)

### 2.1 Agent Management

| Syscall | Signature | Description |
| --- | --- | --- |
| `agent_spawn` | `agent_id agent_spawn(semantic_graph* init_state)` | Creates a new agent initialized with a semantic graph. |
| `agent_terminate` | `int agent_terminate(agent_id id)` | Gracefully stops an agent and releases resources. |
| `agent_suspend` | `int agent_suspend(agent_id id)` | Suspends an agent and compresses its current state. |
| `agent_resume` | `int agent_resume(agent_id id)` | Decompresses and restores the suspended agent. |
| `agent_inspect` | `agent_state_t* agent_inspect(agent_id id)` | Introspects a running or suspended agent, returning its live semantic state. |
| `agent_coordinate_6d` | `int agent_coordinate_6d(agent_id id, double dimensions[6])` | Requests 6D-optimized scheduling for the agent. |
| `agent_wait_semantic` | `int agent_wait_semantic(condition_t condition)` | Blocks until a semantic condition occurs. |
| `agent_signal_semantic` | `int agent_signal_semantic(graph_event* evt)` | Emits a semantic event to notify other agents. |

### 2.2 Compression & Memory

| Syscall | Signature | Description |
| --- | --- | --- |
| `compress_alloc` | `void* compress_alloc(token_stream* data)` | Allocates compressed memory directly from tokenized input. |
| `compress_free` | `int compress_free(void* addr)` | Frees compressed memory. |
| `compress_debug_info` | `compression_debug_t* compress_debug_info(ref_t ref)` | Returns diagnostic data for a compressed object. |
| `semantic_dedupe` | `void* semantic_dedupe(semantic_graph* graph)` | Deduplicates identical semantic structures in memory. |
| `shared_compress` | `ref_t shared_compress(void* token_ref)` | Returns a shared compression reference to an existing structure. |
| `compress_stats` | `compression_info_t compress_stats()` | Returns compression ratios and deduplication metrics. |

**Error codes**

```c
#define E_COMPRESS_FAILED   -1 // Input data not compressible
#define E_SEMANTIC_CONFLICT -2 // Semantic deduplication collision
#define E_SCHEDULE_TIMEOUT  -3 // 6D scheduler could not find a valid slot
```

### 2.3 6D Scheduler Interface

| Syscall | Signature | Description |
| --- | --- | --- |
| `scheduler_register_agent` | `int scheduler_register_agent(agent_id id, double dimensions[6])` | Registers an agent with its initial 6D vector. |
| `scheduler_update_vector` | `int scheduler_update_vector(agent_id id, double new_dimensions[6])` | Updates an agent’s scheduling weights dynamically. |
| `scheduler_query_state` | `scheduler_state_t scheduler_query_state(agent_id id)` | Retrieves the current 6D slot assignment and metrics. |
| `scheduler_optimize_all` | `int scheduler_optimize_all()` | Recomputes agent placements in the tesseract space. |
| `scheduler_link_agents` | `int scheduler_link_agents(agent_id a, agent_id b, double semantic_similarity)` | Links agents for co-execution when semantic similarity is high. |

**6D dimensions**

1. Priority
2. GPU/TPU Availability
3. Memory Pressure
4. Semantic Similarity
5. Token Efficiency
6. Temporal Coordination

## 3. Security Model & Sandboxing

### 3.1 Agent Capabilities

Each agent holds a capability graph defining which concepts and resources it can access:

```c
typedef struct {
    agent_id owner;
    concept_t* allowed_concepts;
    compression_scope_t scope;
} agent_capability_t;
```

### 3.2 Sandbox Profiles

- **Strict**: No shared memory, limited semantic reads.
- **Shared**: Shared compression pool with ACL restrictions.
- **Collaborative**: Full semantic sharing under controlled graph links.

### 3.3 Security Syscalls

| Syscall | Signature | Description |
| --- | --- | --- |
| `agent_grant_capability` | `int agent_grant_capability(agent_id target, concept_t concept, capability_t cap)` | Grants a semantic permission. |
| `agent_revoke_capability` | `int agent_revoke_capability(agent_id target, concept_t concept)` | Revokes access to a concept. |
| `agent_audit_semantics` | `audit_log_t* agent_audit_semantics(agent_id id)` | Returns semantic access logs. |
| `agent_sandbox_config` | `int agent_sandbox_config(agent_id id, sandbox_profile_t* profile)` | Applies sandboxing parameters to an agent. |

### 3.4 Attack Mitigation

- Memory isolation through unique compressed namespaces per agent.
- Cache partitioning using token tagging to prevent side-channel inference.
- Execution quotas on compression rate and GPU cycles to prevent resource exhaustion.

## 4. Boot Sequence Specification

**Boot order**

1. Load compression dictionaries and initialize shared pools.
2. Initialize the 6D scheduler and tesseract coordination matrix.
3. Mount the semantic filesystem (graph-based storage).
4. Spawn system agents for coordination and logging.
5. Start user agents registered at boot time.

**Boot syscalls**

```c
int kernel_boot_init();
int kernel_boot_sequence(boot_stage_t stage);
int kernel_boot_complete();
```

## 5. Hardware Abstraction Layer (Neural Fabric)

The Neural Fabric Bridge provides unified access to CPU, GPU, and TPU memory regions, allowing tokenized data to flow directly into compute memory without intermediate decompression.

| API | Signature | Description |
| --- | --- | --- |
| `neural_fabric_alloc` | `void* neural_fabric_alloc(size_t gpu_mem)` | Allocates token-addressable memory on the neural fabric. |
| `neural_fabric_transfer` | `int neural_fabric_transfer(void* host, void* device)` | Moves compressed token data between CPU and GPU memory without decompression. |
| `neural_fabric_sync` | `int neural_fabric_sync()` | Ensures consistent state across all compute fabrics. |
| `neural_fabric_release` | `int neural_fabric_release(void* fabric_ref)` | Frees resources in the unified memory domain. |

## 6. Debugging & Introspection

| Syscall | Signature | Description |
| --- | --- | --- |
| `agent_inspect` | `agent_state_t* agent_inspect(agent_id id)` | Retrieves real-time agent state. |
| `compress_debug_info` | `compression_debug_t* compress_debug_info(ref_t ref)` | Returns details of compression blocks and dictionary stats. |
| `scheduler_trace` | `trace_t* scheduler_trace(agent_id id)` | Traces agent scheduling history and slot allocation over time. |

```c
typedef struct {
    double compression_ratio;
    double dedupe_efficiency;
    uint64_t reused_tokens;
    uint64_t conflicts;
} compression_debug_t;
```

## 7. Developer Reference Guide (v0.1)

### 7.1 Environment Requirements

- Compiler: GCC 13+ or Clang 15+.
- Libraries: `libcruxagi`, `libhive6d`, `libsemanticfs`.
- Hardware: GPU or TPU with unified memory support.
- OS: Linux-based AI-Native Kernel prototype (v0.1+).

### 7.2 Installation and Project Setup

```bash
git clone https://github.com/cruxagi/ai-native-sdk.git
cd ai-native-sdk
make install
export AINATIVE_SDK_PATH=/usr/local/ai-native-sdk

mkdir my_agent_app && cd my_agent_app
ainative init
ainative build
ainative run
```

Sample `ainative.yml`:

```yaml
project:
  name: my_agent_app
  version: 0.1
  entry: src/main.c
  capabilities:
    - graph_read
    - graph_write
    - compress_use
scheduler:
  priority: 0.8
  semantic_similarity: 0.9
```

### 7.3 Initialization Macros

```c
#define INIT_AGENT_ENV() \
    kernel_boot_init(); \
    kernel_boot_sequence(BOOT_STAGE_COMPRESS_DICTIONARIES); \
    kernel_boot_sequence(BOOT_STAGE_SCHEDULER); \
    kernel_boot_complete();

#define DEFINE_AGENT(name, init_graph) \
    agent_id name = agent_spawn(init_graph); \
    agent_coordinate_6d(name, (double[]){0.7, 0.6, 0.5, 0.8, 0.4, 0.3});
```

### 7.4 CLI Tools

- `ainative build`: Builds and compiles agents using CruxAGI compression libraries.
- `ainative run`: Executes the application with agent introspection.
- `ainative trace`: Displays 6D scheduling visualization.
- `ainative inspect`: Shows semantic graph structures in memory.
- `ainative debug --agent <id>`: Attach to a running agent.
- `ainative metrics --live`: Access live semantic metrics.
- `ainative profile --compression --scheduler`: Outputs compression ratios, deduplication hits, and scheduler utilization.

### 7.5 Integration Examples

**C agent example**

```c
#include <ai_native_kernel.h>

int main() {
    INIT_AGENT_ENV();
    semantic_graph* sg = load_semantic_state("init_agent.sg");
    DEFINE_AGENT(agent_core, sg);

    agent_capability_t cap = {
        .owner = agent_core,
        .allowed_concepts = concept_list({"data_in", "data_out"}),
        .scope = SCOPE_SHARED
    };
    agent_grant_capability(agent_core, concept("data_out"), CAP_WRITE);

    agent_wait_semantic(CONDITION_READY);
    trace_t* trace = scheduler_trace(agent_core);
    display_trace(trace);
}
```

**Python SDK example**

```python
from ainative import kernel, scheduler, compression, security, neural_fabric

kernel.boot_init()
kernel.boot_sequence("BOOT_STAGE_COMPRESS_DICTIONARIES")
kernel.boot_sequence("BOOT_STAGE_SCHEDULER")
kernel.boot_sequence("BOOT_STAGE_SEMANTIC_FS")
kernel.boot_complete()

sg = kernel.load_semantic_state("init_context.sg")
agent = kernel.agent_spawn(sg)
scheduler.agent_coordinate_6d(agent, [0.8, 0.6, 0.4, 0.9, 0.5, 0.3])

profile = security.SandboxProfile("STRICT")
security.agent_sandbox_config(agent, profile)
security.agent_grant_capability(agent, "read_semantic_fs", "READ")
security.agent_grant_capability(agent, "write_semantic_fs", "WRITE")

kernel.agent_wait_semantic("CONDITION_READY")
for cycle in range(3):
    tokens = compression.tokenize_data(f"semantic_task_cycle_{cycle}".encode())
    ref = compression.compress_alloc(tokens)
    compression.compress_free(ref)

neural_fabric_buffer = neural_fabric.alloc(64 * 1024 * 1024)
# ... perform GPU work ...
neural_fabric.release(neural_fabric_buffer)

kernel.agent_terminate(agent)
```

### 7.6 Best Practices

- Always initialize with `INIT_AGENT_ENV()` before spawning agents.
- Keep compression dictionaries persistent between runs for optimal reuse.
- Use sandbox profiles in early testing (strict mode recommended).
- Periodically audit agents with `agent_audit_semantics()`.
- Synchronize neural fabric memory before freeing GPU buffers.

## 8. Changelog Summary for v0.1

Version v0.1 lays the groundwork for secure, agent-based computing by making meaning, compression, and coordination kernel-level constructs. It introduces robust sandboxing, deterministic boot initialization, unified compute fabric access, and expanded debugging hooks for semantic workloads.
