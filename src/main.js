/**
 * Main entry point for Magica
 * Sets up game state, screen manager, and wires everything together
 */

if (!document.querySelector("#app")) {
  throw new Error("Required app mount element #app was not found.");
}

// ============================================================================
// GAME STATE AND SCREEN MANAGER INITIALIZATION
// ============================================================================

let gameState = null;
let screenManager = null;
let currentPlayer = null;
let mockSearchTimer = null;
let mockOpponentTurnTimer = null;

const app = document.querySelector("#app");

/**
 * Initialize the game
 */
function initializeGame() {
  currentPlayer = {
    id: "player_1",
    name: "Player",
  };

  const opponentId = "player_2";

  // Create new game state
  gameState = new GameState(currentPlayer.id, opponentId, SPELLS);

  // Create screen manager
  screenManager = new ScreenManager(app, gameState);

  // Register all screens
  Object.entries(SCREENS).forEach(([screenId, screenDef]) => {
    screenManager.registerScreen(screenId, screenDef);
  });

  // Start with main screen
  screenManager.setScreen("main");
}

/**
 * Handle spell confirmation from player
 * @param {string} spellId - Spell ID to cast
 */
function handleSpellCast(spellId) {
  const spell = SPELLS.get(spellId);
  if (!spell) return;

  const player = gameState.getCurrentPlayer();
  const opponent = gameState.getCurrentOpponent();

  // Validate spell
  const validation = gameState.canCastSpell(player.id, spellId, opponent.id);
  if (!validation.valid) {
    console.warn("Spell cast failed:", validation.reason);
    // Update screen to show error
    screenManager.updateScreen({
      castError: validation.reason,
    });
    return;
  }

  // Cast the spell (this mutates game state)
  const result = gameState.castSpell(player.id, spellId, opponent.id);
  if (!result.success) {
    console.warn("Spell cast failed:", result.message);
    return;
  }

  // Update battle screen with current state
  updateBattleScreen();

  // Schedule mock opponent turn after a delay
  if (!gameState.gameOver && gameState.currentTurnPlayerId === gameState.player2.id) {
    scheduleMockOpponentTurn();
  }

  // Check if game is over
  if (gameState.gameOver) {
    const winner = gameState.winner;
    const isPlayerWon = winner === currentPlayer.id;
    showResultScreen(isPlayerWon ? "victory" : "defeat", isPlayerWon ? gameState.getCurrentPlayer() : gameState.getCurrentOpponent());
  }
}

/**
 * Handle end turn action from player
 */
function handleEndTurn() {
  const result = gameState.skipTurn();
  if (!result.success) {
    console.warn("End turn failed:", result.message);
    return;
  }

  // Update battle screen
  updateBattleScreen();

  // Schedule mock opponent turn after a delay
  if (!gameState.gameOver && gameState.currentTurnPlayerId === gameState.player2.id) {
    scheduleMockOpponentTurn();
  }

  // Check if game is over
  if (gameState.gameOver) {
    const winner = gameState.winner;
    const isPlayerWon = winner === currentPlayer.id;
    showResultScreen(isPlayerWon ? "victory" : "defeat", isPlayerWon ? gameState.getCurrentPlayer() : gameState.getCurrentOpponent());
  }
}

/**
 * Update battle screen with current game state
 */
function updateBattleScreen() {
  screenManager.updateScreen({
    gameState: gameState.getState(),
    playerId: currentPlayer.id,
    opponentId: gameState.getOpponent(currentPlayer.id).id,
    battleLog: gameState.getBattleLog(),
  });
}

/**
 * Mock opponent AI turn (instant or after delay)
 */
