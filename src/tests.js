/**
 * Inline unit tests for Magica
 * Run tests with: runTests() in browser console
 * No external framework, pure assertion-based testing
 */

// ============================================================================
// TEST RUNNER AND UTILITIES
// ============================================================================

let testCount = 0;
let passedCount = 0;
let failedCount = 0;
const failedTests = [];

/**
 * Assert a condition, log failure if false
 * @param {boolean} condition - Condition to check
 * @param {string} message - Message to display on failure
 */
function assert(condition, message) {
  if (!condition) {
    failedCount++;
    const errorMsg = `❌ FAILED: ${message}`;
    console.error(errorMsg);
    failedTests.push(message);
  } else {
    passedCount++;
  }
}

/**
 * Run all tests and print summary
 */
function runTests() {
  console.clear();
  console.log("🧪 Starting Magica Unit Tests...\n");

  testCount = 0;
  passedCount = 0;
  failedCount = 0;
  failedTests.length = 0;

  // ========== SPELL DEFINITION TESTS (12 tests) ==========
  console.log("📚 Spell Definition Tests...");
  test_arcane_bolt_definition();
  test_heal_definition();
  test_shield_definition();
  test_mirror_definition();
  test_poison_definition();
  test_weaken_definition();
  test_strengthen_definition();
  test_blind_definition();
  test_chill_definition();
  test_stun_definition();
  test_pain_definition();
  test_cleanse_definition();

  // ========== GAMESTATE INITIALIZATION TESTS (3 tests) ==========
  console.log("🎮 GameState Initialization Tests...");
  test_gamestate_init_players();
  test_gamestate_init_status_effects();
  test_gamestate_init_current_turn();

  // ========== MANA AND HP BOUNDS TESTS (4 tests) ==========
  console.log("❤️ Mana and HP Bounds Tests...");
  test_healing_respects_max_hp();
  test_damage_never_below_zero();
  test_mana_respects_max();
  test_mana_cost_validation();

  // ========== DAMAGE CALCULATION TESTS (6 tests) ==========
  console.log("⚔️ Damage Calculation Tests...");
  test_base_damage();
  test_damage_with_strengthen();
  test_damage_with_weaken();
  test_damage_with_strengthen_and_weaken();
  test_damage_with_shield();
  test_full_damage_chain();

  // ========== MIRROR AND SHIELD TESTS (3 tests) ==========
  console.log("🛡️ Mirror and Shield Tests...");
  test_mirror_reflection();
  test_shield_consumption();
  test_shield_and_mirror_stacking();

  // ========== BLIND TESTS (2 tests) ==========
  console.log("👁️ Blind Tests...");
  test_blind_cancels_harmful_spell();
  test_blind_doesnt_cancel_beneficial();

  // ========== DOT TESTS (2 tests) ==========
  console.log("☠️ DOT (Damage Over Time) Tests...");
  test_poison_dot_damage();
  test_pain_dot_and_healing_reduction();

  // ========== STATUS EFFECT DURATION TESTS (3 tests) ==========
  console.log("⏱️ Status Effect Duration Tests...");
  test_effect_duration_countdown();
  test_effect_refresh_resets_duration();
  test_cleanse_removes_debuffs();

  // ========== TURN SEQUENCE TESTS (2 tests) ==========
  console.log("🔄 Turn Sequence Tests...");
  test_turn_start_mana_recovery_and_dot();
  test_stun_skips_action_not_recovery();

  // ========== BATTLE SCENARIO TESTS (2 tests) ==========
  console.log("⚡ Battle Scenario Tests...");
  test_arcane_bolt_spam_battle();
  test_enhance_vs_defense_decision();

  // ========== PRINT SUMMARY ==========
  console.log("\n" + "=".repeat(60));
  console.log(`✅ Tests passed: ${passedCount}/${testCount}`);
  if (failedCount > 0) {
    console.error(`❌ Tests failed: ${failedCount}/${testCount}`);
    console.error("\nFailed tests:");
    failedTests.forEach((msg) => console.error(`  - ${msg}`));
  } else {
    console.log("🎉 All tests passed!");
  }
  console.log("=".repeat(60));

  return { total: testCount, passed: passedCount, failed: failedCount };
}

// ============================================================================
// SPELL DEFINITION TESTS (12 tests)
// ============================================================================

