import {
  type Board,
  type Position,
  type MoveDest,
  type Turn,
  type FoxTurn,
  type HenMove,
  type Difficulty,
  createBoard,
  countHens,
  foxHasMoves,
  getFoxMoves,
  getFoxJumpsOnly,
  getFoxAITurn,
  getHenAIMove,
  getAllHenMoves,
  applyFoxMove,
  applyHenMove,
  getHenMovesForPiece,
} from './foxGame';

export type GameState = 'menu' | 'playing' | 'over' | 'tutorial';
export type GameMode = 'pvp' | 'play-fox' | 'play-hen';

interface PersistedState {
  state: GameState;
  mode: GameMode;
  difficulty: Difficulty;
  board: Board;
  turn: Turn;
  selected: Position | null;
  validDests: MoveDest[];
  winner: Turn | null;
  captured: number;
  mustJumpFrom: Position | null;
  lastMove: { from: Position; to: Position } | null;
  moveCount: number;
  tutorialStep: number;
}

const STORAGE_KEY = 'fox-hen-game-state';

function loadPersisted(): Partial<PersistedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return null;
  }
}

function savePersisted(data: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota / privacy errors
  }
}

const initialDefaults: PersistedState = {
  state: 'menu',
  mode: 'pvp',
  difficulty: 'medium',
  board: createBoard(),
  turn: 'hen',
  selected: null,
  validDests: [],
  winner: null,
  captured: 0,
  mustJumpFrom: null,
  lastMove: null,
  moveCount: 0,
  tutorialStep: 0,
};

function initFromPersisted(): PersistedState {
  const saved = loadPersisted();
  if (!saved) return { ...initialDefaults };
  // Validate board structure
  if (!saved.board || !Array.isArray(saved.board) || saved.board.length !== 7) {
    return { ...initialDefaults };
  }
  return { ...initialDefaults, ...saved };
}

const persisted = initFromPersisted();

export const gameState = $state<PersistedState>({
  state: persisted.state,
  mode: persisted.mode,
  difficulty: persisted.difficulty,
  board: persisted.board,
  turn: persisted.turn,
  selected: persisted.selected,
  validDests: persisted.validDests,
  winner: persisted.winner,
  captured: persisted.captured,
  mustJumpFrom: persisted.mustJumpFrom,
  lastMove: persisted.lastMove,
  moveCount: persisted.moveCount,
  tutorialStep: persisted.tutorialStep,
});

function persist() {
  savePersisted({ ...gameState });
}

export function isAITurn(): boolean {
  if (gameState.mode === 'pvp') return false;
  if (gameState.mode === 'play-fox') return gameState.turn === 'hen';
  return gameState.turn === 'fox';
}

export function isPlayerTurn(): boolean {
  if (gameState.mode === 'pvp') return true;
  if (gameState.mode === 'play-fox') return gameState.turn === 'fox';
  return gameState.turn === 'hen';
}

export function isFoxActive(): boolean {
  return gameState.turn === 'fox' && !gameState.selected && !gameState.mustJumpFrom && isPlayerTurn() && !gameState.winner;
}

export function isHenActive(r: number, c: number): boolean {
  return gameState.turn === 'hen' && !gameState.selected && !gameState.mustJumpFrom && isPlayerTurn() && !gameState.winner && gameState.board[r][c] === 'hen';
}

export function pieceAt(r: number, c: number) {
  return gameState.board[r] ? gameState.board[r][c] : null;
}

export function isSelected(r: number, c: number): boolean {
  return gameState.selected?.row === r && gameState.selected?.col === c;
}

export function isDest(r: number, c: number): boolean {
  return gameState.validDests.some((d) => d.row === r && d.col === c);
}

export function isCaptureDest(r: number, c: number): boolean {
  return gameState.validDests.some((d) => d.row === r && d.col === c && d.capture);
}

