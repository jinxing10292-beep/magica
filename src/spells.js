/**
 * Spell definitions for Magica
 * All 12 spells with exact Korean names, mana costs, target types, and effect functions
 */

const SPELLS = new Map([
  [
    "arcane_bolt",
    {
      id: "arcane_bolt",
      name: "아케인 볼트",
      manaCost: 15,
      targetType: "other",
      description: "즉시 직접 피해 20",
      isHarmful: true,
      isDirectDamage: true,
      effect: (attacker, defender, gameState, context) => {
        return {
          type: "direct_damage",
          baseDamage: 20,
          target: defender.id,
        };
      },
    },
  ],
  [
    "heal",
    {
      id: "heal",
      name: "치유",
      manaCost: 20,
      targetType: "self",
      description: "HP 25 회복. 최대 HP를 넘지 않음",
      isHarmful: false,
      isDirectDamage: false,
      effect: (attacker, defender, gameState, context) => {
        return {
          type: "healing",
          baseHealing: 25,
          target: attacker.id,
        };
      },
    },
  ],
  [
    "shield",
    {
      id: "shield",
      name: "방어막",
      manaCost: 18,
      targetType: "self",
      description: "최대 2턴 동안 다음 직접 피해 마법 피해량 40% 감소",
      isHarmful: false,
      isDirectDamage: false,
      effect: (attacker, defender, gameState, context) => {
        return {
          type: "status_effect",
          effectId: "shield",
          duration: 2,
          target: attacker.id,
        };
      },
    },
  ],
  [
    "mirror",
    {
      id: "mirror",
      name: "반사",
      manaCost: 25,
      targetType: "self",
      description: "최대 2턴 동안 다음 직접 피해 마법을 반사해 시전자에게 기본 피해의 50% 적용",
      isHarmful: false,
      isDirectDamage: false,
      effect: (attacker, defender, gameState, context) => {
        return {
          type: "status_effect",
          effectId: "mirror",
          duration: 2,
          target: attacker.id,
        };
      },
    },
  ],
  [
    "poison",
    {
      id: "poison",
      name: "맹독",
      manaCost: 20,
      targetType: "other",
      description: "다음 3번의 상대 턴 시작에 각각 7 지속 피해",
      isHarmful: true,
      isDirectDamage: false,
      effect: (attacker, defender, gameState, context) => {
        return {
          type: "status_effect",
          effectId: "poison",
          duration: 3,
          target: defender.id,
        };
      },
    },
  ],
  [
    "weaken",
    {
      id: "weaken",
      name: "약화",
      manaCost: 16,
      targetType: "other",
      description: "2턴 동안 직접 피해 마법 피해량 25% 감소",
      isHarmful: true,
      isDirectDamage: false,
      effect: (attacker, defender, gameState, context) => {
        return {
          type: "status_effect",
          effectId: "weaken",
          duration: 2,
          target: defender.id,
        };
      },
    },
  ],
  [
    "strengthen",
    {
      id: "strengthen",
      name: "강화",
      manaCost: 16,
      targetType: "self",
      description: "2턴 동안 직접 피해 마법 피해량 25% 증가",
      isHarmful: false,
      isDirectDamage: false,
      effect: (attacker, defender, gameState, context) => {
        return {
          type: "status_effect",
          effectId: "strengthen",
          duration: 2,
          target: attacker.id,
        };
      },
    },
  ],
  [
    "blind",
    {
      id: "blind",
      name: "실명",
      manaCost: 18,
      targetType: "other",
      description: "최대 2턴 동안 다음 해로운 마법 하나를 취소",
      isHarmful: true,
      isDirectDamage: false,
      effect: (attacker, defender, gameState, context) => {
        return {
          type: "status_effect",
          effectId: "blind",
          duration: 2,
          target: defender.id,
        };
      },
    },
  ],
  [
    "chill",
    {
      id: "chill",
      name: "감기",
      manaCost: 14,
      targetType: "other",
      description: "2턴 동안 턴 시작 마나 회복량 15를 5로 감소",
      isHarmful: true,
      isDirectDamage: false,
      effect: (attacker, defender, gameState, context) => {
        return {
          type: "status_effect",
          effectId: "chill",
          duration: 2,
          target: defender.id,
        };
      },
    },
  ],
  [
    "stun",
    {
      id: "stun",
      name: "기절",
      manaCost: 30,
      targetType: "other",
      description: "다음 상대 턴의 행동을 건너뜀",
      isHarmful: true,
      isDirectDamage: false,
      effect: (attacker, defender, gameState, context) => {
        return {
          type: "status_effect",
          effectId: "stun",
          duration: 1,
          target: defender.id,
        };
      },
    },
  ],
  [
    "pain",
    {
      id: "pain",
      name: "고통",
      manaCost: 22,
      targetType: "other",
      description: "다음 2번의 상대 턴 시작에 각각 5 지속 피해. 2턴 동안 받는 치유량 50% 감소",
      isHarmful: true,
      isDirectDamage: false,
      effect: (attacker, defender, gameState, context) => {
        return {
          type: "status_effect",
          effectId: "pain",
          duration: 2,
          target: defender.id,
        };
      },
    },
  ],
  [
    "cleanse",
    {
      id: "cleanse",
      name: "정화",
      manaCost: 18,
      targetType: "self",
      description: "자신에게 걸린 해로운 상태 효과를 모두 제거",
      isHarmful: false,
      isDirectDamage: false,
      effect: (attacker, defender, gameState, context) => {
        return {
          type: "cleanse",
          target: attacker.id,
        };
      },
    },
  ],
]);

// Spell classifications for backward compatibility
const HARMFUL_SPELLS = ["arcane_bolt", "poison", "weaken", "blind", "chill", "stun", "pain"];
const DIRECT_DAMAGE_SPELLS = ["arcane_bolt"];
const DOT_SPELLS = ["poison", "pain"];

// Effect properties
const EFFECT_PROPERTIES = {
  strengthen: { debuff: false },
  weaken: { debuff: true },
  shield: { debuff: false },
  mirror: { debuff: false },
  blind: { debuff: true },
  chill: { debuff: true },
  stun: { debuff: true },
  poison: { debuff: true, isDOT: true },
  pain: { debuff: true, isDOT: true },
};