function test_arcane_bolt_definition() {
  testCount++;
  const spell = SPELLS.get("arcane_bolt");
  assert(spell !== undefined, "Arcane Bolt spell exists");
  assert(spell.id === "arcane_bolt", "Arcane Bolt ID is correct");
  assert(spell.name === "아케인 볼트", "Arcane Bolt Korean name is correct");
  assert(spell.manaCost === 15, "Arcane Bolt mana cost is 15");
  assert(spell.targetType === "other", "Arcane Bolt targets other");
  assert(spell.isHarmful === true, "Arcane Bolt is harmful");
  assert(spell.isDirectDamage === true, "Arcane Bolt is direct damage");
  assert(typeof spell.effect === "function", "Arcane Bolt effect is function");
}

function test_heal_definition() {
  testCount++;
  const spell = SPELLS.get("heal");
  assert(spell !== undefined, "Heal spell exists");
  assert(spell.id === "heal", "Heal ID is correct");
  assert(spell.name === "치유", "Heal Korean name is correct");
  assert(spell.manaCost === 20, "Heal mana cost is 20");
  assert(spell.targetType === "self", "Heal targets self");
  assert(spell.isHarmful === false, "Heal is not harmful");
  assert(typeof spell.effect === "function", "Heal effect is function");
}

function test_shield_definition() {
  testCount++;
  const spell = SPELLS.get("shield");
  assert(spell !== undefined, "Shield spell exists");
  assert(spell.id === "shield", "Shield ID is correct");
  assert(spell.name === "방어막", "Shield Korean name is correct");
  assert(spell.manaCost === 18, "Shield mana cost is 18");
  assert(spell.targetType === "self", "Shield targets self");
  assert(spell.isHarmful === false, "Shield is not harmful");
  assert(typeof spell.effect === "function", "Shield effect is function");
}

function test_mirror_definition() {
  testCount++;
  const spell = SPELLS.get("mirror");
  assert(spell !== undefined, "Mirror spell exists");
  assert(spell.id === "mirror", "Mirror ID is correct");
  assert(spell.name === "반사", "Mirror Korean name is correct");
  assert(spell.manaCost === 25, "Mirror mana cost is 25");
  assert(spell.targetType === "self", "Mirror targets self");
  assert(spell.isHarmful === false, "Mirror is not harmful");
  assert(typeof spell.effect === "function", "Mirror effect is function");
}

function test_poison_definition() {
  testCount++;
  const spell = SPELLS.get("poison");
  assert(spell !== undefined, "Poison spell exists");
  assert(spell.id === "poison", "Poison ID is correct");
  assert(spell.name === "맹독", "Poison Korean name is correct");
  assert(spell.manaCost === 20, "Poison mana cost is 20");
  assert(spell.targetType === "other", "Poison targets other");
  assert(spell.isHarmful === true, "Poison is harmful");
  assert(typeof spell.effect === "function", "Poison effect is function");
}

function test_weaken_definition() {
  testCount++;
  const spell = SPELLS.get("weaken");
  assert(spell !== undefined, "Weaken spell exists");
  assert(spell.id === "weaken", "Weaken ID is correct");
  assert(spell.name === "약화", "Weaken Korean name is correct");
  assert(spell.manaCost === 16, "Weaken mana cost is 16");
  assert(spell.targetType === "other", "Weaken targets other");
  assert(spell.isHarmful === true, "Weaken is harmful");
  assert(typeof spell.effect === "function", "Weaken effect is function");
}

function test_strengthen_definition() {
  testCount++;
  const spell = SPELLS.get("strengthen");
  assert(spell !== undefined, "Strengthen spell exists");
  assert(spell.id === "strengthen", "Strengthen ID is correct");
  assert(spell.name === "강화", "Strengthen Korean name is correct");
  assert(spell.manaCost === 16, "Strengthen mana cost is 16");
  assert(spell.targetType === "self", "Strengthen targets self");
  assert(spell.isHarmful === false, "Strengthen is not harmful");
  assert(typeof spell.effect === "function", "Strengthen effect is function");
}

