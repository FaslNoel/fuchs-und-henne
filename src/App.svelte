<script lang="ts">
  import { gameState, startGame, openTutorial, backToMenu } from './lib/gameState.svelte';
  import Menu from './lib/Menu.svelte';
  import Tutorial from './lib/Tutorial.svelte';
  import PlayScreen from './lib/PlayScreen.svelte';
</script>

<div class="game-app">
  {#if gameState.state === 'menu'}
    <Menu
      onStartGame={(m) => startGame(m, gameState.difficulty)}
      onStartTutorial={openTutorial}
    />
  {:else if gameState.state === 'tutorial'}
    <Tutorial onExit={backToMenu} />
  {:else}
    <PlayScreen />
  {/if}
</div>

<style>
  .game-app {
    --fox-color: #e07a3c;
    --fox-dark: #b85a20;
    --fox-light: #f4a86a;
    --hen-color: #f0d050;
    --hen-dark: #c4a030;
    --hen-light: #fae890;
    --board-wood: #8b6f47;
    --board-wood-dark: #6b5535;
    --board-grass: #5a8a3a;
    --board-grass-dark: #3e6b22;
    --bg-light: #f5ede0;
    --bg-dark: #1a1d28;
    --text-dark: #2a2520;
    --text-light: #e8e0d0;
    --accent: #4a8f3a;
    --danger: #c44545;
    --tutorial-accent: #5a9fd4;

    min-height: 100svh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(160deg, #2a3528 0%, #1a2218 100%);
    color: var(--text-light);
    font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
    position: relative;
    overflow-x: hidden;
  }
</style>
