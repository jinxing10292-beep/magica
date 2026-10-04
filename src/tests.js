/**
 * Inline browser console tests for Magica game engine
 * Run with: runTests() in browser DevTools console
 */

function runTests() {
  console.clear();
  console.log("🧪 Magica Game Engine Tests Starting...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✓ ${message}`);
      passed++;
    } else {
      console.error(`✗ ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: Spells loaded
    console.log("--- Test 1: Spell System ---");
    assert(SPELLS && SPELLS.size === 12, "All 12 spells loaded");
    assert(SPELLS.has("arcane_bolt"), "아케인 볼트 exists");
    assert(SPELLS.has("heal"), "치유 exists");
    assert(SPELLS.has("shield"), "방어막 exists");
    assert(SPELLS.has("mirror"), "반사 exists");
    assert(SPELLS.has("poison"), "맹독 exists");
    assert(SPELLS.has("weaken"), "약화 exists");
    assert(SPELLS.has("strengthen"), "강화 exists");
    assert(SPELLS.has("blind"), "실명 exists");
    assert(SPELLS.has("chill"), "감기 exists");
    assert(SPELLS.has("stun"), "기절 exists");
    assert(SPELLS.has("pain"), "고통 exists");
    assert(SPELLS.has("cleanse"), "정화 exists");

    // Test 2: Spell properties
    console.log("\n--- Test 2: Spell Properties ---");
    const arcaneBolt = SPELLS.get("arcane_bolt");
    assert(arcaneBolt.name === "아케인 볼트", "아케인 볼트 Korean name");
    assert(arcaneBolt.manaCost === 15, "아케인 볼트 mana cost 15");
    assert(arcaneBolt.targetType === "other", "아케인 볼트 targets other");

    const heal = SPELLS.get("heal");
    assert(heal.manaCost === 20, "치유 mana cost 20");
    assert(heal.targetType === "self", "치유 targets self");

    const poison = SPELLS.get("poison");
    assert(poison.manaCost === 20, "맹독 mana cost 20");

    // Test 3: GameState initialization
    console.log("\n--- Test 3: GameState Initialization ---");
    const game = new GameState("player1", "player2", SPELLS);

    assert(game.player1.hp === 100, "Player 1 starts with 100 HP");
    assert(game.player1.maxHp === 100, "Player 1 max HP is 100");
    assert(game.player1.mana === 60, "Player 1 starts with 60 mana");
    assert(game.player1.maxMana === 100, "Player 1 max mana is 100");

    assert(game.player2.hp === 100, "Player 2 starts with 100 HP");
    assert(game.player2.mana === 60, "Player 2 starts with 60 mana");

    assert(game.gameOver === false, "Game not over at start");
    assert(game.currentTurnPlayerId === "player1", "Player 1 goes first");
    assert(game.turnCount === 0, "Turn count starts at 0");

    // Test 4: Spell validation
    console.log("\n--- Test 4: Spell Validation ---");
    const canCast = game.canCastSpell("player1", "arcane_bolt", "player2");
    assert(canCast.valid === true, "Player 1 can cast arcane_bolt on player2");

    const cannotCastSelf = game.canCastSpell("player1", "arcane_bolt", "player1");
    assert(cannotCastSelf.valid === false, "Cannot cast arcane_bolt on self");

    const canCastHeal = game.canCastSpell("player1", "heal", "player1");
    assert(canCastHeal.valid === true, "Player 1 can cast heal on self");

    const cannotCastHealOther = game.canCastSpell("player1", "heal", "player2");
    assert(cannotCastHealOther.valid === false, "Cannot cast heal on opponent");

    // Test 5: Damage calculation
    console.log("\n--- Test 5: Damage Calculation ---");
    // Base 20 damage with no modifiers
    let dmg = calculateDamage(20, game.player1, game.player2, game);
    assert(dmg === 20, "20 base damage = 20 (no modifiers)");

    // Add strengthen (×1.25)
    game.player1.statusEffects["strengthen"] = 1;
    dmg = calculateDamage(20, game.player1, game.player2, game);
    assert(dmg === 25, "20 × 1.25 (strengthen) = 25");

    // Add weaken (×0.75)
    game.player2.statusEffects["weaken"] = 1;
    dmg = calculateDamage(20, game.player1, game.player2, game);
    assert(dmg === Math.floor(25 * 0.75), "20 × 1.25 × 0.75 (weaken) = 18");

    // Add shield (×0.6)
    game.player2.statusEffects["shield"] = 1;
    dmg = calculateDamage(20, game.player1, game.player2, game);
    assert(dmg === Math.floor(25 * 0.75 * 0.6), "Full modifier chain = 11");

    // Reset effects
    game.player1.statusEffects = {};
    game.player2.statusEffects = {};

    // Test 6: Status effects
    console.log("\n--- Test 6: Status Effects ---");
    const refreshTest = new GameState("p1", "p2", SPELLS);
    refreshStatusEffect(refreshTest, "p1", "strengthen", 2);
    assert(refreshTest.player1.statusEffects["strengthen"] === 2, "Status effect set to 2");

    refreshStatusEffect(refreshTest, "p1", "strengthen", 2);
    assert(refreshTest.player1.statusEffects["strengthen"] === 2, "Effect duration refreshes (not stacks)");

    // Test 7: Hazardous spells classification
    console.log("\n--- Test 7: Spell Classifications ---");
    const testGame = new GameState("p1", "p2", SPELLS);

    assert(HARMFUL_SPELLS.includes("arcane_bolt"), "arcane_bolt is harmful");
    assert(HARMFUL_SPELLS.includes("poison"), "poison is harmful");
    assert(!HARMFUL_SPELLS.includes("heal"), "heal is not harmful");
    assert(DIRECT_DAMAGE_SPELLS.includes("arcane_bolt"), "arcane_bolt is direct damage");
    assert(!DIRECT_DAMAGE_SPELLS.includes("poison"), "poison is not direct damage");

    // Test 8: Turn start sequence
    console.log("\n--- Test 8: Turn Start Sequence ---");
    const turnGame = new GameState("p1", "p2", SPELLS);

    // Apply mana recovery
    turnGame.player1.mana = 60;
    applyTurnStartSequence(turnGame, "p1");
    assert(turnGame.player1.mana === turnGame.player1.maxMana, "Mana recovered to max (100)");

    // Apply chill (reduces mana recovery from 15 to 5)
    turnGame.player1.mana = 70;
    turnGame.player1.statusEffects["chill"] = 1;
    applyTurnStartSequence(turnGame, "p1");
    assert(turnGame.player1.mana === 75, "Chill reduces mana recovery to 5 (70 + 5 = 75)");

    // Test 9: DOT damage
    console.log("\n--- Test 9: DOT Damage ---");
    const dotGame = new GameState("p1", "p2", SPELLS);
    dotGame.player2.hp = 100;
    dotGame.player2.statusEffects["poison"] = 1;
    dotGame.player2.statusEffects["pain"] = 1;

    applyTurnStartSequence(dotGame, "p2");
    assert(dotGame.player2.hp === 100 - 7 - 5, "Poison (7) + Pain (5) = 12 damage");

    // Test 10: Healing reduction by Pain
    console.log("\n--- Test 10: Healing with Pain ---");
    const painGame = new GameState("p1", "p2", SPELLS);
    painGame.player1.hp = 80;
    painGame.player1.statusEffects["pain"] = 1;

    const heal_spell = SPELLS.get("heal");
    applyActionSequence(painGame, heal_spell, painGame.player1, painGame.player1);

    // Base healing 25 with Pain = floor(25 * 0.5) = 12
    // So HP should be 80 + 12 = 92
    assert(painGame.player1.hp === 92, "Healing reduced by Pain: 25 → 12, HP: 80 → 92");

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Tests Complete: ${passed} passed, ${failed} failed`);
    console.log("=".repeat(50) + "\n");

    if (failed === 0) {
      console.log("🎉 All tests passed! Game engine is ready.");
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Review the implementation.`);
    }
  } catch (error) {
    console.error("\n❌ Test execution error:", error);
    console.error(error.stack);
  }
}

// Make runTests globally available
window.runTests = runTests;
