/**
 * Screen manager for Magica
 * Manages screen state transitions, rendering, and input routing
 */

class ScreenManager {
  /**
   * Initialize screen manager
   * @param {HTMLElement} containerElement - DOM element to render screens into
   * @param {Object} gameState - GameState instance
   */
  constructor(containerElement, gameState) {
    this.container = containerElement;
    this.gameState = gameState;
    this.currentScreenId = null;
    this.currentScreenData = {};
    this.screens = {};
    this.eventListeners = [];
    this.battleMockState = {
      isAutoplayingOpponent: false,
      reconnectOverlayActive: false,
    };
  }

  /**
   * Register a screen
   * @param {string} screenId - Unique screen ID
   * @param {Object} screenDef - Screen definition with render(data) and onInput(event, data)
   */
  registerScreen(screenId, screenDef) {
    this.screens[screenId] = screenDef;
  }

  /**
   * Set current screen
   * @param {string} screenId - Screen ID to show
   * @param {Object} initialData - Optional initial data for screen
   */
  setScreen(screenId, initialData = {}) {
    this.currentScreenId = screenId;
    this.currentScreenData = initialData;
    this.render();
  }

  /**
   * Get current screen ID
   * @returns {string} Current screen ID
   */
  getCurrentScreen() {
    return this.currentScreenId;
  }

  /**
   * Update current screen data and re-render
   * @param {Object} data - New data to merge
   */
  updateScreen(data = {}) {
    this.currentScreenData = { ...this.currentScreenData, ...data };
    this.render();
  }