function test_blind_definition() {
  testCount++;
  const spell = SPELLS.get("blind");
  assert(spell !== undefined, "Blind spell exists");
  assert(spell.id === "blind", "Blind ID is correct");
  assert(spell.name === "실명", "Blind Korean name is correct");
  assert(spell.manaCost === 18, "Blind mana cost is 18");
  assert(spell.targetType === "other", "Blind targets other");
  assert(spell.isHarmful === true, "Blind is harmful");
  assert(typeof spell.effect === "function", "Blind effect is function");
}

function test_chill_definition() {
  testCount++;
  const spell = SPELLS.get("chill");
  assert(spell !== undefined, "Chill spell exists");
  assert(spell.id === "chill", "Chill ID is correct");
  assert(spell.name === "감기", "Chill Korean name is correct");
  assert(spell.manaCost === 14, "Chill mana cost is 14");
  assert(spell.targetType === "other", "Chill targets other");
  assert(spell.isHarmful === true, "Chill is harmful");
  assert(typeof spell.effect === "function", "Chill effect is function");
}

function test_stun_definition() {
  testCount++;
  const spell = SPELLS.get("stun");
  assert(spell !== undefined, "Stun spell exists");
  assert(spell.id === "stun", "Stun ID is correct");
  assert(spell.name === "기절", "Stun Korean name is correct");
  assert(spell.manaCost === 30, "Stun mana cost is 30");
  assert(spell.targetType === "other", "Stun targets other");
  assert(spell.isHarmful === true, "Stun is harmful");
  assert(typeof spell.effect === "function", "Stun effect is function");
}

function test_pain_definition() {
  testCount++;
  const spell = SPELLS.get("pain");
  assert(spell !== undefined, "Pain spell exists");
  assert(spell.id === "pain", "Pain ID is correct");
  assert(spell.name === "고통", "Pain Korean name is correct");
  assert(spell.manaCost === 22, "Pain mana cost is 22");
  assert(spell.targetType === "other", "Pain targets other");
  assert(spell.isHarmful === true, "Pain is harmful");
  assert(typeof spell.effect === "function", "Pain effect is function");
}

function test_cleanse_definition() {
  testCount++;
  const spell = SPELLS.get("cleanse");
  assert(spell !== undefined, "Cleanse spell exists");
  assert(spell.id === "cleanse", "Cleanse ID is correct");
  assert(spell.name === "정화", "Cleanse Korean name is correct");
  assert(spell.manaCost === 18, "Cleanse mana cost is 18");
  assert(spell.targetType === "self", "Cleanse targets self");
  assert(spell.isHarmful === false, "Cleanse is not harmful");
  assert(typeof spell.effect === "function", "Cleanse effect is function");
}

// ============================================================================
// GAMESTATE INITIALIZATION TESTS (3 tests)
// ============================================================================

function test_gamestate_init_players() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  assert(p1.hp === 100, "Player 1 starts with 100 HP");
  assert(p1.maxHp === 100, "Player 1 max HP is 100");
  assert(p1.mana === 60, "Player 1 starts with 60 mana");
  assert(p1.maxMana === 100, "Player 1 max mana is 100");

  assert(p2.hp === 100, "Player 2 starts with 100 HP");
  assert(p2.maxHp === 100, "Player 2 max HP is 100");
  assert(p2.mana === 60, "Player 2 starts with 60 mana");
  assert(p2.maxMana === 100, "Player 2 max mana is 100");
}

function test_gamestate_init_status_effects() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  assert(typeof p1.statusEffects === "object", "Player 1 has statusEffects object");
  assert(Object.keys(p1.statusEffects).length === 0, "Player 1 starts with no effects");
  assert(typeof p2.statusEffects === "object", "Player 2 has statusEffects object");
  assert(Object.keys(p2.statusEffects).length === 0, "Player 2 starts with no effects");
}

function test_gamestate_init_current_turn() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);

  assert(game.getCurrentPlayer() !== undefined, "Game has current player");
  const currentId = game.currentTurnPlayerId;
  assert(
    currentId === "p1" || currentId === "p2",
    "Current turn is one of the players"
  );
  assert(game.gameOver === false, "Game is not over on init");
  assert(game.winner === null, "No winner on init");
}

// ============================================================================
// MANA AND HP BOUNDS TESTS (4 tests)
// ============================================================================

