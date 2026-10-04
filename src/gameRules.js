/**
 * Game rule enforcement helpers for Magica
 * Spell validation, damage calculation, turn sequences, and status effect management
 */

/**
 * Validate if a spell can be cast
 * @param {Object} spell - Spell object
 * @param {Object} attacker - Attacking player
 * @param {Object} defender - Defending player
 * @param {Object} gameState - Current game state
 * @returns {Object} {valid: boolean, reason: string}
 */
function validateSpellCast(spell, attacker, defender, gameState) {
  // Check mana cost
  if (attacker.mana < spell.manaCost) {
    return {
      valid: false,
      reason: `마나 부족 (필요: ${spell.manaCost}, 현재: ${attacker.mana})`,
    };
  }

  // Check target type validity
  if (spell.targetType === "self" && attacker.id !== defender.id) {
    return {
      valid: false,
      reason: "자신에게만 시전 가능한 마법입니다",
    };
  }

  if (spell.targetType === "other" && attacker.id === defender.id) {
    return {
      valid: false,
      reason: "상대방에게만 시전 가능한 마법입니다",
    };
  }

  return {
    valid: true,
    reason: "OK",
  };
}

/**
 * Calculate direct damage with modifiers
 * Base damage × strengthen × weaken × shield, floored, minimum 1
 * @param {number} baseDamage - Base damage amount
 * @param {Object} attacker - Attacking player
 * @param {Object} defender - Defending player
 * @param {Object} gameState - Current game state
 * @returns {number} Final damage after all modifiers
 */
function calculateDamage(baseDamage, attacker, defender, gameState) {
  let damage = baseDamage;

  // Apply strengthen (attacker's buff: +25%)
  if (hasStatusEffect(attacker, "strengthen")) {
    damage *= 1.25;
  }

  // Apply weaken (defender's debuff: -25%)
  if (hasStatusEffect(defender, "weaken")) {
    damage *= 0.75;
  }

  // Apply shield (defender's buff: -40%, but consumed after)
  // We return the reduced damage; shield consumption is handled separately
  if (hasStatusEffect(defender, "shield")) {
    damage *= 0.6;
  }

  // Floor the damage
  damage = Math.floor(damage);

  // Minimum 1 if original damage was positive
  if (baseDamage > 0 && damage < 1) {
    damage = 1;
  }

  return damage;
}

/**
 * Check if a player has a specific status effect
 * @param {Object} player - Player object
 * @param {string} effectId - Effect ID
 * @returns {boolean}
 */
function hasStatusEffect(player, effectId) {
  return player.statusEffects && player.statusEffects[effectId] && player.statusEffects[effectId] > 0;
}

/**
 * Get all active status effects for a player
 * @param {Object} player - Player object
 * @returns {string[]} Array of active effect IDs
 */
function getActiveStatusEffects(player) {
  if (!player.statusEffects) return [];
  return Object.keys(player.statusEffects).filter((effectId) => player.statusEffects[effectId] > 0);
}

/**
 * Apply turn-start sequence in correct order:
 * 1. Apply chill (reduce mana recovery)
 * 2. Recover mana
 * 3. Apply DOT damage (poison + pain)
 * 4. Check death
 * 5. Check stun
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Player whose turn is starting
 * @returns {Object} {gameOver: boolean, winner: string | null}
 */
function applyTurnStartSequence(gameState, playerId) {
  const player = gameState.getPlayer(playerId);
  const opponent = gameState.getOpponent(playerId);

  // 1. Determine mana recovery based on chill effect
  let manaRecovery = 15;
  if (hasStatusEffect(player, "chill")) {
    manaRecovery = 5;
    gameState.battleLog.push({
      type: "turn_start_chill",
      playerId,
    });
  }

  // 2. Recover mana (bounded by maxMana)
  const oldMana = player.mana;
  player.mana = Math.min(player.mana + manaRecovery, player.maxMana);
  gameState.battleLog.push({
    type: "turn_start_mana_recovery",
    playerId,
    amount: manaRecovery,
    oldMana,
    newMana: player.mana,
  });

  // 3. Apply DOT damage (poison: 7 per turn, pain: 5 per turn)
  let totalDOT = 0;
  const dotSources = [];

  if (hasStatusEffect(player, "poison")) {
    totalDOT += 7;
    dotSources.push("poison");
  }

  if (hasStatusEffect(player, "pain")) {
    totalDOT += 5;
    dotSources.push("pain");
  }

  // Apply DOT (not affected by modifiers)
  if (totalDOT > 0) {
    player.hp = Math.max(0, player.hp - totalDOT);
    gameState.battleLog.push({
      type: "turn_start_dot",
      playerId,
      damage: totalDOT,
      effects: dotSources,
    });
  }

  // 4. Check death
  if (player.hp <= 0) {
    gameState.gameOver = true;
    gameState.winner = opponent.id;
    gameState.battleLog.push({
      type: "death",
      playerId,
    });
    return { gameOver: true, winner: opponent.id };
  }

  // 5. Check stun (player skips action this turn)
  if (hasStatusEffect(player, "stun")) {
    gameState.battleLog.push({
      type: "turn_start_stun_skip",
      playerId,
    });
  }

  return { gameOver: false, winner: null };
}

/**
 * Apply action sequence for spell casting
 * 1. Validate spell
 * 2. Check blind (cancel if harmful)
 * 3. Check mirror reflection (only for direct damage)
 * 4. Apply damage with modifiers
 * 5. Handle shield consumption
 * 6. Apply status effects
 * @param {Object} gameState - Current game state
 * @param {Object} spell - Spell being cast
 * @param {Object} attacker - Attacking player
 * @param {Object} defender - Defending player
 * @returns {Object} {valid: boolean, reason: string}
 */