export function isLastMove(r: number, c: number): boolean {
  if (!gameState.lastMove) return false;
  return (gameState.lastMove.from.row === r && gameState.lastMove.from.col === c) ||
         (gameState.lastMove.to.row === r && gameState.lastMove.to.col === c);
}

export function getModeLabel(): string {
  if (gameState.mode === 'pvp') return '2 Spieler';
  if (gameState.mode === 'play-fox') return 'Du spielst Fuchs';
  return 'Du spielst Hennen';
}

export function getTurnLabel(): string {
  return gameState.turn === 'fox' ? 'Fuchs' : 'Hennen';
}

export function getPlayerInstruction(aiThinking: boolean): string {
  if (aiThinking) return 'Gegner denkt nach…';
  if (gameState.mustJumpFrom) return 'Weiterer Sprung möglich!';
  if (gameState.selected && gameState.turn === 'hen' && gameState.validDests.length === 0) return 'Diese Henne kann gerade nicht ziehen';
  if (gameState.turn === 'fox' && !gameState.selected) return 'Klicke auf einen Fuchs 🦊';
  if (gameState.turn === 'fox' && gameState.selected) return 'Wähle ein blaues Feld zum Ziehen';
  if (gameState.turn === 'hen' && !gameState.selected) return 'Wähle eine Henne aus 🐔';
  if (gameState.turn === 'hen' && gameState.selected) return 'Wähle ein blaues Feld zum Ziehen';
  return 'Wähle eine Henne aus';
}

function checkGameStatus() {
  if (countHens(gameState.board) < 4) {
    gameState.winner = 'fox';
    gameState.state = 'over';
    return;
  }
  gameState.turn = gameState.turn === 'fox' ? 'hen' : 'fox';
  gameState.selected = null;
  gameState.validDests = [];
  gameState.mustJumpFrom = null;

  if (countHens(gameState.board) < 4) {
    gameState.winner = 'fox';
    gameState.state = 'over';
    return;
  }

  if (gameState.turn === 'fox') {
    if (!foxHasMoves(gameState.board)) {
      gameState.winner = 'hen';
      gameState.state = 'over';
      return;
    }
  } else {
    if (getAllHenMoves(gameState.board).length === 0) {
      gameState.winner = 'fox';
      gameState.state = 'over';
      return;
    }
  }
  persist();
}

function performFoxMove(from: Position, move: { to: Position; capture?: Position }) {
  gameState.board = applyFoxMove(gameState.board, from, move);
  gameState.lastMove = { from, to: move.to };
  gameState.moveCount++;

  if (move.capture) {
    gameState.captured++;
  }

  gameState.selected = null;
  gameState.validDests = [];

  if (move.capture) {
    const moreJumps = getFoxJumpsOnly(gameState.board, move.to.row, move.to.col);
    if (moreJumps.length > 0) {
      gameState.mustJumpFrom = { row: move.to.row, col: move.to.col };
      gameState.validDests = moreJumps.map((m) => ({ row: m.to.row, col: m.to.col, capture: true }));
      return;
    }
  }

  gameState.mustJumpFrom = null;
  checkGameStatus();
  persist();
}

function handleFoxClick(r: number, c: number) {
  if (gameState.mustJumpFrom) {
    const dest = gameState.validDests.find((d) => d.row === r && d.col === c);
    if (dest) {
      const move = {
        to: { row: r, col: c },
        capture: dest.capture ? { row: (gameState.mustJumpFrom.row + r) / 2, col: (gameState.mustJumpFrom.col + c) / 2 } : undefined,
      };
      performFoxMove(gameState.mustJumpFrom, move);
    }
    return;
  }

  if (gameState.board[r][c] === 'fox') {
    if (gameState.selected && gameState.selected.row === r && gameState.selected.col === c) {
      gameState.selected = null;
      gameState.validDests = [];
    } else {
      gameState.selected = { row: r, col: c };
      const moves = getFoxMoves(gameState.board, r, c);
      gameState.validDests = moves.map((m) => ({ row: m.to.row, col: m.to.col, capture: !!m.capture }));
    }
    persist();
    return;
  }

  const dest = gameState.validDests.find((d) => d.row === r && d.col === c);
  if (dest && gameState.selected) {
    const move = {
      to: { row: r, col: c },
      capture: dest.capture ? { row: (gameState.selected.row + r) / 2, col: (gameState.selected.col + c) / 2 } : undefined,
    };
    performFoxMove(gameState.selected, move);
  }
  persist();
}