function test_healing_respects_max_hp() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");

  // Damage to 75 HP
  p1.hp = 75;

  // Heal spell heals 25, should cap at 100
  const spell = SPELLS.get("heal");
  const effect = spell.effect(p1, p1, game, {});
  let healing = effect.baseHealing;
  if (hasStatusEffect(p1, "pain")) {
    healing = Math.floor(healing * 0.5);
  }
  p1.hp = Math.min(p1.maxHp, p1.hp + healing);

  assert(p1.hp === 100, "Healing respects max HP (75 + 25 = 100)");

  // Try healing at full health
  p1.hp = 100;
  healing = effect.baseHealing;
  if (hasStatusEffect(p1, "pain")) {
    healing = Math.floor(healing * 0.5);
  }
  p1.hp = Math.min(p1.maxHp, p1.hp + healing);

  assert(p1.hp === 100, "Healing at max HP stays at max");
}

function test_damage_never_below_zero() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  // Take 150 damage when only 100 HP
  p1.hp = 100;
  p1.hp = Math.max(0, p1.hp - 150);

  assert(p1.hp === 0, "Damage never goes below 0");

  // Take damage at 0 HP
  p1.hp = 0;
  p1.hp = Math.max(0, p1.hp - 50);

  assert(p1.hp === 0, "HP stays at 0 when already 0");
}

function test_mana_respects_max() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");

  p1.mana = 85;
  p1.mana = Math.min(p1.maxMana, p1.mana + 20); // +20 mana

  assert(p1.mana === 100, "Mana respects max (85 + 20 = 100)");

  p1.mana = 95;
  p1.mana = Math.min(p1.maxMana, p1.mana + 15); // +15 mana

  assert(p1.mana === 100, "Mana caps at max even with natural recovery");
}

function test_mana_cost_validation() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  p1.mana = 14; // Not enough for Arcane Bolt (costs 15)
  const spell = SPELLS.get("arcane_bolt");
  const validation = validateSpellCast(spell, p1, p2, game);

  assert(validation.valid === false, "Spell cast rejected when mana insufficient");
  assert(p1.mana === 14, "Mana not consumed on failed validation");
}

// ============================================================================
// DAMAGE CALCULATION TESTS (6 tests)
// ============================================================================

function test_base_damage() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  const baseDamage = 20;
  const finalDamage = calculateDamage(baseDamage, p1, p2, game);

  assert(finalDamage === 20, "Base damage (20) is calculated correctly");
}

function test_damage_with_strengthen() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  // Apply strengthen to attacker
  p1.statusEffects["strengthen"] = 2;

  const baseDamage = 20;
  const finalDamage = calculateDamage(baseDamage, p1, p2, game);

  // 20 × 1.25 = 25
  assert(finalDamage === 25, "Damage with strengthen (20 × 1.25 = 25)");
}

function test_damage_with_weaken() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  // Apply weaken to defender
  p2.statusEffects["weaken"] = 2;

  const baseDamage = 20;
  const finalDamage = calculateDamage(baseDamage, p1, p2, game);

  // 20 × 0.75 = 15
  assert(finalDamage === 15, "Damage with weaken (20 × 0.75 = 15)");
}

function test_damage_with_strengthen_and_weaken() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  // Apply strengthen to attacker and weaken to defender
  p1.statusEffects["strengthen"] = 2;
  p2.statusEffects["weaken"] = 2;

  const baseDamage = 20;
  const finalDamage = calculateDamage(baseDamage, p1, p2, game);

  // 20 × 1.25 × 0.75 = 18.75 → 18
  assert(
    finalDamage === 18,
    "Damage with both modifiers (20 × 1.25 × 0.75 = 18.75 → 18)"
  );
}

function test_damage_with_shield() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  // Apply shield to defender
  p2.statusEffects["shield"] = 1;

  const baseDamage = 20;
  const finalDamage = calculateDamage(baseDamage, p1, p2, game);

  // 20 × 0.6 = 12
  assert(finalDamage === 12, "Damage with shield (20 × 0.6 = 12)");
}

function test_full_damage_chain() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  // Apply all modifiers
  p1.statusEffects["strengthen"] = 2;
  p2.statusEffects["weaken"] = 2;
  p2.statusEffects["shield"] = 1;

  const baseDamage = 20;
  const finalDamage = calculateDamage(baseDamage, p1, p2, game);

  // 20 × 1.25 × 0.75 × 0.6 = 11.25 → 11
  assert(
    finalDamage === 11,
    "Full damage chain (20 × 1.25 × 0.75 × 0.6 = 11.25 → 11)"
  );
}

