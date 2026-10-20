<script lang="ts">
  import { createBoard, getFoxMoves, getHenMovesForPiece, applyFoxMove, applyHenMove, type Board, type Position } from './foxGame';
  import { tutorialSteps } from './tutorialSteps';
  import GameBoard from './GameBoard.svelte';

  let { onExit }: { onExit: () => void } = $props();

  let tutorialStep = $state(0);
  let tutorialBoard: Board = $state(createBoard());
  let tutorialHighlight: Position[] = $state([]);
  let tutorialSelected: Position | null = $state(null);
  let tutorialDests: Position[] = $state([]);

  let isLastTutorialStep = $derived(tutorialStep === tutorialSteps.length - 1);

  function applyTutorialStep() {
    const step = tutorialSteps[tutorialStep];
    if (!step) return;
    tutorialSelected = null;
    tutorialDests = [];

    if (step.setupBoard) {
      tutorialBoard = step.setupBoard.map((r) => [...r]);
    } else {
      tutorialBoard = createBoard();
    }

    if (step.highlight) {
      tutorialHighlight = step.highlight;
    } else {
      tutorialHighlight = [];
    }
  }

  function nextTutorialStep() {
    if (tutorialStep < tutorialSteps.length - 1) {
      tutorialStep++;
      applyTutorialStep();
    } else {
      onExit();
    }
  }

  function prevTutorialStep() {
    if (tutorialStep > 0) {
      tutorialStep--;
      applyTutorialStep();
    }
  }

  function handleTutorialClick(r: number, c: number) {
    const step = tutorialSteps[tutorialStep];
    if (!step || !step.canInteract) return;

    if (tutorialDests.some((d) => d.row === r && d.col === c) && tutorialSelected) {
      const piece = tutorialBoard[tutorialSelected.row][tutorialSelected.col];
      if (piece === 'fox') {
        const foxMoves = getFoxMoves(tutorialBoard, tutorialSelected.row, tutorialSelected.col);
        const move = foxMoves.find((m) => m.to.row === r && m.to.col === c);
        if (move) {
          tutorialBoard = applyFoxMove(tutorialBoard, tutorialSelected, move);
          tutorialSelected = null;
          tutorialDests = [];
        }
      } else if (piece === 'hen') {
        tutorialBoard = applyHenMove(tutorialBoard, { from: tutorialSelected, to: { row: r, col: c } });
        tutorialSelected = null;
        tutorialDests = [];
      }
      tutorialHighlight = [];
      return;
    }

    if (step.interactionTarget && r === step.interactionTarget.row && c === step.interactionTarget.col) {
      if (tutorialSelected && tutorialSelected.row === r && tutorialSelected.col === c) {
        tutorialSelected = null;
        tutorialDests = [];
      } else {
        tutorialSelected = { row: r, col: c };
        const piece = tutorialBoard[r][c];
        if (piece === 'fox') {
          const moves = getFoxMoves(tutorialBoard, r, c);
          tutorialDests = moves.map((m) => m.to);
        } else if (piece === 'hen') {
          tutorialDests = getHenMovesForPiece(tutorialBoard, r, c);
        }
      }
      return;
    }

    const piece = tutorialBoard[r][c];
    if (piece) {
      if (tutorialSelected && tutorialSelected.row === r && tutorialSelected.col === c) {
        tutorialSelected = null;
        tutorialDests = [];
      } else {
        tutorialSelected = { row: r, col: c };
        if (piece === 'fox') {
          const moves = getFoxMoves(tutorialBoard, r, c);
          tutorialDests = moves.map((m) => m.to);
        } else if (piece === 'hen') {
          tutorialDests = getHenMovesForPiece(tutorialBoard, r, c);
        }
      }
    }
  }

  function tutorialPieceAt(r: number, c: number) {
    return tutorialBoard[r] ? tutorialBoard[r][c] : null;
  }

  function isTutorialSelected(r: number, c: number): boolean {
    return tutorialSelected?.row === r && tutorialSelected?.col === c;
  }

  function isTutorialDest(r: number, c: number): boolean {
    return tutorialDests.some((d) => d.row === r && d.col === c);
  }

  // Initialize first step
  applyTutorialStep();
