# The Pursuit of Reuse: Pattern Recognition as the Path to Repeated Success

Good software reuse is not about sharing code — it's about sharing *recognizable patterns*. When users (developers, architects, operators) encounter a familiar structure, they move faster, make fewer mistakes, and build with confidence. The goal of reuse is **cognitive economy**: the accumulated return on a pattern users have already learned.

The risk: extracting too early, before a pattern has proven itself, produces a false familiarity that misleads more than it guides.

---

## What makes reuse valuable

A reused element earns its place when:
- Users can **recognize it** without reading documentation
- Its behavior is **predictable** across all sites of use
- It **absorbs change** in one place rather than many
- It carries a **name** that belongs to the domain, not the implementation

---

## When the pursuit goes wrong

**1. Abstracting from appearance, not change reason (Sandi Metz)**
Two things look the same, so they're merged. But similarity in structure doesn't mean similarity in *why they change*. The shared helper accumulates `if type == X` branches until it's worse than the original duplication.

**2. The premature base class**
Two entities share 4 fields today. A base class is extracted. Six months later one entity needs to change those fields for compliance reasons — now you fight the hierarchy to do it. The pattern recognition was real; the stability was not.

**3. Promoting a utility to a shared library after one consumer**
A utility enters `platform/shared` before a second real consumer exists. The second consumer needs a variant; now you either break the first or add a parameter that's really a code smell. The library now works against the reuse goal it was built for.

**4. Generic infrastructure for a specific problem**
A plugin system or event bus is built because "we'll have 10 integrations someday." You now maintain framework complexity for two integrations that could have been if-statements. The pattern users recognize is *over-engineering*, not elegance.

**5. DRY applied to coincidental duplication**
Two validation functions look identical. They're merged. Business rules diverge — address validation changes, name validation doesn't. Merging destroyed the ability of each rule to evolve independently.

---

## Decoupling operates at multiple levels — and order matters

Decoupling is not a single act. It exists at several distinct levels:

| Level | Examples |
|---|---|
| **Deployment** | separate services, containers, release pipelines |
| **Data** | separate schemas, separate ownership of tables |
| **Process / team** | independent backlogs, separate on-call, Conway's Law alignment |
| **Code** | modules, packages, shared libraries, base classes |

The mistake is treating code-level decoupling as the *starting point* when coming from a monolith. It is often the last step, not the first.

**Why the order matters:** code-level decoupling that precedes deployment or data decoupling creates the *illusion* of independence. Two services that share a database are not decoupled — they are a distributed monolith with extra latency. Extracting a shared library before the consuming teams have separate release cycles just moves a compile-time coupling into a versioned dependency with slower feedback.

A better sequence when breaking apart a monolith:

1. **Identify bounded contexts** — where do change reasons actually diverge?
2. **Decouple the team and process boundary first** — separate backlogs, separate ownership
3. **Decouple the data** — each context owns its tables; no cross-schema joins
4. **Decouple the deployment** — independent build and release pipelines
5. **Decouple the code last** — now the boundaries are proven and stable enough to encode in module structure

Code-level decoupling done last is a *consequence* of the higher-level decoupling, and it will be correct because it reflects boundaries that have already been validated by reality.

Code-level decoupling done first is speculation about where the boundaries should be — and speculation crystallizes into tech debt.

---

## The right heuristic

> **Rule of Three**: let a pattern appear three times before extracting it. Two occurrences is still a coincidence; three is evidence of a real concept worth naming.

Extraction is not the reward for noticing similarity — it's the reward for *understanding why the similarity will persist*.
