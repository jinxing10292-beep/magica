/**
 * Core game engine for Magica
 * GameState class manages player state, effects, turn lifecycle, and spell execution
 */

class GameState {
  /**
   * Initialize a new game
   * @param {string} player1Id - Player 1 ID
   * @param {string} player2Id - Player 2 ID
   * @param {Map} spellsMap - Map of spell definitions (from spells.js)
   */
  constructor(player1Id, player2Id, spellsMap) {
    this.spellsMap = spellsMap;

    // Player initialization (100 HP, 60 mana start)
    this.player1 = {
      id: player1Id,
      hp: 100,
      maxHp: 100,
      mana: 60,
      maxMana: 100,
      statusEffects: {},
    };

    this.player2 = {
      id: player2Id,
      hp: 100,
      maxHp: 100,
      mana: 60,
      maxMana: 100,
      statusEffects: {},
    };

    // Game state
    this.currentTurnPlayerId = player1Id; // Start with player1
    this.turnCount = 0;
    this.gameOver = false;
    this.winner = null;
    this.turnStarted = false;

    // History and logging
    this.battleLog = [];
    this.turnHistory = [];
  }

  /**
   * Get player by ID
   * @param {string} id - Player ID
   * @returns {Object} Player object
   */
  getPlayer(id) {
    if (id === this.player1.id) return this.player1;
    if (id === this.player2.id) return this.player2;
    throw new Error(`Player ${id} not found`);
  }

  /**
   * Get opponent of a player
   * @param {string} id - Player ID
   * @returns {Object} Opponent player object
   */
  getOpponent(id) {
    if (id === this.player1.id) return this.player2;
    if (id === this.player2.id) return this.player1;
    throw new Error(`Player ${id} not found`);
  }

  /**
   * Get current turn player
   * @returns {Object} Current player object
   */
  getCurrentPlayer() {
    return this.getPlayer(this.currentTurnPlayerId);
  }

  /**
   * Get opponent of current player
   * @returns {Object} Current opponent
   */
  getCurrentOpponent() {
    return this.getOpponent(this.currentTurnPlayerId);
  }

  /**
   * Check if game is over
   * @returns {boolean}
   */
  isGameOver() {
    return this.gameOver;
  }

  /**
   * Check if a player can cast a spell
   * @param {string} playerId - Player ID
   * @param {string} spellId - Spell ID
   * @param {string} targetId - Target player ID
   * @returns {Object} {valid: boolean, reason: string}
   */
  canCastSpell(playerId, spellId, targetId) {
    if (this.gameOver) {
      return { valid: false, reason: "게임이 이미 끝났습니다" };
    }

    if (playerId !== this.currentTurnPlayerId) {
      return { valid: false, reason: "현재 플레이어가 아닙니다" };
    }

    const spell = this.spellsMap.get(spellId);
    if (!spell) {
      return { valid: false, reason: "존재하지 않는 마법입니다" };
    }

    const attacker = this.getPlayer(playerId);
    const defender = this.getPlayer(targetId);

    return validateSpellCast(spell, attacker, defender, this);
  }

  /**
   * Cast a spell
   * @param {string} playerId - Player ID
   * @param {string} spellId - Spell ID
   * @param {string} targetId - Target player ID
   * @returns {Object} {success: boolean, message: string}
   */
  castSpell(playerId, spellId, targetId) {
    // Validate turn
    if (playerId !== this.currentTurnPlayerId) {
      return { success: false, message: "현재 플레이어가 아닙니다" };
    }

    if (this.gameOver) {
      return { success: false, message: "게임이 이미 끝났습니다" };
    }

    const spell = this.spellsMap.get(spellId);
    if (!spell) {
      return { success: false, message: "존재하지 않는 마법입니다" };
    }

    const attacker = this.getPlayer(playerId);
    const defender = this.getPlayer(targetId);

    // Validate spell early, before applying turn-start sequence
    // This ensures we don't mark turnStarted if the spell cast will fail
    const validation = validateSpellCast(spell, attacker, defender, this);
    if (!validation.valid) {
      return { success: false, message: validation.reason };
    }

    // Apply turn-start sequence at the beginning of the turn (only once)
    if (!this.turnStarted) {
      const turnStartResult = applyTurnStartSequence(this, playerId);
      this.turnStarted = true;

      if (turnStartResult.gameOver) {
        return { success: false, message: "게임이 종료되었습니다" };
      }

      // Check if player is stunned
      if (hasStatusEffect(attacker, "stun")) {
        this.battleLog.push({
          type: "action_skipped",
          playerId,
          reason: "stun",
        });
        return this.endTurn();
      }
    }

    // Apply action sequence
    const actionResult = applyActionSequence(this, spell, attacker, defender);

    if (!actionResult.valid) {
      // If validation failed, don't consume the turn
      return { success: false, message: actionResult.reason };
    }

    // Turn successful, end the turn
    return this.endTurn();
  }

  /**
   * Skip the current turn
   * @returns {Object} {success: boolean, message: string}
   */
  skipTurn() {
    if (this.gameOver) {
      return { success: false, message: "게임이 이미 끝났습니다" };
    }

    // Apply turn-start sequence if not already applied
    if (!this.turnStarted) {
      const currentPlayer = this.getCurrentPlayer();
      const turnStartResult = applyTurnStartSequence(this, this.currentTurnPlayerId);
      this.turnStarted = true;

      if (turnStartResult.gameOver) {
        return { success: false, message: "게임이 종료되었습니다" };
      }

      // Check if player is stunned (can still skip if stunned)
      if (hasStatusEffect(currentPlayer, "stun")) {
        this.battleLog.push({
          type: "action_skipped",
          playerId: this.currentTurnPlayerId,
          reason: "stun",
        });
      }
    }

    return this.endTurn();
  }

  /**
   * End current turn and switch to opponent
   * @returns {Object} {success: boolean, message: string}
   */
  endTurn() {
    const currentPlayer = this.getCurrentPlayer();

    // Decrement status effect durations
    decrementEffectDurations(this, this.currentTurnPlayerId);

    // Switch turn
    this.currentTurnPlayerId =
      this.currentTurnPlayerId === this.player1.id ? this.player2.id : this.player1.id;
    this.turnCount++;
    this.turnStarted = false;

    // Record turn in history
    this.turnHistory.push({
      turnNumber: this.turnCount,
      playerId: this.getOpponent(this.currentTurnPlayerId).id,
      battleLogLength: this.battleLog.length,
    });

    return { success: true, message: "턴 종료" };
  }

  /**
   * Get turn history
   * @returns {Array} Turn history array
   */
  getTurnHistory() {
    return this.turnHistory;
  }

  /**
   * Get current battle log
   * @returns {Array} Battle log
   */
  getBattleLog() {
    return this.battleLog;
  }

  /**
   * Get game state snapshot for UI
   * @returns {Object} Current state snapshot
   */
  getState() {
    return {
      player1: {
        id: this.player1.id,
        hp: this.player1.hp,
        maxHp: this.player1.maxHp,
        mana: this.player1.mana,
        maxMana: this.player1.maxMana,
        statusEffects: { ...this.player1.statusEffects },
      },
      player2: {
        id: this.player2.id,
        hp: this.player2.hp,
        maxHp: this.player2.maxHp,
        mana: this.player2.mana,
        maxMana: this.player2.maxMana,
        statusEffects: { ...this.player2.statusEffects },
      },
      currentTurnPlayerId: this.currentTurnPlayerId,
      turnCount: this.turnCount,
      gameOver: this.gameOver,
      winner: this.winner,
    };
  }
}