function applyActionSequence(gameState, spell, attacker, defender) {
  // 1. Validate spell
  const validation = validateSpellCast(spell, attacker, defender, gameState);
  if (!validation.valid) {
    return validation;
  }

  // Consume mana immediately
  attacker.mana -= spell.manaCost;

  const isHarmful = spell.isHarmful || false;
  const isDirectDamage = spell.isDirectDamage || false;

  // 2. Check blind (only blocks harmful spells)
  if (isHarmful && hasStatusEffect(defender, "blind")) {
    gameState.battleLog.push({
      type: "spell_blocked",
      spellId: spell.id,
      defenderId: defender.id,
      reason: "blind",
    });
    // Mana consumed, turn consumed, but effect not applied
    return { valid: true, reason: "blind_cancelled" };
  }

  // 4. Execute spell effect (get the effect result once, reuse it)
  const effectResult = spell.effect(attacker, defender, gameState, {});

  // 3. Check mirror reflection (only for direct damage)
  if (isDirectDamage && hasStatusEffect(defender, "mirror")) {
    // Attacker takes 50% of base damage (ignores all modifiers)
    const reflectedDamage = Math.max(1, Math.floor(effectResult.baseDamage * 0.5));
    attacker.hp = Math.max(0, attacker.hp - reflectedDamage);

    gameState.battleLog.push({
      type: "mirror_reflection",
      defenderId: defender.id,
      attackerId: attacker.id,
      damage: reflectedDamage,
      baseSpellDamage: effectResult.baseDamage,
    });

    // Shield is not consumed by reflected damage
    // Spell effect is not applied (attacker takes damage instead)
    return { valid: true, reason: "mirror_reflected" };
  }

  if (effectResult.type === "direct_damage") {
    const damage = calculateDamage(effectResult.baseDamage, attacker, defender, gameState);
    defender.hp = Math.max(0, defender.hp - damage);

    gameState.battleLog.push({
      type: "direct_damage",
      spellId: spell.id,
      attackerId: attacker.id,
      defenderId: defender.id,
      baseDamage: effectResult.baseDamage,
      finalDamage: damage,
    });

    // 5. Consume shield (one-time use on direct damage)
    if (hasStatusEffect(defender, "shield")) {
      defender.statusEffects["shield"] = 0;
      gameState.battleLog.push({
        type: "shield_consumed",
        playerId: defender.id,
      });
    }
  } else if (effectResult.type === "healing") {
    let healing = effectResult.baseHealing;

    // Pain reduces healing by 50%
    if (hasStatusEffect(defender, "pain")) {
      healing = Math.floor(healing * 0.5);
    }

    defender.hp = Math.min(defender.maxHp, defender.hp + healing);

    gameState.battleLog.push({
      type: "healing",
      spellId: spell.id,
      playerId: defender.id,
      baseHealing: effectResult.baseHealing,
      finalHealing: healing,
    });
  } else if (effectResult.type === "status_effect") {
    refreshStatusEffect(gameState, effectResult.target, effectResult.effectId, effectResult.duration);

    gameState.battleLog.push({
      type: "status_effect_applied",
      spellId: spell.id,
      playerId: effectResult.target,
      effectId: effectResult.effectId,
      duration: effectResult.duration,
    });
  } else if (effectResult.type === "cleanse") {
    const player = gameState.getPlayer(effectResult.target);
    const removedEffects = [];

    // Remove all debuffs (not buffs)
    const debuffs = ["weaken", "blind", "chill", "stun", "poison", "pain"];
    debuffs.forEach((effectId) => {
      if (player.statusEffects[effectId] > 0) {
        removedEffects.push(effectId);
        player.statusEffects[effectId] = 0;
      }
    });

    gameState.battleLog.push({
      type: "cleanse",
      playerId: effectResult.target,
      removedEffects,
    });
  }

  // Check death after damage
  if (defender.hp <= 0) {
    gameState.gameOver = true;
    gameState.winner = attacker.id;
    gameState.battleLog.push({
      type: "death",
      playerId: defender.id,
    });
  }

  return { valid: true, reason: "OK" };
}

/**
 * Decrement effect durations at turn end
 * Only decrement effects that existed at turn start
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Player whose turn is ending
 */
function decrementEffectDurations(gameState, playerId) {
  const player = gameState.getPlayer(playerId);

  if (!player.statusEffects) return;

  Object.keys(player.statusEffects).forEach((effectId) => {
    if (player.statusEffects[effectId] > 0) {
      player.statusEffects[effectId]--;
    }
  });

  gameState.battleLog.push({
    type: "effect_duration_decrement",
    playerId,
    remainingEffects: getActiveStatusEffects(player),
  });
}

/**
 * Set or refresh a status effect
 * If already active, reset duration to base duration (don't stack)
 * @param {Object} gameState - Current game state
 * @param {string} playerId - Target player ID
 * @param {string} effectId - Effect ID
 * @param {number} baseDuration - Base duration in turns
 */
function refreshStatusEffect(gameState, playerId, effectId, baseDuration) {
  const player = gameState.getPlayer(playerId);

  if (!player.statusEffects) {
    player.statusEffects = {};
  }

  player.statusEffects[effectId] = baseDuration;
}

/**
 * Spell classification helpers (imported from spells.js)
 * These are exported from spells.js and available globally
 */
let HARMFUL_SPELLS = [];
let DIRECT_DAMAGE_SPELLS = [];

function initializeGameRules() {
  if (typeof window !== "undefined" && window.HARMFUL_SPELLS && window.DIRECT_DAMAGE_SPELLS) {
    HARMFUL_SPELLS = window.HARMFUL_SPELLS;
    DIRECT_DAMAGE_SPELLS = window.DIRECT_DAMAGE_SPELLS;
  }
}
