const SUITS = [
  { key: "spades", label: "&spades;", color: "black", jp: "スペード" },
  { key: "hearts", label: "&hearts;", color: "red", jp: "ハート" },
  { key: "diamonds", label: "&diams;", color: "red", jp: "ダイヤ" },
  { key: "clubs", label: "&clubs;", color: "black", jp: "クラブ" }
];

const RANKS = [
  { key: "A", value: 1, display: "A", jp: "エース" },
  { key: "2", value: 2, display: "2", jp: "2" },
  { key: "3", value: 3, display: "3", jp: "3" },
  { key: "4", value: 4, display: "4", jp: "4" },
  { key: "5", value: 5, display: "5", jp: "5" },
  { key: "6", value: 6, display: "6", jp: "6" },
  { key: "7", value: 7, display: "7", jp: "7" },
  { key: "8", value: 8, display: "8" , jp: "8"},
  { key: "9", value: 9, display: "9", jp: "9" },
  { key: "10", value: 10, display: "10", jp: "10" },
  { key: "J", value: 11, display: "J", jp: "ジャック" },
  { key: "Q", value: 12, display: "Q", jp: "クイーン" },
  { key: "K", value: 13, display: "K", jp: "キング" }
];

const body = document.body;
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const statusMessage = document.getElementById("status-message");
const cardGrid = document.getElementById("card-grid");
const turnIndicator = document.getElementById("turn-indicator");
const scorePlayer1 = document.getElementById("score-player-1");
const scorePlayer2 = document.getElementById("score-player-2");
const playerPanels = {
  1: document.getElementById("player-1"),
  2: document.getElementById("player-2")
};

const POINTS_FOR_FINAL_FIVE = 2;
const POINTS_FOR_NORMAL_PAIR = 1;
const TOTAL_PAIRS = 26;

let gameState = createInitialState();

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

function createInitialState() {
  return {
    phase: "idle",
    deck: [],
    cardsById: {},
    flippedCards: [],
    matchedIds: new Set(),
    currentPlayer: 1,
    scores: { 1: 0, 2: 0 },
    remainingPairs: TOTAL_PAIRS,
    isChecking: false
  };
}

function startGame() {
  gameState = createInitialState();
  gameState.phase = "playing";
  gameState.deck = createShuffledDeck();
  gameState.cardsById = indexDeck(gameState.deck);

  renderDeck(gameState.deck);
  updateScores();
  updateActivePlayer();

  setBodyState("state-playing");
  setStatusMessage("プレイヤー1のターンです。");
}

function finishGame() {
  gameState.phase = "finished";
  setBodyState("state-finished");

  const { 1: score1, 2: score2 } = gameState.scores;

  if (score1 > score2) {
    setStatusMessage(`ゲーム終了！プレイヤー1の勝ちです。（${score1} 対 ${score2}）`);
  } else if (score2 > score1) {
    setStatusMessage(`ゲーム終了！プレイヤー2の勝ちです。（${score2} 対 ${score1}）`);
  } else {
    setStatusMessage(`ゲーム終了！引き分けです。（${score1} 対 ${score2}）`);
  }
}

function setBodyState(nextStateClass) {
  body.classList.remove("state-initial", "state-playing", "state-finished");
  body.classList.add(nextStateClass);
}

function setStatusMessage(message) {
  statusMessage.textContent = message;
}

function createShuffledDeck() {
  const deck = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const id = `${rank.key}-${suit.key}`;
      deck.push({
        id,
        suit: suit.key,
        suitLabel: suit.label,
        suitColor: suit.color,
        rank: rank.key,
        rankDisplay: rank.display,
        matchValue: rank.value,
        readable: `${suit.jp}の${rank.jp}`
      });
    }
  }

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function indexDeck(deck) {
  return deck.reduce((acc, card) => {
    acc[card.id] = card;
    return acc;
  }, {});
}

function renderDeck(deck) {
  cardGrid.innerHTML = "";
  const fragment = document.createDocumentFragment();

  deck.forEach((card) => {
    const cardElement = createCardElement(card);
    fragment.appendChild(cardElement);
  });

  cardGrid.appendChild(fragment);
}

