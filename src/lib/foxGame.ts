export type Piece = 'fox' | 'hen' | null;
export type Board = Piece[][];
export type Position = { row: number; col: number };
export type Turn = 'fox' | 'hen';

export interface FoxMove {
  to: Position;
  capture?: Position;
}

export interface HenMove {
  from: Position;
  to: Position;
}

export interface FoxTurn {
  from: Position;
  to: Position;
  captures: Position[];
  resultBoard: Board;
}

export interface MoveDest {
  row: number;
  col: number;
  capture: boolean;
}

const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

export function isValidPos(r: number, c: number): boolean {
  if (r < 0 || r > 6 || c < 0 || c > 6) return false;
  return (c >= 2 && c <= 4) || (r >= 2 && r <= 4);
}

export function createBoard(): Board {
  const b: Board = Array.from({ length: 7 }, () => Array(7).fill(null));
  for (let r = 0; r <= 1; r++) {
    for (let c = 2; c <= 4; c++) b[r][c] = 'hen';
  }
  for (let c = 0; c <= 6; c++) b[2][c] = 'hen';
  b[3][3] = 'fox';
  return b;
}

export function getValidPositions(): Position[] {
  const ps: Position[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (isValidPos(r, c)) ps.push({ row: r, col: c });
    }
  }
  return ps;
}

export function getConnections(): [Position, Position][] {
  const conns: [Position, Position][] = [];
  const positions = getValidPositions();
  for (const pos of positions) {
    for (const [dr, dc] of DIRS) {
      const nr = pos.row + dr;
      const nc = pos.col + dc;
      if (isValidPos(nr, nc) && (pos.row < nr || (pos.row === nr && pos.col < nc))) {
        conns.push([pos, { row: nr, col: nc }]);
      }
    }
  }
  return conns;
}

export function getAdjacentValid(r: number, c: number): Position[] {
  const adj: Position[] = [];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (isValidPos(nr, nc)) adj.push({ row: nr, col: nc });
  }
  return adj;
}

export function getFoxMoves(board: Board, r: number, c: number): FoxMove[] {
  const moves: FoxMove[] = [];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (isValidPos(nr, nc) && board[nr][nc] === null) {
      moves.push({ to: { row: nr, col: nc } });
    }
    if (isValidPos(nr, nc) && board[nr][nc] === 'hen') {
      const jr = nr + dr;
      const jc = nc + dc;
      if (isValidPos(jr, jc) && board[jr][jc] === null) {
        moves.push({ to: { row: jr, col: jc }, capture: { row: nr, col: nc } });
      }
    }
  }
  return moves;
}

export function getFoxJumpsOnly(board: Board, r: number, c: number): FoxMove[] {
  return getFoxMoves(board, r, c).filter((m) => m.capture);
}

export function getHenMovesForPiece(board: Board, r: number, c: number): Position[] {
  const moves: Position[] = [];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (isValidPos(nr, nc) && board[nr][nc] === null) {
      moves.push({ row: nr, col: nc });
    }
  }
  return moves;
}

export function getAllHenMoves(board: Board): HenMove[] {
  const moves: HenMove[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (board[r][c] !== 'hen') continue;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (isValidPos(nr, nc) && board[nr][nc] === null) {
          moves.push({ from: { row: r, col: c }, to: { row: nr, col: nc } });
        }
      }
    }
  }
  return moves;
}

export function generateFoxTurns(board: Board): FoxTurn[] {
  const fox = findFox(board);
  if (!fox) return [];
  const foxPosition: Position = fox;
  const turns: FoxTurn[] = [];

  const steps = getFoxMoves(board, fox.row, fox.col).filter((m) => !m.capture);
  for (const step of steps) {
    const nb = applyFoxMove(board, fox, step);
    turns.push({ from: fox, to: step.to, captures: [], resultBoard: nb });
  }

  function exploreJumps(b: Board, pos: Position, caps: Position[]) {
    turns.push({ from: foxPosition, to: pos, captures: [...caps], resultBoard: b });
    const jumps = getFoxJumpsOnly(b, pos.row, pos.col);
    for (const j of jumps) {
      const nb = applyFoxMove(b, pos, j);
      if (j.capture) exploreJumps(nb, j.to, [...caps, j.capture]);
    }
  }

  const initialJumps = getFoxJumpsOnly(board, fox.row, fox.col);
  for (const j of initialJumps) {
    const nb = applyFoxMove(board, fox, j);
    if (j.capture) exploreJumps(nb, j.to, [j.capture]);
  }

  return turns;
}

