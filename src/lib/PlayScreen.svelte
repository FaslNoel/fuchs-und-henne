<script lang="ts">
  import { gameState, isAITurn, isPlayerTurn, isFoxActive, isHenActive, pieceAt, isSelected, isDest, isCaptureDest, isLastMove, handleClick, doAIMove, getPlayerInstruction, backToMenu, startGame } from './gameState.svelte';
  import { countHens } from './foxGame';
  import GameBoard from './GameBoard.svelte';
  import StatusBar from './StatusBar.svelte';
  import GameOver from './GameOver.svelte';

  let aiThinking = $state(false);

  let henCount = $derived(countHens(gameState.board));

  function scheduleAI() {
    aiThinking = true;
    setTimeout(() => {
      doAIMove();
      aiThinking = false;
      if (gameState.state === 'playing' && isAITurn()) {
        scheduleAI();
      }
    }, 650);
  }

  // React to turn changes — schedule AI when it's the AI's turn
  $effect(() => {
    if (gameState.state === 'playing' && isAITurn() && !aiThinking && !gameState.winner) {
      scheduleAI();
    }
  });

  function onCellClick(r: number, c: number) {
    handleClick(r, c, aiThinking);
  }
</script>

<div class="play-screen">
  <StatusBar {henCount} captured={gameState.captured} moveCount={gameState.moveCount} />

  <div class="board-wrapper">
    {#key gameState.moveCount}
      <GameBoard
        board={gameState.board}
        selected={gameState.selected}
        validDests={gameState.validDests}
        mustJumpFrom={gameState.mustJumpFrom}
        lastMove={gameState.lastMove}
        foxActive={isFoxActive()}
        henActiveAt={isHenActive}
        {pieceAt}
        {isSelected}
        {isDest}
        {isCaptureDest}
        {isLastMove}
        onCellClick={onCellClick}
        ariaLabel="Spielbrett"
      />
    {/key}
  </div>

  <div class="instruction-bar">
    {#if aiThinking}
      <span class="thinking-dots"><span></span><span></span><span></span></span>
      <span>{getPlayerInstruction(aiThinking)}</span>
    {:else if gameState.winner}
      <span></span>
    {:else if !isPlayerTurn()}
      <span class="ai-turn-text">Gegner ist am Zug…</span>
    {:else}
      <span>{getPlayerInstruction(aiThinking)}</span>
    {/if}
  </div>

  {#if gameState.state === 'over'}
    <GameOver winner={gameState.winner!} captured={gameState.captured} mode={gameState.mode} />
  {/if}
</div>

<style>
  .play-screen {
    width: 100%;
    max-width: 560px;
    padding: 12px 16px 24px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .board-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
  }

  .instruction-bar {
    text-align: center;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.6);
    padding: 8px;
    min-height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .ai-turn-text {
    color: rgba(255, 255, 255, 0.4);
    font-style: italic;
  }

  .thinking-dots {
    display: inline-flex;
    gap: 4px;

    span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      animation: dotBounce 1.4s ease-in-out infinite;

      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }

  @keyframes dotBounce {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
    40% { opacity: 1; transform: scale(1.1); }
  }

  @media (max-width: 520px) {
    .play-screen {
      padding: 8px 8px 16px;
    }
  }
</style>
