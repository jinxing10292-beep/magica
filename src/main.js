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
let currentPlayerSupabaseId = null;
let mockSearchTimer = null;
let mockOpponentTurnTimer = null;
let currentMatchId = null;
let battleLogs = [];

const app = document.querySelector("#app");

// Constants
const STORAGE_KEY = 'magica_player';
const OPPONENT_ID = 'opponent_mock';

/**
 * Initialize the game
 */
async function initializeGame() {
  // Check localStorage for saved player
  const savedPlayer = localStorage.getItem(STORAGE_KEY);
  
  if (savedPlayer) {
    try {
      const playerData = JSON.parse(savedPlayer);
      currentPlayer = playerData;
      currentPlayerSupabaseId = playerData.supabaseId;
      startGame();
    } catch (e) {
      // Invalid saved player, show player setup screen
      showPlayerScreen();
    }
  } else {
    // Show player setup screen
    showPlayerScreen();
  }
}

/**
 * Show player screen for nickname setup
 */
function showPlayerScreen() {
  gameState = new GameState('player_temp', 'opponent_temp', SPELLS);
  screenManager = new ScreenManager(app, gameState);
  
  Object.entries(SCREENS).forEach(([screenId, screenDef]) => {
    screenManager.registerScreen(screenId, screenDef);
  });

  // Override player screen onInput to handle join_game
  const originalPlayerOnInput = SCREENS.player.onInput;
  SCREENS.player.onInput = async function(event, data) {
    if (event.action === 'join_game' && data.action === 'join_game') {
      const nickname = data.nickname;
      screenManager.updateScreen({ loading: true, nickname });
      
      try {
        const result = await getOrCreatePlayer(nickname);
        if (!result.success) {
          const errorMap = {
            'nickname_taken': 'nickname_taken',
            'database_error': 'database_error'
          };
          screenManager.updateScreen({ 
            error: errorMap[result.error] || 'database_error',
            loading: false,
            nickname
          });
        } else {
          // Save player to localStorage
          currentPlayer = {
            id: 'player_local',
            nickname: nickname
          };
          currentPlayerSupabaseId = result.data.id;
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            id: currentPlayer.id,
            nickname: currentPlayer.nickname,
            supabaseId: currentPlayerSupabaseId
          }));
          
          // Start game
          startGame();
        }
      } catch (error) {
        console.error('Player creation failed:', error);
        screenManager.updateScreen({ 
          error: 'database_error',
          loading: false,
          nickname
        });
      }
    }
    return originalPlayerOnInput.call(this, event, data);
  };

  screenManager.setScreen('player');
}

/**
 * Start the actual game after player is set
 */
function startGame() {
  currentPlayer = {
    id: "player_1",
    name: currentPlayer.nickname,
  };

  // Create new game state
  gameState = new GameState(currentPlayer.id, OPPONENT_ID, SPELLS);

  // Create screen manager
  screenManager = new ScreenManager(app, gameState);

  // Register all screens
  Object.entries(SCREENS).forEach(([screenId, screenDef]) => {
    screenManager.registerScreen(screenId, screenDef);
  });

  // Setup screen handlers
  setupScreenHandlers();

  // Start with main screen
  screenManager.setScreen("main", { playerName: currentPlayer.name });
}

/**
 * Setup screen event handlers
 */
function setupScreenHandlers() {
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
}

/**
 * Handle spell confirmation from player
 * @param {string} spellId - Spell ID to cast
 */