export function applyFoxMove(board: Board, from: Position, move: FoxMove): Board {
  const nb = board.map((r) => [...r]);
  nb[from.row][from.col] = null;
  nb[move.to.row][move.to.col] = 'fox';
  if (move.capture) {
    nb[move.capture.row][move.capture.col] = null;
  }
  return nb;
}

export function applyHenMove(board: Board, move: HenMove): Board {
  const nb = board.map((r) => [...r]);
  nb[move.from.row][move.from.col] = null;
  nb[move.to.row][move.to.col] = 'hen';
  return nb;
}

export function countHens(board: Board): number {
  let n = 0;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (board[r][c] === 'hen') n++;
    }
  }
  return n;
}

export function findFox(board: Board): Position | null {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (board[r][c] === 'fox') return { row: r, col: c };
    }
  }
  return null;
}

export function checkWinner(board: Board, turn: Turn): 'fox' | 'hen' | null {
  if (countHens(board) < 4) return 'fox';
  const fox = findFox(board);
  if (!fox) return 'fox';
  if (turn === 'fox') {
    if (getFoxMoves(board, fox.row, fox.col).length === 0) return 'hen';
  } else {
    if (getAllHenMoves(board).length === 0) return 'fox';
  }
  return null;
}

function evaluateBoard(board: Board): number {
  const hens = countHens(board);
  if (hens < 4) return 10000;

  const fox = findFox(board);
  if (!fox) return 10000;

  const foxMoves = getFoxMoves(board, fox.row, fox.col);
  if (foxMoves.length === 0) return -10000;

  let score = 0;
  score += (13 - hens) * 25;
  score += foxMoves.length * 4;
  score += foxMoves.filter((m) => m.capture).length * 14;

  let blocked = 0;
  for (const [dr, dc] of DIRS) {
    const nr = fox.row + dr;
    const nc = fox.col + dc;
    if (!isValidPos(nr, nc)) {
      blocked++;
    } else if (board[nr][nc] !== null) {
      const jr = nr + dr;
      const jc = nc + dc;
      if (!isValidPos(jr, jc) || board[jr][jc] !== null) blocked++;
    }
  }
  score -= blocked * 4;

  let formation = 0;
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (board[r][c] === 'hen') {
        const adj = getAdjacentValid(r, c);
        for (const a of adj) {
          if (board[a.row][a.col] === 'hen') formation++;
        }
      }
    }
  }
  score -= formation * 1.5;

  return score;
}

function minimax(
  board: Board,
  depth: number,
  turn: Turn,
  alpha: number,
  beta: number,
): number {
  const hens = countHens(board);
  if (hens < 4) return 10000;

  const fox = findFox(board);
  if (turn === 'fox') {
    if (!fox || getFoxMoves(board, fox.row, fox.col).length === 0) return -10000;
  } else {
    if (getAllHenMoves(board).length === 0) return 10000;
  }

  if (depth === 0) return evaluateBoard(board);

  if (turn === 'fox') {
    let maxEval = -Infinity;
    const turns = generateFoxTurns(board);
    for (const t of turns) {
      const evalScore = minimax(t.resultBoard, depth - 1, 'hen', alpha, beta);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    const moves = getAllHenMoves(board);
    for (const m of moves) {
      const nb = applyHenMove(board, m);
      const evalScore = minimax(nb, depth - 1, 'fox', alpha, beta);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getFoxAITurn(board: Board): FoxTurn | null {
  const turns = generateFoxTurns(board);
  if (turns.length === 0) return null;
  if (turns.length === 1) return turns[0];

  let bestScore = -Infinity;
  let bestTurns: FoxTurn[] = [];

  for (const t of turns) {
    const score = minimax(t.resultBoard, 2, 'hen', -Infinity, Infinity);
    if (score > bestScore + 0.01) {
      bestScore = score;
      bestTurns = [t];
    } else if (Math.abs(score - bestScore) < 0.01) {
      bestTurns.push(t);
    }
  }

  return bestTurns[Math.floor(Math.random() * bestTurns.length)];
}

export function getHenAIMove(board: Board): HenMove | null {
  const moves = getAllHenMoves(board);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];

  let bestScore = Infinity;
  let bestMoves: HenMove[] = [];

  for (const m of moves) {
    const nb = applyHenMove(board, m);
    const score = minimax(nb, 2, 'fox', -Infinity, Infinity);
    if (score < bestScore - 0.01) {
      bestScore = score;
      bestMoves = [m];
    } else if (Math.abs(score - bestScore) < 0.01) {
      bestMoves.push(m);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