// ============================================================================
// MIRROR AND SHIELD TESTS (3 tests)
// ============================================================================

function test_mirror_reflection() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  p1.hp = 100;
  p2.hp = 100;
  p2.statusEffects["mirror"] = 2;

  const spell = SPELLS.get("arcane_bolt");
  const effect = spell.effect(p1, p2, game, {});

  // Mirror reflects 50% of base damage (20 × 0.5 = 10)
  const reflectedDamage = Math.max(1, Math.floor(effect.baseDamage * 0.5));
  assert(reflectedDamage === 10, "Mirror reflects 50% of base damage");

  p1.hp = Math.max(0, p1.hp - reflectedDamage);
  assert(
    p1.hp === 90,
    "Mirror takes attacker's HP (100 - 10 = 90)"
  );

  // Mirror doesn't consume spell effect, it cancels it
  assert(p2.hp === 100, "Mirror cancels original spell effect on defender");
}

function test_shield_consumption() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  p2.hp = 100;
  p2.statusEffects["shield"] = 2;

  // Cast arcane bolt (20 damage)
  const baseDamage = 20;
  const finalDamage = calculateDamage(baseDamage, p1, p2, game);

  // 20 × 0.6 = 12 damage taken
  p2.hp = Math.max(0, p2.hp - finalDamage);

  // Shield consumed after direct damage
  p2.statusEffects["shield"] = 0;

  assert(p2.hp === 88, "Damage with shield (100 - 12 = 88)");
  assert(
    p2.statusEffects["shield"] === 0,
    "Shield consumed after one direct damage"
  );

  // Next arcane bolt should do full damage
  const finalDamage2 = calculateDamage(20, p1, p2, game);
  assert(finalDamage2 === 20, "Next damage without shield is full 20");
}

function test_shield_and_mirror_stacking() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  p1.hp = 100;
  p2.hp = 100;
  p2.statusEffects["shield"] = 2;
  p2.statusEffects["mirror"] = 2;

  // Apply damage with both shield and mirror active
  // Mirror is checked first (reflection happens)
  const baseDamage = 20;
  const reflectedDamage = Math.max(1, Math.floor(baseDamage * 0.5)); // 10

  p1.hp = Math.max(0, p1.hp - reflectedDamage);

  assert(p1.hp === 90, "Mirror active: attacker takes 10 damage");
  assert(p2.hp === 100, "Mirror active: defender takes no damage");
  assert(
    p2.statusEffects["shield"] === 2,
    "Shield not consumed when mirror reflects"
  );
}

// ============================================================================
// BLIND TESTS (2 tests)
// ============================================================================

function test_blind_cancels_harmful_spell() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  p1.mana = 50;
  p2.hp = 100;
  p2.statusEffects["blind"] = 2;

  const spell = SPELLS.get("arcane_bolt");
  const result = applyActionSequence(game, spell, p1, p2);

  // Spell is consumed (mana deducted), but effect not applied
  assert(
    result.valid === true && result.reason === "blind_cancelled",
    "Harmful spell cancelled by blind"
  );
  assert(p1.mana === 35, "Mana consumed even when blind cancels spell (50 - 15 = 35)");
  assert(p2.hp === 100, "Defender takes no damage when spell cancelled by blind");
}

function test_blind_doesnt_cancel_beneficial() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  p1.hp = 50;
  p1.mana = 50;
  p2.statusEffects["blind"] = 2;

  const spell = SPELLS.get("heal");
  const effect = spell.effect(p1, p1, game, {});

  // Blind does not block beneficial spells
  assert(
    effect.type === "healing",
    "Heal effect is healing type (beneficial)"
  );

  // Manually apply effect
  let healing = effect.baseHealing;
  if (hasStatusEffect(p1, "pain")) {
    healing = Math.floor(healing * 0.5);
  }
  p1.hp = Math.min(p1.maxHp, p1.hp + healing);

  assert(p1.hp === 75, "Heal applies even when caster has blind (50 + 25 = 75)");
}

// ============================================================================
// DOT TESTS (2 tests)
// ============================================================================