function handleHenClick(r: number, c: number) {
  if (gameState.mustJumpFrom) return;

  const destination = gameState.validDests.find((d) => d.row === r && d.col === c);
  if (destination && gameState.selected && gameState.board[r][c] === null) {
    const move: HenMove = { from: gameState.selected, to: { row: r, col: c } };
    gameState.board = applyHenMove(gameState.board, move);
    gameState.lastMove = { from: move.from, to: move.to };
    gameState.moveCount++;
    gameState.selected = null;
    gameState.validDests = [];
    checkGameStatus();
    return;
  }

  if (gameState.board[r][c] === 'hen') {
    if (gameState.selected && gameState.selected.row === r && gameState.selected.col === c) {
      gameState.selected = null;
      gameState.validDests = [];
    } else {
      const moves = getHenMovesForPiece(gameState.board, r, c);
      gameState.selected = { row: r, col: c };
      gameState.validDests = moves.map((m) => ({ row: m.row, col: m.col, capture: false }));
    }
    persist();
  }
}

export function handleClick(r: number, c: number, aiThinking: boolean) {
  if (gameState.state !== 'playing' || isAITurn() || aiThinking) return;
  if (gameState.turn === 'fox') {
    handleFoxClick(r, c);
  } else {
    handleHenClick(r, c);
  }
}

export function doAIMove(): boolean {
  if (gameState.state !== 'playing') return false;

  if (gameState.turn === 'fox') {
    const aiTurn: FoxTurn | null = getFoxAITurn(gameState.board, gameState.difficulty);
    if (!aiTurn) {
      gameState.winner = 'hen';
      gameState.state = 'over';
      persist();
      return true;
    }
    gameState.lastMove = { from: aiTurn.from, to: aiTurn.to };
    gameState.board = aiTurn.resultBoard;
    gameState.captured += aiTurn.captures.length;
    gameState.moveCount++;
    checkGameStatus();
    persist();
    return true;
  } else {
    const move: HenMove | null = getHenAIMove(gameState.board, gameState.difficulty);
    if (!move) {
      gameState.winner = 'fox';
      gameState.state = 'over';
      persist();
      return true;
    }
    gameState.lastMove = { from: move.from, to: move.to };
    gameState.board = applyHenMove(gameState.board, move);
    gameState.moveCount++;
    checkGameStatus();
    persist();
    return true;
  }
}

export function startGame(m: GameMode, difficulty: Difficulty = 'medium') {
  gameState.mode = m;
  gameState.difficulty = difficulty;
  gameState.board = createBoard();
  gameState.turn = 'hen';
  gameState.selected = null;
  gameState.validDests = [];
  gameState.winner = null;
  gameState.captured = 0;
  gameState.mustJumpFrom = null;
  gameState.lastMove = null;
  gameState.moveCount = 0;
  gameState.state = 'playing';
  persist();
}

export function openTutorial() {
  gameState.state = 'tutorial';
  gameState.tutorialStep = 0;
  persist();
}

export function setTutorialStep(step: number) {
  gameState.tutorialStep = step;
  persist();
}

export function backToMenu() {
  gameState.state = 'menu';
  gameState.selected = null;
  gameState.validDests = [];
  persist();
}

export function setDifficulty(d: Difficulty) {
  gameState.difficulty = d;
  persist();
}
