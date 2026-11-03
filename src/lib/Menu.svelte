<script lang="ts">
  import type { Difficulty } from './foxGame';
  import type { GameMode } from './gameState.svelte';
  import { gameState, setDifficulty, resumeGame } from './gameState.svelte';

  let {
    onStartGame,
    onStartTutorial,
  }: {
    onStartGame: (mode: GameMode) => void;
    onStartTutorial: () => void;
  } = $props();

  const difficulties: { value: Difficulty; label: string; desc: string }[] = [
    { value: 'easy', label: 'Leicht', desc: 'Der Gegner macht oft Fehler' },
    { value: 'medium', label: 'Mittel', desc: 'Manchmal ein Fehler' },
    { value: 'hard', label: 'Schwer', desc: 'Fast keine Fehler' },
  ];
</script>

<div class="menu-screen">
  <div class="menu-content">
    <div class="title-area">
      <div class="title-icons">
        <span class="icon-fox">🦊</span>
        <span class="icon-vs">vs</span>
        <span class="icon-hen">🐔</span>
      </div>
      <h1>Fuchs &amp; Henne</h1>
      <p class="subtitle">Ein traditionelles Brettspiel</p>
    </div>

    <div class="rules-card">
      <h2>Spielregeln</h2>
      <div class="rules-grid">
        <div class="rule-block">
          <span class="rule-icon">🦊</span>
          <div>
            <h3>Der Fuchs</h3>
            <p>Bewegt sich in alle 8 Richtungen, auch schräg. Springt über eine Henne, um sie zu fressen. Es gibt zwei Füchse.</p>
          </div>
        </div>
        <div class="rule-block">
          <span class="rule-icon">🐔</span>
          <div>
            <h3>Die Hennen</h3>
            <p>Bewegen sich nach unten (auch schräg) und seitwärts. Sie können nicht rückwärts ziehen.</p>
          </div>
        </div>
      </div>
      <div class="win-conditions">
        <p><strong>🦊 Fuchs gewinnt:</strong> Wenn weniger als 4 Hennen übrig sind.</p>
        <p><strong>🐔 Hennen gewinnen:</strong> Wenn sie den Fuchs einkreisen, sodass kein Fuchs mehr ziehen kann.</p>
      </div>
    </div>

    <div class="difficulty-section">
      <h2>Schwierigkeit</h2>
      <div class="difficulty-buttons">
        {#each difficulties as d}
          <button
            type="button"
            class="diff-btn"
            class:active={gameState.difficulty === d.value}
            onclick={() => setDifficulty(d.value)}
          >
            <span class="diff-label">{d.label}</span>
            <span class="diff-desc">{d.desc}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="mode-selection">
      <h2>Spielmodus wählen</h2>
      <div class="mode-buttons">
        {#if gameState.hasSavedGame}
          <button type="button" class="mode-btn resume-btn" onclick={resumeGame}>
            <span class="btn-icon">▶</span>
            <span class="btn-titles">
              <span class="btn-title">Spiel fortsetzen</span>
              <span class="btn-desc">Dort weitermachen, wo du aufgehört hast</span>
            </span>
          </button>
        {/if}
        <button type="button" class="mode-btn tutorial-btn" onclick={onStartTutorial}>
          <span class="btn-icon">🎓</span>
          <span class="btn-titles">
            <span class="btn-title">Tutorial</span>
            <span class="btn-desc">Lerne das Spiel Schritt für Schritt</span>
          </span>
        </button>
        <button type="button" class="mode-btn" onclick={() => onStartGame('play-hen')}>
          <span class="btn-icon">🐔</span>
          <span class="btn-titles">
            <span class="btn-title">Hennen spielen</span>
            <span class="btn-desc">Du bist die Hennen — kreuze den Fuchs ein!</span>
          </span>
        </button>
        <button type="button" class="mode-btn" onclick={() => onStartGame('play-fox')}>
          <span class="btn-icon">🦊</span>
          <span class="btn-titles">
            <span class="btn-title">Fuchs spielen</span>
            <span class="btn-desc">Du bist der Fuchs — fresse die Hennen!</span>
          </span>
        </button>
        <button type="button" class="mode-btn" onclick={() => onStartGame('pvp')}>
          <span class="btn-icon">👥</span>
          <span class="btn-titles">
            <span class="btn-title">2 Spieler</span>
            <span class="btn-desc">Spiele zusammen an einem Gerät</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .menu-screen {
    width: 100%;
    max-width: 640px;
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-grow: 1;
    justify-content: center;
  }

  .title-area {
    text-align: center;
    margin-bottom: 32px;
  }

  .title-icons {
    font-size: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 12px;

    .icon-vs {
      font-size: 18px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.4);
    }
  }

  h1 {
    font-size: 42px;
    font-weight: 700;
    color: #fff;
    margin: 0;
    letter-spacing: -1px;
  }

  .subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 6px;
  }

  .rules-card {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 28px;
    width: 100%;
    box-sizing: border-box;
    backdrop-filter: blur(10px);

    h2 {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 16px;
      font-weight: 600;
    }
  }

  .rules-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;

    @media (max-width: 520px) {
      grid-template-columns: 1fr;
    }
  }

  .rule-block {
    display: flex;
    gap: 12px;
    align-items: flex-start;

    .rule-icon {
      font-size: 28px;
      flex-shrink: 0;
    }

    h3 {
      font-size: 15px;
      color: #fff;
      margin: 0 0 4px;
      font-weight: 600;
    }

    p {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.55);
      line-height: 150%;
      margin: 0;
    }
  }

  .win-conditions {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 14px;

    p {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      line-height: 170%;
      margin: 0;

      strong {
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }

  .difficulty-section {
    width: 100%;
    margin-bottom: 28px;

    h2 {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 16px;
      font-weight: 600;
      text-align: center;
    }
  }

  .difficulty-buttons {
    display: flex;
    gap: 12px;

    @media (max-width: 520px) {
      flex-direction: column;
    }
  }

  .diff-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 12px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.2);
    }

    &.active {
      background: rgba(74, 143, 58, 0.25);
      border-color: rgba(74, 143, 58, 0.6);
    }

    .diff-label {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
    }

    .diff-desc {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .mode-selection {
    width: 100%;

    h2 {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 16px;
      font-weight: 600;
      text-align: center;
    }
  }

  .mode-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .mode-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 24px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.25s ease;
    text-align: left;
    width: 100%;
    box-sizing: border-box;

    &:hover {
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    &:active {
      transform: translateY(0);
    }

    .btn-icon {
      font-size: 32px;
      flex-shrink: 0;
    }

    .btn-titles {
      display: flex;
      flex-direction: column;
    }

    .btn-title {
      display: block;
      font-size: 17px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 2px;
    }

    .btn-desc {
      display: block;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .tutorial-btn {
    border-color: rgba(90, 159, 212, 0.3);
    background: rgba(90, 159, 212, 0.1);

    &:hover {
      background: rgba(90, 159, 212, 0.2);
      border-color: rgba(90, 159, 212, 0.5);
    }
  }

  .resume-btn {
    border-color: rgba(74, 143, 58, 0.5);
    background: rgba(74, 143, 58, 0.2);

    &:hover {
      background: rgba(74, 143, 58, 0.3);
      border-color: rgba(74, 143, 58, 0.7);
    }
  }

  @media (max-width: 520px) {
    .menu-screen {
      padding: 24px 16px;
    }

    h1 {
      font-size: 32px;
    }

    .title-icons {
      font-size: 40px;
    }

    .mode-btn {
      padding: 14px 18px;
      gap: 12px;

      .btn-icon { font-size: 26px; }
      .btn-title { font-size: 15px; }
      .btn-desc { font-size: 12px; }
    }
  }
</style>