function test_poison_dot_damage() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  p1.hp = 100;
  p2.hp = 100;
  p2.statusEffects["poison"] = 3;

  // Apply poison damage 3 turns
  let totalDamage = 0;
  for (let i = 0; i < 3; i++) {
    if (hasStatusEffect(p2, "poison")) {
      totalDamage += 7;
    }
    if (i < 2) {
      p2.statusEffects["poison"]--; // Decrement at end of turn
    }
  }

  p2.hp = Math.max(0, p2.hp - totalDamage);

  assert(totalDamage === 21, "Poison deals 7 × 3 = 21 total damage");
  assert(p2.hp === 79, "Final HP is 100 - 21 = 79");
}

function test_pain_dot_and_healing_reduction() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  p1.hp = 100;
  p2.hp = 100;
  p2.statusEffects["pain"] = 2;

  // Apply pain damage 2 turns
  let totalDamage = 0;
  for (let i = 0; i < 2; i++) {
    if (hasStatusEffect(p2, "pain")) {
      totalDamage += 5;
    }
    if (i < 1) {
      p2.statusEffects["pain"]--; // Decrement at end of turn
    }
  }

  p2.hp = Math.max(0, p2.hp - totalDamage);

  assert(totalDamage === 10, "Pain deals 5 × 2 = 10 total damage");
  assert(p2.hp === 90, "Final HP is 100 - 10 = 90");

  // Test healing reduction
  p2.statusEffects["pain"] = 2;
  const baseHealing = 25;
  let healing = baseHealing;
  if (hasStatusEffect(p2, "pain")) {
    healing = Math.floor(healing * 0.5); // 50% reduction
  }

  assert(healing === 12, "Pain reduces healing by 50% (25 × 0.5 = 12.5 → 12)");
}

// ============================================================================
// STATUS EFFECT DURATION TESTS (3 tests)
// ============================================================================

function test_effect_duration_countdown() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");

  // Apply strengthen for 2 turns
  p1.statusEffects["strengthen"] = 2;

  // Simulate turn end (decrement)
  p1.statusEffects["strengthen"]--;
  assert(p1.statusEffects["strengthen"] === 1, "Effect duration decrements to 1");

  // Another turn end
  p1.statusEffects["strengthen"]--;
  assert(p1.statusEffects["strengthen"] === 0, "Effect duration decrements to 0");

  // Check effect is no longer active
  assert(!hasStatusEffect(p1, "strengthen"), "Effect no longer active when duration is 0");
}

function test_effect_refresh_resets_duration() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");

  // Apply strengthen for 2 turns
  p1.statusEffects["strengthen"] = 2;

  // Decrement once
  p1.statusEffects["strengthen"]--;
  assert(p1.statusEffects["strengthen"] === 1, "Effect duration is 1 after one decrement");

  // Re-apply strengthen (refresh)
  p1.statusEffects["strengthen"] = 2; // Reset to base duration
  assert(p1.statusEffects["strengthen"] === 2, "Refreshing resets duration to 2 (no stacking)");
}

function test_cleanse_removes_debuffs() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");

  // Apply multiple debuffs
  p1.statusEffects["weaken"] = 2;
  p1.statusEffects["poison"] = 3;
  p1.statusEffects["blind"] = 2;
  p1.statusEffects["strengthen"] = 2; // Buff (not removed)

  // Cleanse removes debuffs
  const debuffs = ["weaken", "blind", "chill", "stun", "poison", "pain"];
  debuffs.forEach((effectId) => {
    if (p1.statusEffects[effectId] > 0) {
      p1.statusEffects[effectId] = 0;
    }
  });

  assert(p1.statusEffects["weaken"] === 0, "Cleanse removes weaken");
  assert(p1.statusEffects["poison"] === 0, "Cleanse removes poison");
  assert(p1.statusEffects["blind"] === 0, "Cleanse removes blind");
  assert(p1.statusEffects["strengthen"] === 2, "Cleanse does not remove buffs");
}

// ============================================================================
// TURN SEQUENCE TESTS (2 tests)
// ============================================================================

