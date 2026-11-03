<script lang="ts">
  import { gameState, getTurnLabel, backToMenu } from './gameState.svelte';
  import { countHens } from './foxGame';

  let { henCount, captured, moveCount }: { henCount: number; captured: number; moveCount: number } = $props();
</script>

<header class="game-header">
  <button type="button" class="back-btn" onclick={backToMenu}>← Menü</button>
  <span class="mode-label">{gameState.mode === 'pvp' ? '2 Spieler' : gameState.mode === 'play-fox' ? 'Du spielst Fuchs' : 'Du spielst Hennen'}</span>
  <span class="move-counter">Zug {moveCount}</span>
</header>

<div class="status-bar">
  <div class="status-left">
    <div class="hen-counter">
      <span class="counter-icon">🐔</span>
      <span class="counter-value">{henCount}</span>
      <span class="counter-label">Hennen</span>
    </div>
    <div class="capture-counter">
      <span class="counter-icon">✕</span>
      <span class="counter-value">{captured}</span>
      <span class="counter-label">gefressen</span>
    </div>
  </div>
  <div class="status-right">
    <div class="turn-indicator" class:fox-turn={gameState.turn === 'fox'} class:hen-turn={gameState.turn === 'hen'}>
      <span class="turn-dot"></span>
      <span class="turn-text">{getTurnLabel()}</span>
    </div>
  </div>
</div>

<style>
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

  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .status-left {
    display: flex;
    gap: 24px;
  }

  .hen-counter,
  .capture-counter {
    display: flex;
    align-items: center;
    gap: 6px;

    .counter-icon {
      font-size: 20px;
    }

    .counter-value {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
      font-variant-numeric: tabular-nums;
    }

    .counter-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
    }
  }

  .capture-counter .counter-icon {
    color: var(--danger, #c44545);
    font-weight: 700;
    font-size: 18px;
  }

  .turn-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;

    &.fox-turn {
      background: rgba(224, 122, 60, 0.2);
      color: var(--fox-light, #f4a86a);
      .turn-dot { background: var(--fox-color, #e07a3c); }
    }

    &.hen-turn {
      background: rgba(240, 208, 80, 0.15);
      color: var(--hen-light, #fae890);
      .turn-dot { background: var(--hen-color, #f0d050); }
    }

    .turn-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  @media (max-width: 520px) {
    .status-bar {
      padding: 10px 12px;
    }

    .status-left {
      gap: 16px;
    }

    .hen-counter .counter-value,
    .capture-counter .counter-value {
      font-size: 18px;
    }
  }
</style>