function scheduleMockOpponentTurn() {
  // Clear any existing timer
  if (mockOpponentTurnTimer) {
    clearTimeout(mockOpponentTurnTimer);
  }

  // Delay 1.5 seconds for better UX
  mockOpponentTurnTimer = setTimeout(() => {
    const opponent = gameState.getCurrentPlayer();
    const player = gameState.getCurrentOpponent();

    // Simple AI: choose a random spell the opponent can cast
    const availableSpells = Array.from(SPELLS.values()).filter((spell) => {
      const validation = gameState.canCastSpell(opponent.id, spell.id, player.id);
      return validation.valid;
    });

    if (availableSpells.length > 0) {
      const randomSpell = availableSpells[Math.floor(Math.random() * availableSpells.length)];
      const result = gameState.castSpell(opponent.id, randomSpell.id, player.id);

      if (!result.success) {
        // If spell cast fails, skip turn
        gameState.skipTurn();
      }
    } else {
      // No spells available, skip turn
      gameState.skipTurn();
    }

    // Update screen
    updateBattleScreen();

    // Check if game is over
    if (gameState.gameOver) {
      const winner = gameState.winner;
      const isPlayerWon = winner === currentPlayer.id;
      showResultScreen(isPlayerWon ? "victory" : "defeat", isPlayerWon ? gameState.getCurrentPlayer() : gameState.getCurrentOpponent());
    } else if (gameState.currentTurnPlayerId === currentPlayer.id) {
      // Switch back to player's turn
      updateBattleScreen();
    }
  }, 1500);
}

/**
 * Show battle screen
 */
function showBattleScreen() {
  // Reset game state for new battle
  gameState = new GameState(currentPlayer.id, gameState.player2.id, SPELLS);

  screenManager.setScreen("battle", {
    gameState: gameState.getState(),
    playerId: currentPlayer.id,
    opponentId: gameState.player2.id,
    battleLog: gameState.getBattleLog(),
  });

  // If opponent starts, schedule their turn
  if (gameState.currentTurnPlayerId !== currentPlayer.id) {
    scheduleMockOpponentTurn();
  }
}

/**
 * Show result screen
 * @param {string} result - "victory", "defeat", or "draw"
 * @param {Object} winnerOrStats - Winner player stats or match stats
 */
function showResultScreen(result, stats = {}) {
  screenManager.setScreen("result", {
    result: result,
    stats: {
      turnCount: gameState.turnCount,
      finalHp: stats.hp || 0,
    },
  });
}

/**
 * Handle screen transitions and interactions
 * Override screen onInput to add custom logic
 */
const originalSearchOnInput = SCREENS.search.onInput;
SCREENS.search.onInput = function (event, data) {
  if (event.action === "cancel_search") {
    // Clear mock search timer
    if (mockSearchTimer) {
      clearTimeout(mockSearchTimer);
    }
    return { nextScreen: "main" };
  }
  return originalSearchOnInput.call(this, event, data);
};

const originalMainOnInput = SCREENS.main.onInput;
SCREENS.main.onInput = function (event, data) {
  if (event.action === "start_battle") {
    // Start mock search with 2-3 second delay
    screenManager.setScreen("search", { matched: false });

    // Mock search timer
    mockSearchTimer = setTimeout(() => {
      showBattleScreen();
    }, 2000 + Math.random() * 1000);

    return null;
  }
  return originalMainOnInput.call(this, event, data);
};

const originalBattleOnInput = SCREENS.battle.onInput;
SCREENS.battle.onInput = function (event, data) {
  if (event.action === "cast_spell") {
    handleSpellCast(event.data);
    return null;
  } else if (event.action === "end_turn") {
    handleEndTurn();
    return null;
  } else if (event.action === "show_menu") {
    screenManager.updateScreen({ showSurrenderConfirm: true });
    return null;
  }
  return originalBattleOnInput.call(this, event, data);
};

// ============================================================================
// START GAME
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  initializeGame();
});

// Expose debug functions to console
window.gameState = () => gameState;
window.screenManager = () => screenManager;
window.showBattleScreen = showBattleScreen;
window.handleSpellCast = handleSpellCast;
window.handleEndTurn = handleEndTurn;