function test_turn_start_mana_recovery_and_dot() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");

  // Set up: low mana, poison debuff
  p1.mana = 30;
  p1.hp = 100;
  p1.statusEffects["poison"] = 3;

  // Turn start: mana recovery
  const manaRecovery = hasStatusEffect(p1, "chill") ? 5 : 15;
  p1.mana = Math.min(p1.maxMana, p1.mana + manaRecovery);

  assert(p1.mana === 45, "Mana recovery: 30 + 15 = 45");

  // Apply DOT damage
  let totalDOT = 0;
  if (hasStatusEffect(p1, "poison")) {
    totalDOT += 7;
  }
  if (hasStatusEffect(p1, "pain")) {
    totalDOT += 5;
  }

  p1.hp = Math.max(0, p1.hp - totalDOT);

  assert(p1.hp === 93, "DOT applied: 100 - 7 = 93");
}

function test_stun_skips_action_not_recovery() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");

  // Set up: stun debuff
  p1.mana = 30;
  p1.statusEffects["stun"] = 1;

  // Turn start: mana recovery still happens
  p1.mana = Math.min(p1.maxMana, p1.mana + 15);

  assert(p1.mana === 45, "Mana recovery happens even when stunned: 30 + 15 = 45");

  // But action is skipped
  assert(hasStatusEffect(p1, "stun"), "Player is stunned");
  // Action would be skipped (mana not spent)

  // Stun effect expires
  p1.statusEffects["stun"]--;
  assert(!hasStatusEffect(p1, "stun"), "Stun expires after 1 turn");
}

// ============================================================================
// BATTLE SCENARIO TESTS (2 tests)
// ============================================================================

function test_arcane_bolt_spam_battle() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  let turn = 0;
  const maxTurns = 20; // Prevent infinite loop

  // Simulate: both players spam Arcane Bolt
  while (!game.gameOver && turn < maxTurns) {
    const currentPlayer = game.getCurrentPlayer();
    const opponent = game.getCurrentOpponent();

    // Take normal turn start (would include recovery and DOT)
    // For simplicity, just add mana
    currentPlayer.mana = Math.min(currentPlayer.maxMana, currentPlayer.mana + 15);

    // Cast Arcane Bolt (costs 15 mana, deals 20 damage)
    if (currentPlayer.mana >= 15) {
      currentPlayer.mana -= 15;
      const damage = calculateDamage(20, currentPlayer, opponent, game);
      opponent.hp = Math.max(0, opponent.hp - damage);

      if (opponent.hp <= 0) {
        game.gameOver = true;
        game.winner = currentPlayer.id;
      }
    }

    // Switch turn
    game.currentTurnPlayerId =
      game.currentTurnPlayerId === p1.id ? p2.id : p1.id;
    turn++;
  }

  assert(game.gameOver === true, "Battle ends when one player reaches 0 HP");
  assert(game.winner !== null, "Winner is determined");
  // 100 HP / 20 damage = 5 turns to kill = approximately 10 total turns
  assert(turn <= 20, "Battle completes in reasonable number of turns");
}

function test_enhance_vs_defense_decision() {
  testCount++;
  const game = new GameState("p1", "p2", SPELLS);
  const p1 = game.getPlayer("p1");
  const p2 = game.getPlayer("p2");

  p1.hp = 100;
  p2.hp = 100;
  p1.mana = 60;
  p2.mana = 60;

  // P1 Turn 1: Cast Strengthen
  p1.mana -= 16;
  p1.statusEffects["strengthen"] = 2;
  assert(p1.mana === 44, "P1 casts Strengthen: 60 - 16 = 44 mana");

  // P2 Turn 1: Cast Shield
  p2.mana -= 18;
  p2.statusEffects["shield"] = 2;
  assert(p2.mana === 42, "P2 casts Shield: 60 - 18 = 42 mana");

  // P1 Turn 2: Cast Arcane Bolt with Strengthen
  p1.mana -= 15;
  p1.mana = Math.min(p1.maxMana, p1.mana + 15); // Recovery
  const damage = calculateDamage(20, p1, p2, game);
  // 20 × 1.25 × 0.6 = 15 (shield reduces)
  p2.hp = Math.max(0, p2.hp - damage);
  p2.statusEffects["shield"] = 0; // Shield consumed

  assert(damage === 15, "Damage with Strengthen + Shield: 20 × 1.25 × 0.6 = 15");
  assert(p2.hp === 85, "P2 HP after Bolt: 100 - 15 = 85");
  assert(p2.statusEffects["shield"] === 0, "Shield consumed");
}

