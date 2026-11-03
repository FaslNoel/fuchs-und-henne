# Project memory

## Product intent & audience

- Game application with a cross-shaped grid-based board (Spielfeld) and piece movement logic.
- Tutorial/onboarding text exists, instructs players on movement rules.
- Language: German (UI, tutorial, assistant communication).

## Brand personality & voice

- Helpful, methodical assistant voice: explains steps before executing, reads code before changing it.
- Asks clarifying questions when changes may have unintended side effects.

## Visual design & UX direction

- Board renders lines between adjacent cells (horizontal + vertical).
- Diagonal lines exist within the arms of the cross; diagonal lines at the inner corners (Einbuchtungen) have been removed per user request.
- Diagonal lines are purely cosmetic so far — no gameplay rule change.
- Responsive build verification is part of the workflow.

## Decisions, constraints & rationale

- Diagonal lines at inner corners of the cross removed; diagonals within arms retained.
- Movement rules unchanged: pieces can still move diagonally even where visual lines were removed (fox can jump across corners without a line).
- Rationale: user asked only to remove corner diagonal lines visually, not to change movement rules.
- Build confirmed error-free after change.

## Open questions & assumptions

- Unresolved: Should diagonal movement be blocked at locations where diagonal lines were removed, or keep movement independent of visual lines?
- Tutorial currently states "Es gibt keine Diagonalzüge" — still potentially misleading given remaining visual diagonals and actual diagonal movement; needs reconciliation.
- Framework tag `DEFAULT_TO_DEV` observed; assumed relevant to dev/build workflow.