</script>

<div class="play-screen tutorial-screen">
  <header class="game-header">
    <button type="button" class="back-btn" onclick={onExit}>← Menü</button>
    <span class="mode-label">Tutorial</span>
    <span class="move-counter">Schritt {tutorialStep + 1}/{tutorialSteps.length}</span>
  </header>

  <div class="tutorial-progress">
    {#each tutorialSteps as _, i}
      <div class="progress-dot" class:active={i === tutorialStep} class:done={i < tutorialStep}></div>
    {/each}
  </div>

  <div class="tutorial-card">
    <div class="tutorial-card-header">
      <span class="tutorial-card-icon">{tutorialSteps[tutorialStep].icon}</span>
      <h2>{tutorialSteps[tutorialStep].title}</h2>
    </div>
    <p class="tutorial-card-text">{tutorialSteps[tutorialStep].text}</p>
  </div>

  <div class="board-wrapper">
    {#key tutorialStep}
      <GameBoard
        board={tutorialBoard}
        selected={tutorialSelected}
        validDests={tutorialDests.map((d) => ({ row: d.row, col: d.col, capture: false }))}
        mustJumpFrom={null}
        lastMove={null}
        foxActive={false}
        henActiveAt={() => false}
        pieceAt={tutorialPieceAt}
        isSelected={isTutorialSelected}
        isDest={isTutorialDest}
        isCaptureDest={() => false}
        isLastMove={() => false}
        onCellClick={handleTutorialClick}
        ariaLabel="Tutorial Spielbrett"
        highlightPositions={tutorialHighlight}
      />
    {/key}
  </div>

  <div class="tutorial-nav">
    <button
      type="button"
      class="btn-secondary"
      onclick={prevTutorialStep}
      disabled={tutorialStep === 0}
    >
      ← Zurück
    </button>
    <button
      type="button"
      class="btn-primary"
      onclick={nextTutorialStep}
    >
      {isLastTutorialStep ? 'Fertig! 🎉' : 'Weiter →'}
    </button>
  </div>
</div>

<style>
  .tutorial-screen {
    max-width: 560px;
    width: 100%;
    padding: 12px 16px 24px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .game-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0 16px;

    .back-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.8);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
      }
    }

    .mode-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 500;
    }

    .move-counter {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.4);
      font-variant-numeric: tabular-nums;
    }
  }

  .tutorial-progress {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 16px;

    .progress-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      transition: all 0.3s ease;

      &.done {
        background: rgba(90, 159, 212, 0.6);
      }

      &.active {
        background: var(--tutorial-accent, #5a9fd4);
        transform: scale(1.4);
        box-shadow: 0 0 8px rgba(90, 159, 212, 0.5);
      }
    }
  }

  .tutorial-card {
    background: rgba(90, 159, 212, 0.08);
    border: 1px solid rgba(90, 159, 212, 0.2);
    border-radius: 14px;
    padding: 16px 20px;
    margin-bottom: 16px;
    animation: cardFadeIn 0.4s ease;

    .tutorial-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;

      .tutorial-card-icon {
        font-size: 24px;
      }

      h2 {
        font-size: 17px;
        color: #fff;
        margin: 0;
        font-weight: 600;
      }
    }

    .tutorial-card-text {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 160%;
      margin: 0;
    }
  }

  @keyframes cardFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .board-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
  }

  .tutorial-nav {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
  }

  .btn-primary,
  .btn-secondary {
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn-primary {
    background: #4a8f3a;
    color: #fff;

    &:hover {
      background: #5aa84a;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(74, 143, 58, 0.4);
    }
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.15);

    &:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #fff;
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  @media (max-width: 520px) {
    .tutorial-card {
      padding: 12px 16px;

      .tutorial-card-header h2 { font-size: 15px; }
      .tutorial-card-text { font-size: 13px; }
    }
  }
</style>