function createCardElement(card) {
  const wrapper = document.createElement("div");
  wrapper.className = "card";
  wrapper.dataset.cardId = card.id;
  wrapper.dataset.rank = String(card.matchValue);
  wrapper.dataset.state = "face-down";
  wrapper.setAttribute("role", "button");
  wrapper.setAttribute("aria-label", `${card.readable}をめくる`);
  wrapper.tabIndex = 0;

  const inner = document.createElement("div");
  inner.className = "card-inner";

  const backFace = document.createElement("div");
  backFace.className = "card-content card-back";

  const frontFace = document.createElement("div");
  frontFace.className = "card-content card-face";
  frontFace.innerHTML = `
    <span class="card-rank">${card.rankDisplay}</span>
    <span class="card-suit card-suit-${card.suit}">${card.suitLabel}</span>
  `;

  inner.appendChild(backFace);
  inner.appendChild(frontFace);
  wrapper.appendChild(inner);

  wrapper.addEventListener("click", () => handleCardSelection(wrapper));
  wrapper.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardSelection(wrapper);
    }
  });

  return wrapper;
}

function handleCardSelection(cardElement) {
  if (gameState.phase !== "playing") return;
  if (gameState.isChecking) return;

  const cardId = cardElement.dataset.cardId;
  if (gameState.matchedIds.has(cardId)) return;
  if (gameState.flippedCards.includes(cardElement)) return;

  revealCard(cardElement);
  gameState.flippedCards.push(cardElement);

  if (gameState.flippedCards.length === 2) {
    gameState.isChecking = true;
    window.setTimeout(resolveFlippedCards, 600);
  }
}

function revealCard(cardElement) {
  cardElement.dataset.state = "face-up";
}

function hideCard(cardElement) {
  cardElement.dataset.state = "face-down";
}

function markCardAsMatched(cardElement) {
  cardElement.dataset.state = "matched";
  cardElement.setAttribute(
    "aria-label",
    `${cardElement.getAttribute("aria-label")}（ペア確定）`
  );
  cardElement.tabIndex = -1;
}

function resolveFlippedCards() {
  const [firstCard, secondCard] = gameState.flippedCards;
  const firstData = gameState.cardsById[firstCard.dataset.cardId];
  const secondData = gameState.cardsById[secondCard.dataset.cardId];

  if (!firstData || !secondData) {
    resetFlippedCards();
    return;
  }

  const isMatch = firstData.matchValue === secondData.matchValue;

  if (isMatch) {
    handleMatch(firstCard, secondCard);
  } else {
    handleMismatch(firstCard, secondCard);
  }
}

function handleMatch(firstCard, secondCard) {
  const points = gameState.remainingPairs <= 5
    ? POINTS_FOR_FINAL_FIVE
    : POINTS_FOR_NORMAL_PAIR;
  const currentPlayer = gameState.currentPlayer;

  markCardAsMatched(firstCard);
  markCardAsMatched(secondCard);

  gameState.matchedIds.add(firstCard.dataset.cardId);
  gameState.matchedIds.add(secondCard.dataset.cardId);
  gameState.scores[currentPlayer] += points;
  gameState.remainingPairs -= 1;
  gameState.flippedCards = [];
  gameState.isChecking = false;

  updateScores();
  setStatusMessage(`ペア成立！プレイヤー${currentPlayer}が${points}ポイント獲得しました。`);

  if (gameState.matchedIds.size === gameState.deck.length) {
    finishGame();
  }
}

function handleMismatch(firstCard, secondCard) {
  setStatusMessage("不一致です。カードを裏に戻します。");

  window.setTimeout(() => {
    hideCard(firstCard);
    hideCard(secondCard);
    gameState.flippedCards = [];
    gameState.isChecking = false;
    switchTurn();
  }, 700);
}

function switchTurn() {
  gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
  updateActivePlayer();
  setStatusMessage(`プレイヤー${gameState.currentPlayer}のターンです。`);
}

function resetFlippedCards() {
  gameState.flippedCards.forEach((card) => hideCard(card));
  gameState.flippedCards = [];
  gameState.isChecking = false;
}

function updateScores() {
  scorePlayer1.textContent = String(gameState.scores[1]);
  scorePlayer2.textContent = String(gameState.scores[2]);
}

function updateActivePlayer() {
  turnIndicator.textContent = `プレイヤー${gameState.currentPlayer}のターン`;

  [1, 2].forEach((playerId) => {
    if (playerId === gameState.currentPlayer) {
      playerPanels[playerId].classList.add("is-active");
    } else {
      playerPanels[playerId].classList.remove("is-active");
    }
  });
}

setBodyState("state-initial");
setStatusMessage("スタートボタンを押してゲームを開始してください。");