  /**
   * Render current screen
   */
  render() {
    if (!this.currentScreenId) return;

    const screen = this.screens[this.currentScreenId];
    if (!screen) {
      console.error(`Screen not found: ${this.currentScreenId}`);
      return;
    }

    const html = screen.render(this.currentScreenData);
    this.container.innerHTML = html;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Attach event listeners to rendered elements
   */
  attachEventListeners() {
    const screen = this.screens[this.currentScreenId];
    if (!screen || !screen.onInput) return;

    // Attach click handlers to all interactive elements
    const elements = this.container.querySelectorAll("[data-action]");
    elements.forEach((el) => {
      el.addEventListener("click", (event) => {
        const action = el.getAttribute("data-action");
        const actionData = el.getAttribute("data-value");
        const result = screen.onInput(
          { type: "click", action, data: actionData },
          this.currentScreenData
        );

        if (result) {
          if (result.nextScreen) {
            this.setScreen(result.nextScreen, result.data || {});
          } else if (result.data) {
            this.updateScreen(result.data);
          }
        }
      });
    });
  }

  /**
   * Transition to a new screen with animation (if needed)
   * @param {string} screenId - Screen ID to transition to
   * @param {Object} data - Optional data
   */
  transitionTo(screenId, data = {}) {
    this.setScreen(screenId, data);
  }

  /**
   * Get game state for rendering
   * @returns {Object} Current game state
   */
  getGameState() {
    return this.gameState.getState();
  }

  /**
   * Get current player
   * @returns {Object} Current player
   */
  getCurrentPlayer() {
    return this.gameState.getCurrentPlayer();
  }

  /**
   * Get current opponent
   * @returns {Object} Current opponent
   */
  getCurrentOpponent() {
    return this.gameState.getCurrentOpponent();
  }
}

/**
 * Screen definitions for all game states
 */

const SCREENS = {
  main: {
    render(data) {
      return `
        <div class="screen screen-main">
          <div class="main-container">
            <h1 class="main-title">Magica</h1>
            <p class="main-subtitle">마법 대전</p>
            <button class="btn btn-primary btn-large" data-action="start_battle">
              대전 시작
            </button>
          </div>
        </div>
      `;
    },
    onInput(event, data) {
      if (event.action === "start_battle") {
        return { nextScreen: "search" };
      }
    },
  },

  search: {
    render(data) {
      const isMatched = data.matched || false;
      return `
        <div class="screen screen-search">
          <div class="search-container">
            <h2>상대 검색</h2>
            <div class="search-spinner"></div>
            <p class="search-status">${isMatched ? "매칭 완료!" : "상대를 찾는 중..."}</p>
            <button class="btn btn-secondary" data-action="cancel_search">
              취소
            </button>
          </div>
        </div>
      `;
    },
    onInput(event, data) {
      if (event.action === "cancel_search") {
        return { nextScreen: "main" };
      }
    },
  },

  battle: {
    render(data) {
      const gameState = data.gameState || {};
      const opponentId = data.opponentId || "opponent";
      const playerId = data.playerId || "player";
      const isMyTurn = gameState.currentTurnPlayerId === playerId;
      const isSurrender = data.showSurrenderConfirm || false;
      const isReconnecting = data.showReconnect || false;

      let opponentStats = { hp: 100, maxHp: 100, mana: 60, maxMana: 100, statusEffects: {} };
      let myStats = { hp: 100, maxHp: 100, mana: 60, maxMana: 100, statusEffects: {} };

      if (gameState.player1 && gameState.player2) {
        const p1 = gameState.player1;
        const p2 = gameState.player2;
        if (playerId === p1.id) {
          myStats = p1;
          opponentStats = p2;
        } else {
          myStats = p2;
          opponentStats = p1;
        }
      }

      const hpPercent = Math.max(0, Math.min(100, (myStats.hp / myStats.maxHp) * 100));
      const oppHpPercent = Math.max(0, Math.min(100, (opponentStats.hp / opponentStats.maxHp) * 100));
      const manaPercent = Math.max(0, Math.min(100, (myStats.mana / myStats.maxMana) * 100));
      const oppManaPercent = Math.max(0, Math.min(100, (opponentStats.mana / opponentStats.maxMana) * 100));

      // Build spell buttons
      let spellButtonsHtml = '';
      const availableSpells = Array.from(SPELLS.values());
      availableSpells.forEach((spell) => {
        const canCast = myStats.mana >= spell.manaCost && isMyTurn;
        const disabled = !canCast ? 'disabled' : '';
        const className = canCast ? 'spell-btn available' : 'spell-btn disabled';
        spellButtonsHtml += `
          <button class="${className}" data-action="cast_spell" data-value="${spell.id}" ${disabled}>
            <span class="spell-name">${spell.name}</span>
            <span class="spell-cost">${spell.manaCost}</span>
          </button>
        `;
      });

      // Build battle log
      let battleLogHtml = '<div class="battle-log-list">';
      const battleLog = data.battleLog || [];
      battleLog.forEach((entry, idx) => {
        let entryHtml = `<div class="log-entry log-${entry.type}">`;
        if (entry.type === 'direct_damage') {
          entryHtml += `<span class="log-attacker">${entry.attackerId}</span> 아케인 볼트 시전 → <span class="log-damage">${entry.finalDamage}</span> 피해`;
        } else if (entry.type === 'healing') {
          entryHtml += `<span class="log-actor">${entry.playerId}</span> 치유 → <span class="log-heal">${entry.finalHealing}</span> 회복`;
        } else if (entry.type === 'status_effect_applied') {
          entryHtml += `<span class="log-actor">${entry.playerId}</span>에게 상태 효과 적용: ${entry.effectId}`;
        } else if (entry.type === 'turn_start_dot') {
          entryHtml += `<span class="log-actor">${entry.playerId}</span> ${entry.damage} 지속 피해`;
        } else if (entry.type === 'dot_damage') {
          // Legacy log entry, keep for compatibility
          entryHtml += `<span class="log-actor">${entry.playerId}</span> ${entry.damage} 지속 피해`;
        } else if (entry.type === 'turn_start_mana_recovery') {
          entryHtml += `<span class="log-actor">${entry.playerId}</span> 마나 ${entry.amount} 회복 (${entry.oldMana} → ${entry.newMana})`;
        } else if (entry.type === 'turn_start_chill') {
          entryHtml += `<span class="log-actor">${entry.playerId}</span> 감기로 인해 마나 회복 감소`;
        } else if (entry.type === 'turn_start_stun_skip') {
          entryHtml += `<span class="log-actor">${entry.playerId}</span> 기절 상태로 행동 건너뜀`;
        } else if (entry.type === 'death') {
          entryHtml += `<span class="log-death">${entry.playerId} 패배</span>`;
        } else if (entry.type === 'spell_blocked') {
          entryHtml += `마법이 실명으로 인해 차단됨`;
        } else if (entry.type === 'shield_consumed') {
          entryHtml += `${entry.playerId}의 방어막이 소비됨`;
        } else if (entry.type === 'mirror_reflection') {
          entryHtml += `반사로 인해 <span class="log-attacker">${entry.attackerId}</span>에게 <span class="log-damage">${entry.damage}</span> 피해`;
        } else {
          entryHtml += entry.type;
        }
        entryHtml += '</div>';
        battleLogHtml += entryHtml;
      });
      battleLogHtml += '</div>';

      // Status effects display
      let oppEffectsHtml = '';
      if (opponentStats.statusEffects) {
        Object.keys(opponentStats.statusEffects).forEach((effectId) => {
          if (opponentStats.statusEffects[effectId] > 0) {
            oppEffectsHtml += `<span class="effect-badge effect-${effectId}">${effectId}</span>`;
          }
        });
      }

      let myEffectsHtml = '';
      if (myStats.statusEffects) {
        Object.keys(myStats.statusEffects).forEach((effectId) => {
          if (myStats.statusEffects[effectId] > 0) {
            myEffectsHtml += `<span class="effect-badge effect-${effectId}">${effectId}</span>`;
          }
        });
      }

      let reconnectOverlay = '';
      if (isReconnecting) {
        reconnectOverlay = `
          <div class="reconnect-overlay">
            <div class="reconnect-dialog">
              <h3>연결이 끊어졌습니다</h3>
              <p class="reconnect-timer">재접속 대기: <span id="reconnect-timer">60</span>초</p>
              <button class="btn btn-secondary" data-action="reconnect">재접속</button>
            </div>
          </div>
        `;
      }

      let surrenderConfirm = '';
      if (isSurrender) {
        surrenderConfirm = `
          <div class="modal-overlay">
            <div class="modal-dialog">
              <h3>항복하시겠습니까?</h3>
              <p>항복하면 경기에서 패배합니다.</p>
              <div class="modal-buttons">
                <button class="btn btn-secondary" data-action="cancel_surrender">취소</button>
                <button class="btn btn-danger" data-action="confirm_surrender">항복</button>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="screen screen-battle">
          ${reconnectOverlay}
          ${surrenderConfirm}
          
          <!-- Opponent stats (top) -->
          <div class="battle-opponent-stats">
            <div class="stat-row">
              <span class="stat-label">상대</span>
              <div class="hp-bar-container">
                <div class="hp-bar" style="width: ${oppHpPercent}%"></div>
              </div>
              <span class="stat-value">${opponentStats.hp}/${opponentStats.maxHp}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">마나</span>
              <div class="mana-bar-container">
                <div class="mana-bar" style="width: ${oppManaPercent}%"></div>
              </div>
              <span class="stat-value">${opponentStats.mana}/${opponentStats.maxMana}</span>
            </div>
            <div class="effects-row">${oppEffectsHtml}</div>
          </div>

          <!-- Battle log (center scrollable) -->
          <div class="battle-log">
            ${battleLogHtml}
          </div>

          <!-- Turn indicator -->
          <div class="turn-indicator">
            <span class="turn-label">${isMyTurn ? '내 턴' : '상대 턴'}</span>
          </div>

          <!-- My stats (bottom fixed) -->
          <div class="battle-my-stats">
            <div class="stat-row">
              <span class="stat-label">내 HP</span>
              <div class="hp-bar-container">
                <div class="hp-bar" style="width: ${hpPercent}%"></div>
              </div>
              <span class="stat-value">${myStats.hp}/${myStats.maxHp}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">마나</span>
              <div class="mana-bar-container">
                <div class="mana-bar" style="width: ${manaPercent}%"></div>
              </div>
              <span class="stat-value">${myStats.mana}/${myStats.maxMana}</span>
            </div>
            <div class="effects-row">${myEffectsHtml}</div>
          </div>

          <!-- Spell controls (bottom fixed) -->
          <div class="battle-controls">
            <div class="spell-buttons">
              ${spellButtonsHtml}
            </div>
            <div class="action-buttons">
              <button class="btn btn-secondary ${!isMyTurn ? 'disabled' : ''}" data-action="end_turn" ${!isMyTurn ? 'disabled' : ''}>
                턴 종료
              </button>
              <button class="btn btn-icon" data-action="show_menu">⋮</button>
            </div>
          </div>
        </div>
      `;
    },
    onInput(event, data) {
      if (event.action === 'cast_spell') {
        return { nextScreen: 'spell_confirm', data: { spellId: event.data } };
      } else if (event.action === 'end_turn') {
        return { nextScreen: 'battle', data: { battleEnded: true } };
      } else if (event.action === 'show_menu') {
        return { data: { showMenu: true } };
      } else if (event.action === 'cancel_surrender') {
        return { data: { showSurrenderConfirm: false } };
      } else if (event.action === 'confirm_surrender') {
        return { nextScreen: 'result', data: { result: 'defeat', reason: 'surrendered' } };
      } else if (event.action === 'reconnect') {
        return { data: { showReconnect: false } };
      }
    },
  },

  spell_confirm: {
    render(data) {
      const spellId = data.spellId || 'arcane_bolt';
      const spell = SPELLS.get(spellId);
      if (!spell) return '<div>Spell not found</div>';

      return `
        <div class="screen screen-spell-confirm">
          <div class="modal-overlay">
            <div class="modal-dialog spell-dialog">
              <h3>${spell.name}</h3>
              <div class="spell-details">
                <p class="spell-description">${spell.description}</p>
                <div class="spell-info">
                  <span class="spell-cost-label">마나 소비: ${spell.manaCost}</span>
                  <span class="spell-target-label">대상: ${spell.targetType === 'self' ? '자신' : '상대'}</span>
                </div>
              </div>
              <div class="modal-buttons">
                <button class="btn btn-secondary" data-action="cancel_spell">취소</button>
                <button class="btn btn-primary" data-action="confirm_cast" data-value="${spellId}">시전</button>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    onInput(event, data) {
      if (event.action === 'cancel_spell') {
        return { nextScreen: 'battle', data: { prevData: data } };
      } else if (event.action === 'confirm_cast') {
        return { nextScreen: 'battle', data: { castSpell: event.data } };
      }
    },
  },

  result: {
    render(data) {
      const result = data.result || 'draw';
      const reason = data.reason || '';
      const stats = data.stats || {};

      let resultTitle = '무승부';
      let resultClass = 'draw';
      if (result === 'victory') {
        resultTitle = '승리';
        resultClass = 'victory';
      } else if (result === 'defeat') {
        resultTitle = '패배';
        resultClass = 'defeat';
      }

      let reasonText = '';
      if (reason === 'surrendered') {
        reasonText = '<p class="result-reason">항복</p>';
      } else if (reason === 'timeout') {
        reasonText = '<p class="result-reason">연결 타임아웃</p>';
      }

      return `
        <div class="screen screen-result">
          <div class="result-container">
            <h1 class="result-title result-${resultClass}">${resultTitle}</h1>
            ${reasonText}
            <div class="result-stats">
              <p>턴 수: ${stats.turnCount || 0}</p>
              <p>최종 HP: ${stats.finalHp || 0}</p>
            </div>
            <button class="btn btn-primary btn-large" data-action="return_main">
              메인으로
            </button>
          </div>
        </div>
      `;
    },
    onInput(event, data) {
      if (event.action === 'return_main') {
        return { nextScreen: 'main' };
      }
    },
  },
};