async function handleSpellCast(spellId) {
  const spell = SPELLS.get(spellId);
  if (!spell) return;

  const player = gameState.getCurrentPlayer();
  const opponent = gameState.getCurrentOpponent();

  // Validate spell
  const validation = gameState.canCastSpell(player.id, spellId, opponent.id);
  if (!validation.valid) {
    console.warn("Spell cast failed:", validation.reason);
    screenManager.updateScreen({
      castError: validation.reason,
    });
    return;
  }

  // Cast the spell
  const result = gameState.castSpell(player.id, spellId, opponent.id);
  if (!result.success) {
    console.warn("Spell cast failed:", result.message);
    return;
  }

  // Save spell action to battle log
  if (currentMatchId && currentPlayerSupabaseId) {
    const logEntry = {
      turnNumber: gameState.turnCount,
      actorId: currentPlayerSupabaseId,
      type: 'spell',
      spellName: spell.name,
      targetId: 'opponent_mock',
      hpBefore: opponent.hp + result.damageDealt,
      hpAfter: opponent.hp,
      manaBefore: player.mana + spell.manaCost,
      manaAfter: player.mana,
      damageDelt: result.damageDealt || 0,
      description: `${spell.name} 시전`
    };
    
    await saveBattleLog(currentMatchId, logEntry);
  }

  // Update battle screen
  updateBattleScreen();

  // Schedule mock opponent turn after a delay
  if (!gameState.gameOver && gameState.currentTurnPlayerId === OPPONENT_ID) {
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
async function handleEndTurn() {
  const result = gameState.skipTurn();
  if (!result.success) {
    console.warn("End turn failed:", result.message);
    return;
  }

  // Save pass action to battle log
  if (currentMatchId && currentPlayerSupabaseId) {
    const logEntry = {
      turnNumber: gameState.turnCount,
      actorId: currentPlayerSupabaseId,
      type: 'pass',
      description: '턴 패스'
    };
    
    await saveBattleLog(currentMatchId, logEntry);
  }

  // Update battle screen
  updateBattleScreen();

  // Schedule mock opponent turn after a delay
  if (!gameState.gameOver && gameState.currentTurnPlayerId === OPPONENT_ID) {
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
  mockOpponentTurnTimer = setTimeout(async () => {
    const opponent = gameState.getCurrentPlayer();
    const player = gameState.getCurrentOpponent();

    // Simple AI: choose a random spell the opponent can cast
    const availableSpells = Array.from(SPELLS.values()).filter((spell) => {
      const validation = gameState.canCastSpell(opponent.id, spell.id, player.id);
      return validation.valid;
    });

    let spellCast = null;
    if (availableSpells.length > 0) {
      const randomSpell = availableSpells[Math.floor(Math.random() * availableSpells.length)];
      const result = gameState.castSpell(opponent.id, randomSpell.id, player.id);
      
      if (result.success) {
        spellCast = randomSpell;
      } else {
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
async function showBattleScreen() {
  // Create new match in Supabase
  const matchResult = await createMatch(currentPlayerSupabaseId, 'opponent_mock');
  
  if (matchResult.success) {
    currentMatchId = matchResult.data;
    console.log('Match created:', currentMatchId);
  } else {
    console.error('Failed to create match:', matchResult.error);
    return;
  }

  // Reset game state for new battle
  gameState = new GameState(currentPlayer.id, OPPONENT_ID, SPELLS);
  battleLogs = [];

  screenManager.setScreen("battle", {
    gameState: gameState.getState(),
    playerId: currentPlayer.id,
    opponentId: OPPONENT_ID,
    battleLog: gameState.getBattleLog(),
  });

  // If opponent starts, schedule their turn
  if (gameState.currentTurnPlayerId !== currentPlayer.id) {
    scheduleMockOpponentTurn();
  }
}

/**
 * Show result screen and save battle to Supabase
 * @param {string} result - "victory", "defeat", or "draw"
 * @param {Object} stats - Match stats
 */
async function showResultScreen(result, stats = {}) {
  screenManager.setScreen("result", {
    result: result,
    stats: {
      turnCount: gameState.turnCount,
      finalHp: stats.hp || 0,
    },
  });

  // Save match result to Supabase
  if (currentMatchId && currentPlayerSupabaseId) {
    try {
      const isWin = result === 'victory';
      const isDraw = result === 'draw';
      const winnerId = isDraw ? null : (isWin ? currentPlayerSupabaseId : null);
      
      // Update match with result
      const matchResult = await updateMatchResult(
        currentMatchId,
        winnerId,
        isDraw,
        gameState.turnCount
      );

      if (matchResult.success) {
        console.log('Match result saved to Supabase');
      }
    } catch (error) {
      console.error('Failed to save match result:', error);
    }
  }
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
