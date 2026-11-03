# Project memory

## Product intent & audience

- Game application with a grid-based board (Spielfeld) and piece movement logic.
- Tutorial/onboarding text exists, instructs players on movement rules.
- Language: German (UI, tutorial, assistant communication).

## Brand personality & voice

- Helpful, methodical assistant voice: explains steps before executing, reads code before changing it.
- Asks clarifying questions when changes may have unintended side effects.

## Visual design & UX direction

- Board renders lines between adjacent cells (horizontal + vertical).
- Newly added diagonal lines are visually subtler/dimmer than orthogonal lines to preserve readability.
- Diagonal lines are purely cosmetic so far — no gameplay rule change.
- Responsive build verification is part of the workflow.

## Decisions, constraints & rationale

- Diagonal lines drawn between all diagonally-adjacent cells, decorative only.
- Movement rules unchanged: pieces still move only horizontally and vertically.
- Rationale: user asked only for diagonal lines in the board, not diagonal movement.
- Build confirmed error-free after change.

## Open questions & assumptions

- Unresolved: Should diagonal *movement* also be enabled, or only update the tutorial text to reflect the visual change? User has not yet answered.
- Tutorial currently states "Es gibt keine Diagonalzüge" — now potentially misleading given the visual diagonals; needs reconciliation.
- Framework tag `DEFAULT_TO_DEV` observed; assumed relevant to dev/build workflow.