import type { Board } from './foxGame';

export interface TutorialStep {
  title: string;
  text: string;
  icon: string;
  highlight?: { row: number; col: number }[];
  highlightLabel?: string;
  canInteract?: boolean;
  interactionTarget?: { row: number; col: number };
  setupBoard?: Board;
}

function makeBoard(placements: [number, number, 'fox' | 'hen'][]): Board {
  const b: Board = Array.from({ length: 7 }, () => Array(7).fill(null));
  for (const [r, c, p] of placements) b[r][c] = p;
  return b;
}

export const tutorialSteps: TutorialStep[] = [
  {
    title: 'Willkommen!',
    text: 'Dies ist das Spielbrett. Es hat die Form eines Kreuzes. Die Füchse starten unten an den Ecken des Stalls, die Hennen oben. Wir zeigen dir Schritt für Schritt, wie das Spiel funktioniert.',
    icon: '🎮',
  },
  {
    title: 'Das Spielbrett',
    text: 'Das Brett besteht aus 33 Feldern in Kreuzform. Figuren bewegen sich entlang der Linien — von Knoten zu benachbartem Knoten, auch schräg über die Diagonalen.',
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
    text: 'Zwei Füchse jagen die Hennen. Sie starten an den unteren Ecken des Stalls. Füchse können in alle acht Richtungen ziehen — auch schräg.',
    icon: '🦊',
    highlight: [{ row: 4, col: 2 }, { row: 4, col: 4 }],
    highlightLabel: 'Fuchs',
  },
  {
    title: 'Die Hennen 🐔',
    text: 'Die 13 Hennen stehen oben auf dem Brett. Sie wollen den Fuchs einkreisen, damit er nicht mehr ziehen kann. Sie bewegen sich nach unten (auch schräg) und seitwärts — aber niemals rückwärts!',
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
    title: 'Diagonal ziehen',
    text: 'Füchse können auch schräg ziehen. Klicke auf den Fuchs und wähle eines der blauen Felder auf einer Diagonale.',
    icon: '↗',
    canInteract: true,
    interactionTarget: { row: 3, col: 3 },
    setupBoard: makeBoard([
      [1, 3, 'hen'],
      [2, 3, 'hen'], [3, 1, 'hen'], [3, 2, 'hen'], [3, 4, 'hen'], [3, 5, 'hen'],
      [4, 3, 'hen'], [5, 3, 'hen'],
      [3, 3, 'fox'],
    ]),
  },
  {
    title: 'Hennen bewegen',
    text: 'Jetzt bist du die Hennen! Klicke auf eine Henne, um zu sehen, wohin sie ziehen kann. Hennen ziehen nach unten (auch schräg) oder seitwärts — nie rückwärts. Klicke auf ein markiertes Feld, um die Henne zu bewegen.',
    icon: '🐔',
    canInteract: true,
    interactionTarget: { row: 0, col: 3 },
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
    setupBoard: makeBoard([
      [0, 3, 'hen'],
      [2, 3, 'hen'],
      [3, 3, 'fox'],
      [5, 3, 'hen'],
    ]),
  },
  {
    title: 'Wer gewinnt?',
    text: 'Der Fuchs gewinnt, wenn weniger als 4 Hennen übrig sind — er ist dann zu stark zum Einkreisen. Die Hennen gewinnen, wenn sie den Fuchs so umzingeln, dass kein Fuchs mehr einen Zug hat. Jetzt weißt du alles!',
    icon: '🏆',
  },
];
