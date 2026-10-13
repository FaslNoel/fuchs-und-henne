<script lang="ts">
  import {
    type Board,
    type Position,
    type FoxTurn,
    type MoveDest,
    type Turn,
    createBoard,
    getValidPositions,
    getConnections,
    getFoxMoves,
    getFoxJumpsOnly,
    getHenMovesForPiece,
    getAllHenMoves,
    applyFoxMove,
    applyHenMove,
    countHens,
    findFox,
    isValidPos,
    getFoxAITurn,
    getHenAIMove,
  } from './lib/foxGame';

  type GameState = 'menu' | 'playing' | 'over' | 'tutorial';

  let state: GameState = 'menu';
  let mode: GameMode = 'pvp';
  let board: Board = createBoard();
  let turn: Turn = 'hen';
  let selected: Position | null = null;
  let validDests: MoveDest[] = [];
  let winner: Turn | null = null;
  let captured = 0;
  let mustJumpFrom: Position | null = null;
  let lastMove: { from: Position; to: Position } | null = null;
  let aiThinking = false;
  let moveCount = 0;

  const validPositions = getValidPositions();
  const connections = getConnections();

  // Tutorial state
  let tutorialStep = 0;
  let tutorialBoard: Board = createBoard();
  let tutorialHighlight: Position[] = [];
  let tutorialHighlightLabel = '';
  let tutorialSelected: Position | null = null;
  let tutorialDests: Position[] = [];
  let tutorialCompleted = false;

  type GameMode = 'pvp' | 'play-fox' | 'play-hen';

  interface TutorialStep {
    title: string;
    text: string;
    icon: string;
    highlight?: Position[];
    highlightLabel?: string;
    canInteract?: boolean;
    interactionTarget?: Position;
    interactionDests?: Position[];
    setupBoard?: Board;
  }

  function makeBoard(placements: [number, number, 'fox' | 'hen'][]): Board {
    const b: Board = Array.from({ length: 7 }, () => Array(7).fill(null));
    for (const [r, c, p] of placements) b[r][c] = p;
    return b;
  }

  const tutorialSteps: TutorialStep[] = [
    {
      title: 'Willkommen!',
      text: 'Dies ist das Spielbrett. Es hat die Form eines Kreuzes. Der Fuchs startet in der Mitte, die Hennen oben. Wir zeigen dir Schritt für Schritt, wie das Spiel funktioniert.',
      icon: '🎮',
    },
    {
      title: 'Das Spielbrett',
      text: 'Das Brett besteht aus 33 Feldern in Kreuzform. Figuren bewegen sich nur entlang der Linien — von Knoten zu benachbartem Knoten. Es gibt keine Diagonalzüge.',
      icon: '📋',
      highlight: [
        { row: 3, col: 3 },
        { row: 0, col: 3 },
        { row: 6, col: 3 },
        { row: 3, col: 0 },
        { row: 3, col: 6 },
      ],
      highlightLabel: 'Feld',
    },
    {
      title: 'Der Fuchs 🦊',
      text: 'Der Fuchs steht in der Mitte. Er kann in alle vier Richtungen ziehen — hoch, runter, links und rechts. Er ist allein gegen alle Hennen.',
      icon: '🦊',
      highlight: [{ row: 3, col: 3 }],
      highlightLabel: 'Fuchs',
    },
    {
      title: 'Die Hennen 🐔',
      text: 'Die 13 Hennen stehen oben auf dem Brett. Sie wollen den Fuchs einkreisen, damit er nicht mehr ziehen kann. Sie bewegen sich vorwärts und seitwärts — aber niemals rückwärts!',
      icon: '🐔',
      highlight: [
        { row: 0, col: 3 }, { row: 1, col: 3 }, { row: 2, col: 3 },
      ],
      highlightLabel: 'Hennen',
    },
    {
      title: 'Zug des Fuchs',
      text: 'Klicke auf den Fuchs, um seine möglichen Züge zu sehen. Die blauen Kreise zeigen, wohin er ziehen kann. Klicke auf ein blaues Feld, um ihn dorthin zu bewegen. Versuche es!',
      icon: '🦊',
      canInteract: true,
      interactionTarget: { row: 3, col: 3 },
      interactionDests: [
        { row: 2, col: 3 }, { row: 4, col: 3 }, { row: 3, col: 2 }, { row: 3, col: 4 },
      ],
      setupBoard: makeBoard([
        [0, 3, 'hen'], [1, 3, 'hen'],
        [2, 2, 'hen'], [2, 3, 'hen'], [2, 4, 'hen'],
        [3, 3, 'fox'],
        [4, 2, 'hen'], [4, 4, 'hen'],
        [5, 2, 'hen'], [5, 4, 'hen'],
        [6, 2, 'hen'], [6, 3, 'hen'], [6, 4, 'hen'],
      ]),
    },
    {
      title: 'Hennen bewegen',
      text: 'Jetzt bist du die Hennen! Klicke auf eine Henne, um zu sehen, wohin sie ziehen kann. Hennen ziehen vorwärts (nach unten zum Fuchs) oder seitwärts — nie rückwärts. Klicke auf ein markiertes Feld, um die Henne zu bewegen.',
      icon: '🐔',
      canInteract: true,
      interactionTarget: { row: 0, col: 3 },
      interactionDests: [
        { row: 1, col: 3 }, { row: 0, col: 2 }, { row: 0, col: 4 },
      ],
      setupBoard: makeBoard([
        [0, 2, 'hen'], [0, 3, 'hen'], [0, 4, 'hen'],
        [1, 3, 'hen'],
        [2, 2, 'hen'], [2, 3, 'hen'], [2, 4, 'hen'],
        [3, 3, 'fox'],
      ]),
    },
    {
      title: 'Fuchs frisst!',
      text: 'Der Fuchs kann über eine Henne springen, um sie zu fressen — wie beim Dame-Spiel. Die rot markierten Felder zeigen Sprungzüge. Klicke auf den Fuchs und springe über die Henne!',
      icon: '🍖',
      canInteract: true,
      interactionTarget: { row: 3, col: 3 },
      interactionDests: [{ row: 1, col: 3 }],
      setupBoard: makeBoard([
        [0, 3, 'hen'],
        [2, 3, 'hen'],
        [3, 3, 'fox'],
        [5, 3, 'hen'],
      ]),
    },
    {
      title: 'Wer gewinnt?',
      text: 'Der Fuchs gewinnt, wenn weniger als 4 Hennen übrig sind — er ist dann zu stark zum Einkreisen. Die Hennen gewinnen, wenn sie den Fuchs so umzingeln, dass er keinen Zug mehr hat. Jetzt weißt du alles!',
      icon: '🏆',
    },
  ];

  function isAITurn(): boolean {
    if (mode === 'pvp') return false;
    if (mode === 'play-fox') return turn === 'hen';
    return turn === 'fox';
  }

  function startGame(m: GameMode) {
    mode = m;
    board = createBoard();
    turn = 'hen';
    selected = null;
    validDests = [];
    winner = null;
    captured = 0;
    mustJumpFrom = null;
    lastMove = null;
    aiThinking = false;
    moveCount = 0;
    state = 'playing';

    if (isAITurn()) {
      scheduleAI();
    }
  }

  function startTutorial() {
    tutorialStep = 0;
    tutorialCompleted = false;
    tutorialBoard = createBoard();
    tutorialHighlight = [];
    tutorialHighlightLabel = '';
    tutorialSelected = null;
    tutorialDests = [];
    state = 'tutorial';
    applyTutorialStep();
  }

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
      tutorialHighlightLabel = step.highlightLabel || '';
    } else {
      tutorialHighlight = [];
      tutorialHighlightLabel = '';
    }
  }

  function nextTutorialStep() {
    if (tutorialStep < tutorialSteps.length - 1) {
      tutorialStep++;
      applyTutorialStep();
    } else {
      state = 'menu';
    }
  }

  function prevTutorialStep() {
    if (tutorialStep > 0) {
      tutorialStep--;
      applyTutorialStep();
    }
  }

  function exitTutorial() {
    state = 'menu';
  }

  function handleTutorialClick(r: number, c: number) {
    const step = tutorialSteps[tutorialStep];
    if (!step || !step.canInteract) return;

    if (tutorialDests.some((d) => d.row === r && d.col === c) && tutorialSelected) {
      // Execute the move
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
      tutorialHighlightLabel = '';
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

    // Click on any own piece to try selecting
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

  function isTutorialHighlight(r: number, c: number): boolean {
    return tutorialHighlight.some((p) => p.row === r && p.col === c);
  }

  function isTutorialDest(r: number, c: number): boolean {
    return tutorialDests.some((d) => d.row === r && d.col === c);
  }

  function isTutorialSelected(r: number, c: number): boolean {
    return tutorialSelected?.row === r && tutorialSelected?.col === c;
  }

  function tutorialPieceAt(r: number, c: number) {
    return tutorialBoard[r] ? tutorialBoard[r][c] : null;
  }

  function scheduleAI() {
    aiThinking = true;
    setTimeout(() => doAIMove(), 650);
  }

  function doAIMove() {
    if (state !== 'playing') return;

    if (turn === 'fox') {
      const aiTurn = getFoxAITurn(board);
      if (!aiTurn) {
        winner = 'hen';
        state = 'over';
        aiThinking = false;
        return;
      }
      lastMove = { from: aiTurn.from, to: aiTurn.to };
      board = aiTurn.resultBoard;
      captured += aiTurn.captures.length;
      moveCount++;
      checkGameStatus();
      aiThinking = false;
    } else {
      const move = getHenAIMove(board);
      if (!move) {
        winner = 'fox';
        state = 'over';
        aiThinking = false;
        return;
      }
      lastMove = { from: move.from, to: move.to };
      board = applyHenMove(board, move);
      moveCount++;
      checkGameStatus();
      aiThinking = false;
    }
  }

  function checkGameStatus() {
    if (countHens(board) < 4) {
      winner = 'fox';
      state = 'over';
      return;
    }
    turn = turn === 'fox' ? 'hen' : 'fox';
    selected = null;
    validDests = [];
    mustJumpFrom = null;

    const nextHens = countHens(board);
    if (nextHens < 4) {
      winner = 'fox';
      state = 'over';
      return;
    }

    if (turn === 'fox') {
      const fox = findFox(board);
      if (!fox) {
        winner = 'hen';
        state = 'over';
        return;
      }
      if (getFoxMoves(board, fox.row, fox.col).length === 0) {
        winner = 'hen';
        state = 'over';
        return;
      }
    } else {
      if (getAllHenMoves(board).length === 0) {
        winner = 'fox';
        state = 'over';
        return;
      }
    }

    if (isAITurn()) {
      scheduleAI();
    }
  }

  function handleClick(r: number, c: number) {
    if (state !== 'playing' || isAITurn() || aiThinking) return;

    if (turn === 'fox') {
      handleFoxClick(r, c);
    } else {
      handleHenClick(r, c);
    }
  }

  function handleFoxClick(r: number, c: number) {
    const fox = findFox(board);
    if (!fox) return;

    if (mustJumpFrom) {
      const dest = validDests.find((d: MoveDest) => d.row === r && d.col === c);
      if (dest) {
        const move: any = {
          to: { row: r, col: c },
          capture: dest.capture ? { row: (mustJumpFrom.row + r) / 2, col: (mustJumpFrom.col + c) / 2 } : undefined,
        };
        performFoxMove(mustJumpFrom, move);
      }
      return;
    }

    if (r === fox.row && c === fox.col) {
      if (selected) {
        selected = null;
        validDests = [];
      } else {
        selected = { row: r, col: c };
        const moves = getFoxMoves(board, r, c);
        validDests = moves.map((m) => ({ row: m.to.row, col: m.to.col, capture: !!m.capture }));
      }
      return;
    }

    const dest = validDests.find((d: MoveDest) => d.row === r && d.col === c);
    if (dest && selected) {
      const move: any = {
        to: { row: r, col: c },
        capture: dest.capture ? { row: (selected.row + r) / 2, col: (selected.col + c) / 2 } : undefined,
      };
      performFoxMove(selected, move);
    }
  }

  function performFoxMove(from: Position, move: { to: Position; capture?: Position }) {
    const newBoard = applyFoxMove(board, from, move);
    board = newBoard;
    lastMove = { from, to: move.to };
    moveCount++;

    if (move.capture) {
      captured++;
    }

    selected = null;
    validDests = [];

    if (move.capture) {
      const moreJumps = getFoxJumpsOnly(board, move.to.row, move.to.col);
      if (moreJumps.length > 0) {
        mustJumpFrom = { row: move.to.row, col: move.to.col };
        validDests = moreJumps.map((m) => ({ row: m.to.row, col: m.to.col, capture: true }));
        return;
      }
    }

    mustJumpFrom = null;
    checkGameStatus();
  }

  function handleHenClick(r: number, c: number) {
    if (mustJumpFrom) return;

    const destination = validDests.find((d: MoveDest) => d.row === r && d.col === c);
    if (destination && selected && board[r][c] === null) {
      const move = { from: selected, to: { row: r, col: c } };
      board = applyHenMove(board, move);
      lastMove = { from: move.from, to: move.to };
      moveCount++;
      selected = null;
      validDests = [];
      checkGameStatus();
      return;
    }

    if (board[r][c] === 'hen') {
      if (selected && selected.row === r && selected.col === c) {
        selected = null;
        validDests = [];
      } else {
        const moves = getHenMovesForPiece(board, r, c);
        selected = { row: r, col: c };
        validDests = moves.map((m) => ({ row: m.row, col: m.col, capture: false }));
      }
      return;
    }
  }

  function cellPos(r: number, c: number): string {
    const x = 60 + c * 60;
    const y = 60 + r * 60;
    return `${x},${y}`;
  }

  function isValidCell(r: number, c: number): boolean {
    return isValidPos(r, c);
  }

  function pieceAt(r: number, c: number) {
    return board[r] ? board[r][c] : null;
  }

  function isSelected(r: number, c: number): boolean {
    return selected?.row === r && selected?.col === c;
  }

  function isDest(r: number, c: number): boolean {
    return validDests.some((d: MoveDest) => d.row === r && d.col === c);
  }

  function isCaptureDest(r: number, c: number): boolean {
    return validDests.some((d: MoveDest) => d.row === r && d.col === c && d.capture);
  }

  function isLastMove(r: number, c: number): boolean {
    if (!lastMove) return false;
    return (lastMove.from.row === r && lastMove.from.col === c) ||
           (lastMove.to.row === r && lastMove.to.col === c);
  }

  $: henCount = countHens(board);

  function backToMenu() {
    state = 'menu';
    selected = null;
    validDests = [];
  }

  function getModeLabel(): string {
    if (mode === 'pvp') return '2 Spieler';
    if (mode === 'play-fox') return 'Du spielst Fuchs';
    return 'Du spielst Hennen';
  }

  function getTurnLabel(): string {
    if (turn === 'fox') return 'Fuchs';
    return 'Hennen';
  }

  function isPlayerTurn(): boolean {
    if (mode === 'pvp') return true;
    if (mode === 'play-fox') return turn === 'fox';
    return turn === 'hen';
  }

  function getPlayerInstruction(): string {
    if (aiThinking) return 'Gegner denkt nach…';
    if (mustJumpFrom) return 'Weiterer Sprung möglich!';
    if (selected && turn === 'hen' && validDests.length === 0) return 'Diese Henne kann gerade nicht ziehen';
    if (turn === 'fox' && !selected) return 'Klicke auf den Fuchs 🦊';
    if (turn === 'fox' && selected) return 'Wähle ein blaues Feld zum Ziehen';
    if (turn === 'hen' && !selected) return 'Wähle eine Henne aus 🐔';
    if (turn === 'hen' && selected) return 'Wähle ein blaues Feld zum Ziehen';
    return 'Wähle eine Henne aus';
  }

  function isFoxActive(): boolean {
    return turn === 'fox' && !selected && !mustJumpFrom && isPlayerTurn() && !winner;
  }

  function isHenActive(r: number, c: number): boolean {
    return turn === 'hen' && !selected && !mustJumpFrom && isPlayerTurn() && !winner && board[r][c] === 'hen';
  }

  $: isLastTutorialStep = tutorialStep === tutorialSteps.length - 1;
</script>

<div class="game-app">
  {#if state === 'menu'}
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
                <p>Bewegt sich in alle 4 Richtungen. Springt über eine Henne, um sie zu fressen.</p>
              </div>
            </div>
            <div class="rule-block">
              <span class="rule-icon">🐔</span>
              <div>
                <h3>Die Hennen</h3>
                <p>Bewegen sich vorwärts und seitwärts. Sie können nicht rückwärts ziehen.</p>
              </div>
            </div>
          </div>
          <div class="win-conditions">
            <p><strong>🦊 Fuchs gewinnt:</strong> Wenn weniger als 4 Hennen übrig sind.</p>
            <p><strong>🐔 Hennen gewinnen:</strong> Wenn sie den Fuchs einkreisen, sodass er nicht mehr ziehen kann.</p>
          </div>
        </div>

        <div class="mode-selection">
          <h2>Spielmodus wählen</h2>
          <div class="mode-buttons">
            <button type="button" class="mode-btn tutorial-btn" onclick={startTutorial}>
              <span class="btn-icon">🎓</span>
              <span class="btn-titles">
                <span class="btn-title">Tutorial</span>
                <span class="btn-desc">Lerne das Spiel Schritt für Schritt</span>
              </span>
            </button>
            <button type="button" class="mode-btn" onclick={() => startGame('play-hen')}>
              <span class="btn-icon">🐔</span>
              <span class="btn-titles">
                <span class="btn-title">Hennen spielen</span>
                <span class="btn-desc">Du bist die Hennen — kreuze den Fuchs ein!</span>
              </span>
            </button>
            <button type="button" class="mode-btn" onclick={() => startGame('play-fox')}>
              <span class="btn-icon">🦊</span>
              <span class="btn-titles">
                <span class="btn-title">Fuchs spielen</span>
                <span class="btn-desc">Du bist der Fuchs — fresse die Hennen!</span>
              </span>
            </button>
            <button type="button" class="mode-btn" onclick={() => startGame('pvp')}>
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
  {:else if state === 'tutorial'}
    <div class="play-screen tutorial-screen">
      <header class="game-header">
        <button type="button" class="back-btn" onclick={exitTutorial}>← Menü</button>
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
        <svg
          class="game-board"
          viewBox="0 0 480 480"
          role="img"
          aria-label="Tutorial Spielbrett"
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
            {@const piece = tutorialPieceAt(pos.row, pos.col)}
            {@const sel = isTutorialSelected(pos.row, pos.col)}
            {@const dest = isTutorialDest(pos.row, pos.col)}
            {@const hl = isTutorialHighlight(pos.row, pos.col)}

            <circle cx={px} cy={py} r="5" class="node-dot" />

            {#if hl}
              <circle cx={px} cy={py} r="28" class="tutorial-highlight-ring" />
            {/if}

            {#if sel}
              <circle cx={px} cy={py} r="30" class="selected-ring" />
            {/if}

            {#if dest}
              <circle
                cx={px}
                cy={py}
                r="22"
                class="dest-marker"
                onclick={() => handleTutorialClick(pos.row, pos.col)}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTutorialClick(pos.row, pos.col); }}
                role="button"
                tabindex="0"
              />
            {/if}

            {#if piece === 'fox'}
              <g
                class="piece piece-fox"
                class:piece-selected={sel}
                onclick={() => handleTutorialClick(pos.row, pos.col)}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTutorialClick(pos.row, pos.col); }}
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
                onclick={() => handleTutorialClick(pos.row, pos.col)}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTutorialClick(pos.row, pos.col); }}
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
                onclick={() => handleTutorialClick(pos.row, pos.col)}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTutorialClick(pos.row, pos.col); }}
                role="button"
                tabindex="0"
              />
            {/if}
          {/each}
        </svg>
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
  {:else}
    <div class="play-screen">
      <header class="game-header">
        <button type="button" class="back-btn" onclick={backToMenu}>← Menü</button>
        <span class="mode-label">{getModeLabel()}</span>
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
          <div class="turn-indicator" class:fox-turn={turn === 'fox'} class:hen-turn={turn === 'hen'}>
            <span class="turn-dot"></span>
            <span class="turn-text">{getTurnLabel()}</span>
          </div>
        </div>
      </div>

      <div class="board-wrapper">
        {#key moveCount}
        <svg
          class="game-board"
          viewBox="0 0 480 480"
          role="img"
          aria-label="Spielbrett"
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
            {@const selected2 = isSelected(pos.row, pos.col)}
            {@const dest = isDest(pos.row, pos.col)}
            {@const capture = isCaptureDest(pos.row, pos.col)}
            {@const lastM = isLastMove(pos.row, pos.col)}
            {@const foxActive = isFoxActive()}
            {@const henActive = isHenActive(pos.row, pos.col)}

            <circle
              cx={px}
              cy={py}
              r="5"
              class="node-dot"
            />

            {#if lastM}
              <circle cx={px} cy={py} r="26" class="last-move-ring" />
            {/if}

            {#if foxActive && piece === 'fox'}
              <circle cx={px} cy={py} r="30" class="active-piece-ring" />
            {/if}

            {#if henActive}
              <circle cx={px} cy={py} r="28" class="active-piece-ring subtle" />
            {/if}

            {#if selected2}
              <circle cx={px} cy={py} r="30" class="selected-ring" />
            {/if}

            {#if dest}
              <circle
                cx={px}
                cy={py}
                r={capture ? "24" : "22"}
                class:dest-marker={!capture}
                class:capture-marker={capture}
                onclick={() => handleClick(pos.row, pos.col)}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(pos.row, pos.col); }}
                role="button"
                tabindex="0"
              />
            {/if}

            {#if piece === 'fox'}
              <g
                class="piece piece-fox"
                class:piece-selected={selected2}
                class:piece-movable={foxActive}
                onclick={() => handleClick(pos.row, pos.col)}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(pos.row, pos.col); }}
                role="button"
                tabindex="0"
              >
                <circle cx={px} cy={py} r="22" class="piece-bg fox-bg" />
                <text x={px} y={py} class="piece-emoji" text-anchor="middle" dominant-baseline="central">🦊</text>
              </g>
            {:else if piece === 'hen'}
              <g
                class="piece piece-hen"
                class:piece-selected={selected2}
                class:piece-movable={henActive}
                onclick={() => handleClick(pos.row, pos.col)}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(pos.row, pos.col); }}
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
                onclick={() => handleClick(pos.row, pos.col)}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(pos.row, pos.col); }}
                role="button"
                tabindex="0"
              />
            {/if}
          {/each}
        </svg>
        {/key}
      </div>

      <div class="instruction-bar">
        {#if aiThinking}
          <span class="thinking-dots"><span></span><span></span><span></span></span>
          <span>{getPlayerInstruction()}</span>
        {:else if winner}
          <span></span>
        {:else if !isPlayerTurn()}
          <span class="ai-turn-text">Gegner ist am Zug…</span>
        {:else}
          <span>{getPlayerInstruction()}</span>
        {/if}
      </div>

      {#if state === 'over'}
        <div class="overlay" onclick={backToMenu} onkeydown={(e) => { if (e.key === 'Escape') backToMenu(); }} role="button" tabindex="0">
          <div class="overlay-card" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
            <div class="winner-emoji">
              {winner === 'fox' ? '🦊' : '🐔'}
            </div>
            <h2>{winner === 'fox' ? 'Der Fuchs gewinnt!' : 'Die Hennen gewinnen!'}</h2>
            <p class="winner-desc">
              {winner === 'fox'
                ? `Der Fuchs hat ${captured} ${captured === 1 ? 'Henne' : 'Hennen'} gefressen und entkommen!`
                : 'Die Hennen haben den Fuchs eingekreist!'}
            </p>
            <div class="overlay-buttons">
              <button type="button" class="btn-primary" onclick={() => startGame(mode)}>Nochmal spielen</button>
              <button type="button" class="btn-secondary" onclick={backToMenu}>Hauptmenü</button>
            </div>
          </div>
        </div>
      {/if}
    </div>
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

  /* Menu Screen */
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
  }

  .rules-card h2 {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 16px;
    font-weight: 600;
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

  /* Play Screen */
  .play-screen {
    width: 100%;
    max-width: 560px;
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
    color: var(--danger);
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
      color: var(--fox-light);
      .turn-dot { background: var(--fox-color); }
    }

    &.hen-turn {
      background: rgba(240, 208, 80, 0.15);
      color: var(--hen-light);
      .turn-dot { background: var(--hen-color); }
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

  .board-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
  }

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
      fill: rgba(123, 184, 255, 0.45);
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
    stroke: var(--fox-color);
    stroke-width: 2.5;
  }

  .hen-bg {
    fill: rgba(240, 208, 80, 0.2);
    stroke: var(--hen-dark);
    stroke-width: 2;
  }

  .piece-selected .hen-bg {
    fill: rgba(240, 208, 80, 0.45);
    stroke: var(--hen-light);
    stroke-width: 3;
  }

  .piece-selected .fox-bg {
    fill: rgba(224, 122, 60, 0.45);
    stroke: var(--fox-light);
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

  /* Tutorial */
  .tutorial-screen {
    max-width: 560px;
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
        background: var(--tutorial-accent);
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

  .tutorial-highlight-ring {
    fill: none;
    stroke: var(--tutorial-accent);
    stroke-width: 3;
    stroke-dasharray: 5 3;
    animation: tutorialHighlightPulse 1.5s ease-in-out infinite;
  }

  @keyframes tutorialHighlightPulse {
    0%, 100% { stroke-opacity: 0.8; transform: scale(1); }
    50% { stroke-opacity: 0.3; }
  }

  .tutorial-nav {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
  }

  /* Overlay */
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

  @keyframes cardSlide {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes emojiBounce {
    0% { transform: scale(0); }
    60% { transform: scale(1.2); }
    100% { transform: scale(1); }
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

    .play-screen {
      padding: 8px 8px 16px;
    }

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

    .piece-emoji {
      font-size: 20px;
    }

    .tutorial-card {
      padding: 12px 16px;

      .tutorial-card-header h2 { font-size: 15px; }
      .tutorial-card-text { font-size: 13px; }
    }
  }
</style>
