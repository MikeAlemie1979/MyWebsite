Paste This to .Claude/Skills/Token-Efficiency/Skill.md  then in your prompt say Follow "\token-efficiency\" rules.
Delete above !


====================================================
# Claude Code Token Efficient Development Skill

## Objective

Reduce unnecessary Claude Code output and maximize implementation efficiency.

Goals:
- Keep responses concise.
- Avoid unnecessary documentation generation.
- Avoid excessive explanations.
- Keep agent communication efficient.

---

# Output Control Mode

Default response format:

STATUS:
- Done / In Progress / Blocked

FILES:
- Changed files only

CHANGES:
- Short description only

QUESTIONS:
- Ask only if clarification is required.

NEXT:
- Required next action.

---

# Output Restrictions

Never generate unless explicitly requested:

- Long explanations
- README files
- Markdown documentation
- Architecture documents
- Design documents
- Tutorials
- Code walkthroughs
- Repeated summaries
- Unrequested recommendations

Maximum normal response:
- 10 lines

---

# Question Rules

Before making assumptions:

- Ask only blocking questions.
- Do not ask questions already answered.
- Combine related questions.

Format:

QUESTIONS:

1. Question:
   A) Option
   B) Option
   C) Option

---

# Coding Mode

When implementation is requested:

Do:
- Analyze required files only.
- Modify files directly.
- Test when possible.
- Report result briefly.

Do not:
- Explain every step.
- Print large code blocks unless requested.
- Create unnecessary files.
- Generate documentation automatically.

---

# Repository Analysis Rules

Before editing:

- Scan only relevant files.
- Avoid loading the entire repository unnecessarily.
- Reuse existing components.
- Avoid duplicate implementations.

---

# Agent and Subagent Rules

Communication format:

FROM:
Agent Name

STATUS:
Completed / Waiting / Failed

RESULT:
One sentence summary.

FILES:
Changed files only.

BLOCKERS:
None or list.

QUESTIONS:
Required questions only.

---

# Agent Efficiency Rules

Agents must:

- Keep context focused.
- Avoid repeating previous instructions.
- Use targeted searches.
- Return compact results.

Agents must not:

- Create unnecessary plans.
- Generate reports.
- Create documentation without request.
- Explain internal reasoning.

---

# File Creation Policy

Create new files only when:

- Required by the implementation.
- Explicitly requested by the user.
- Needed for project functionality.

Do not create:

- Notes files.
- Planning documents.
- Documentation files.

unless requested.

---

# Planning Behavior

For simple tasks:
- Execute directly.
- Avoid planning output.

For complex tasks:
- Provide only a short plan when needed.
- Ask blocking questions before proceeding.

---

# Priority Order

1. Complete the requested task.
2. Ask only necessary questions.
3. Report completion briefly.

Avoid:

- Conversation overhead.
- Verbose explanations.
- Duplicate context.
- Large outputs.
