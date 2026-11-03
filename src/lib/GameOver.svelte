<script lang="ts">
  import type { GameMode } from './gameState.svelte';
  import { startGame, backToMenu } from './gameState.svelte';

  let {
    winner,
    captured,
    mode,
  }: {
    winner: 'fox' | 'hen';
    captured: number;
    mode: GameMode;
  } = $props();
</script>

<div class="overlay" onclick={backToMenu} onkeydown={(e) => { if (e.key === 'Escape') backToMenu(); }} role="button" tabindex="0">
  <div class="overlay-card" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
    <div class="winner-emoji">
      {winner === 'fox' ? '🦊' : '🐔'}
    </div>
    <h2>{winner === 'fox' ? 'Der Fuchs gewinnt!' : 'Die Hennen gewinnen!'}</h2>
    <p class="winner-desc">
      {winner === 'fox'
        ? `Der Fuchs hat ${captured} ${captured === 1 ? 'Henne' : 'Hennen'} gefressen und entkommen!`
        : 'Die Hennen haben die Füchse eingekreist!'}
    </p>
    <div class="overlay-buttons">
      <button type="button" class="btn-primary" onclick={() => startGame(mode)}>Nochmal spielen</button>
      <button type="button" class="btn-secondary" onclick={backToMenu}>Hauptmenü</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(6px);
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .overlay-card {
    background: linear-gradient(145deg, #2e382e, #1a2218);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 24px;
    padding: 40px 36px;
    text-align: center;
    max-width: 400px;
    width: calc(100% - 40px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    animation: cardSlide 0.4s ease;

    .winner-emoji {
      font-size: 64px;
      margin-bottom: 16px;
      animation: emojiBounce 0.6s ease;
    }

    h2 {
      font-size: 24px;
      color: #fff;
      margin: 0 0 8px;
      font-weight: 700;
    }

    .winner-desc {
      font-size: 15px;
      color: rgba(255, 255, 255, 0.6);
      margin: 0 0 28px;
      line-height: 150%;
    }

    .overlay-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
  }

  @keyframes cardSlide {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes emojiBounce {
    0% { transform: scale(0); }
    60% { transform: scale(1.2); }
    100% { transform: scale(1); }
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
  }
</style>
