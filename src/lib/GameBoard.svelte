<script lang="ts">
  import {
    type Board,
    type Position,
    type MoveDest,
  } from './foxGame';

  interface BoardProps {
    board: Board;
    selected: Position | null;
    validDests: MoveDest[];
    mustJumpFrom: Position | null;
    lastMove: { from: Position; to: Position } | null;
    foxActive: boolean;
    henActiveAt: (r: number, c: number) => boolean;
    pieceAt: (r: number, c: number) => 'fox' | 'hen' | null;
    isSelected: (r: number, c: number) => boolean;
    isDest: (r: number, c: number) => boolean;
    isCaptureDest: (r: number, c: number) => boolean;
    isLastMove: (r: number, c: number) => boolean;
    onCellClick: (r: number, c: number) => void;
    ariaLabel: string;
    highlightPositions?: Position[];
  }

  let {
    board,
    selected,
    validDests,
    mustJumpFrom,
    lastMove,
    foxActive,
    henActiveAt,
    pieceAt,
    isSelected,
    isDest,
    isCaptureDest,
    isLastMove,
    onCellClick,
    ariaLabel,
    highlightPositions = [],
  }: BoardProps = $props();

  import { getValidPositions, getConnections } from './foxGame';

  const validPositions = getValidPositions();
  const connections = getConnections();

  function isHighlighted(r: number, c: number): boolean {
    return highlightPositions.some((p) => p.row === r && p.col === c);
  }
</script>

<svg
  class="game-board"
  viewBox="0 0 480 480"
  role="img"
  aria-label={ariaLabel}
>
  <rect x="120" y="0" width="240" height="480" rx="12" class="board-bg-arm" />
  <rect x="0" y="120" width="480" height="240" rx="12" class="board-bg-arm" />
  <rect x="120" y="120" width="240" height="240" class="board-bg-center" />

  {#each connections as [a, b]}
    <line
      x1={60 + a.col * 60}
      y1={60 + a.row * 60}
      x2={60 + b.col * 60}
      y2={60 + b.row * 60}
      class="connection-line"
    />
  {/each}

  {#each validPositions as pos}
    {@const px = 60 + pos.col * 60}
    {@const py = 60 + pos.row * 60}
    {@const piece = pieceAt(pos.row, pos.col)}
    {@const sel = isSelected(pos.row, pos.col)}
    {@const dest = isDest(pos.row, pos.col)}
    {@const capture = isCaptureDest(pos.row, pos.col)}
    {@const lastM = isLastMove(pos.row, pos.col)}
    {@const hl = isHighlighted(pos.row, pos.col)}
    {@const henActive = henActiveAt(pos.row, pos.col)}

    <circle cx={px} cy={py} r="5" class="node-dot" />

    {#if hl}
      <circle cx={px} cy={py} r="28" class="tutorial-highlight-ring" />
    {/if}

    {#if lastM}
      <circle cx={px} cy={py} r="26" class="last-move-ring" />
    {/if}

    {#if foxActive && piece === 'fox'}
      <circle cx={px} cy={py} r="30" class="active-piece-ring" />
    {/if}

    {#if henActive}
      <circle cx={px} cy={py} r="28" class="active-piece-ring subtle" />
    {/if}

    {#if sel}
      <circle cx={px} cy={py} r="30" class="selected-ring" />
    {/if}

    {#if mustJumpFrom && piece === 'fox'}
      <circle cx={px} cy={py} r="30" class="must-jump-ring" />
    {/if}

    {#if dest}
      <circle
        cx={px}
        cy={py}
        r={capture ? '24' : '22'}
        class:dest-marker={!capture}
        class:capture-marker={capture}
        onclick={() => onCellClick(pos.row, pos.col)}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCellClick(pos.row, pos.col); }}
        role="button"
        tabindex="0"
      />
    {/if}

    {#if piece === 'fox'}
      <g
        class="piece piece-fox"
        class:piece-selected={sel}
        class:piece-movable={foxActive}
        class:piece-must-jump={!!mustJumpFrom}
        onclick={() => onCellClick(pos.row, pos.col)}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCellClick(pos.row, pos.col); }}
        role="button"
        tabindex="0"
      >
        <circle cx={px} cy={py} r="22" class="piece-bg fox-bg" />
        <text x={px} y={py} class="piece-emoji" text-anchor="middle" dominant-baseline="central">🦊</text>
      </g>
    {:else if piece === 'hen'}
      <g
        class="piece piece-hen"
        class:piece-selected={sel}
        class:piece-movable={henActive}
        onclick={() => onCellClick(pos.row, pos.col)}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCellClick(pos.row, pos.col); }}
        role="button"
        tabindex="0"
      >
        <circle cx={px} cy={py} r="20" class="piece-bg hen-bg" />
        <text x={px} y={py} class="piece-emoji" text-anchor="middle" dominant-baseline="central">🐔</text>
      </g>
    {/if}

    {#if !piece && !dest}
      <circle
        cx={px}
        cy={py}
        r="26"
        class="clickable-area"
        onclick={() => onCellClick(pos.row, pos.col)}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCellClick(pos.row, pos.col); }}
        role="button"
        tabindex="0"
      />
    {/if}
  {/each}
</svg>

<style>
  .game-board {
    width: 100%;
    max-width: 480px;
    height: auto;
    display: block;
  }

  .board-bg-arm {
    fill: #4a6b3a;
  }

  .board-bg-center {
    fill: #3e5e2e;
  }

  .connection-line {
    stroke: rgba(255, 255, 255, 0.15);
    stroke-width: 2;
  }

  .node-dot {
    fill: rgba(255, 255, 255, 0.2);
  }

  .last-move-ring {
    fill: none;
    stroke: rgba(120, 180, 255, 0.4);
    stroke-width: 2;
    stroke-dasharray: 4 4;
  }

  .selected-ring {
    fill: rgba(123, 184, 255, 0.15);
    stroke: #7bb8ff;
    stroke-width: 4;
    animation: selectPulse 0.8s ease-in-out infinite;
    filter: drop-shadow(0 0 6px rgba(123, 184, 255, 0.8));
  }

  @keyframes selectPulse {
    0%, 100% { stroke-opacity: 1; stroke-width: 4; }
    50% { stroke-opacity: 0.5; stroke-width: 5.5; }
  }

  .dest-marker {
    fill: rgba(123, 184, 255, 0.42);
    stroke: rgba(123, 184, 255, 0.6);
    stroke-width: 2;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      fill: rgba(123, 184, 255, 0.55);
    }
  }

  .capture-marker {
    fill: rgba(255, 100, 80, 0.2);
    stroke: rgba(255, 100, 80, 0.7);
    stroke-width: 2.5;
    stroke-dasharray: 5 3;
    cursor: pointer;
    animation: capturePulse 1.2s ease-in-out infinite;

    &:hover {
      fill: rgba(255, 100, 80, 0.4);
    }
  }

  @keyframes capturePulse {
    0%, 100% { stroke-opacity: 0.7; }
    50% { stroke-opacity: 1; }
  }

  .clickable-area {
    fill: transparent;
    cursor: pointer;
  }

  .piece {
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .piece-selected {
    animation: pieceBounce 0.5s ease-in-out infinite;
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
  }

  @keyframes pieceBounce {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-5px) scale(1.12); }
  }

  .piece-bg {
    transition: all 0.2s;
  }

  .fox-bg {
    fill: rgba(224, 122, 60, 0.25);
    stroke: var(--fox-color, #e07a3c);
    stroke-width: 2.5;
  }

  .hen-bg {
    fill: rgba(240, 208, 80, 0.2);
    stroke: var(--hen-dark, #c4a030);
    stroke-width: 2;
  }

  .piece-selected .hen-bg {
    fill: rgba(240, 208, 80, 0.45);
    stroke: var(--hen-light, #fae890);
    stroke-width: 3;
  }

  .piece-selected .fox-bg {
    fill: rgba(224, 122, 60, 0.45);
    stroke: var(--fox-light, #f4a86a);
    stroke-width: 3.5;
  }

  .must-jump-ring {
    fill: rgba(255, 100, 80, 0.12);
    stroke: rgba(255, 100, 80, 0.8);
    stroke-width: 4;
    stroke-dasharray: 7 4;
    animation: mustJumpPulse 0.6s ease-in-out infinite;
    filter: drop-shadow(0 0 8px rgba(255, 100, 80, 0.6));
  }

  @keyframes mustJumpPulse {
    0%, 100% { stroke-opacity: 1; stroke-width: 4; }
    50% { stroke-opacity: 0.4; stroke-width: 6; }
  }

  .piece-must-jump {
    animation: pieceBounce 0.5s ease-in-out infinite;
    filter: drop-shadow(0 0 10px rgba(255, 100, 80, 0.7));
  }

  .piece-must-jump .fox-bg {
    fill: rgba(255, 100, 80, 0.3);
    stroke: rgba(255, 120, 100, 0.9);
    stroke-width: 3.5;
  }

  .active-piece-ring {
    fill: none;
    stroke: rgba(255, 255, 255, 0.6);
    stroke-width: 2.5;
    stroke-dasharray: 6 4;
    animation: activeRingSpin 4s linear infinite;
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.4));
  }

  .active-piece-ring.subtle {
    stroke: rgba(255, 255, 255, 0.3);
    stroke-width: 1.5;
  }

  @keyframes activeRingSpin {
    from { stroke-dashoffset: 0; }
    to { stroke-dashoffset: 40; }
  }

  .piece-movable {
    animation: movableHint 1.8s ease-in-out infinite;
  }

  @keyframes movableHint {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3)); }
    50% { filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.7)); }
  }

  .piece-emoji {
    font-size: 24px;
    pointer-events: none;
    user-select: none;
  }

  .tutorial-highlight-ring {
    fill: none;
    stroke: var(--tutorial-accent, #5a9fd4);
    stroke-width: 3;
    stroke-dasharray: 5 3;
    animation: tutorialHighlightPulse 1.5s ease-in-out infinite;
  }

  @keyframes tutorialHighlightPulse {
    0%, 100% { stroke-opacity: 0.8; transform: scale(1); }
    50% { stroke-opacity: 0.3; }
  }
</style>
