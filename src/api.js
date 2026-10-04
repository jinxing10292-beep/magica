// Game API Layer - Supabase integration
import { supabase } from './supabaseClient.js';

// ============================================================
// Players API
// ============================================================

export async function getOrCreatePlayer(nickname) {
  try {
    // Check if player exists
    const { data: existing, error: queryError } = await supabase
      .from('players')
      .select('id, nickname')
      .eq('nickname', nickname)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected for new players)
      throw queryError;
    }

    if (existing) {
      return { success: true, data: existing };
    }

    // Create new player
    const { data: newPlayer, error: insertError } = await supabase
      .from('players')
      .insert([{ nickname }])
      .select('id, nickname')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        // Unique constraint violation - nickname already taken
        return { success: false, error: 'nickname_taken' };
      }
      throw insertError;
    }

    return { success: true, data: newPlayer };
  } catch (error) {
    console.error('Error in getOrCreatePlayer:', error);
    return { success: false, error: 'database_error', details: error.message };
  }
}

export async function listPlayers() {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('id, nickname')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error in listPlayers:', error);
    return { success: false, error: 'database_error' };
  }
}

// ============================================================
// Matches API
// ============================================================

export async function createMatch(player1Id, player2Id) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .insert([{
        player1_id: player1Id,
        player2_id: player2Id,
        turn_count: 0
      }])
      .select('id')
      .single();

    if (error) throw error;
    return { success: true, data: data.id };
  } catch (error) {
    console.error('Error in createMatch:', error);
    return { success: false, error: 'database_error' };
  }
}

export async function updateMatchResult(matchId, winnerId, isDraw, turnCount) {
  try {
    const { error } = await supabase
      .from('matches')
      .update({
        winner_id: isDraw ? null : winnerId,
        is_draw: isDraw,
        turn_count: turnCount,
        ended_at: new Date().toISOString()
      })
      .eq('id', matchId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error in updateMatchResult:', error);
    return { success: false, error: 'database_error' };
  }
}

// ============================================================
// Battle Logs API
// ============================================================

export async function saveBattleLog(matchId, turnNumber, actorId, action) {
  try {
    const logEntry = {
      match_id: matchId,
      turn_number: turnNumber,
      actor_id: actorId,
      action_type: action.type,
      spell_name: action.spellName || null,
      target_id: action.targetId || null,
      hp_before: action.hpBefore,
      hp_after: action.hpAfter,
      mana_before: action.manaBefore,
      mana_after: action.manaAfter,
      damage_dealt: action.damageDelt || 0,
      healing_amount: action.healingAmount || 0,
      status_effects: action.statusEffects ? action.statusEffects.join(',') : null,
      description: action.description
    };

    const { error } = await supabase
      .from('battle_logs')
      .insert([logEntry]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error in saveBattleLog:', error);
    return { success: false, error: 'database_error' };
  }
}

export async function getBattleHistory(matchId) {
  try {
    const { data, error } = await supabase
      .from('battle_logs')
      .select('*')
      .eq('match_id', matchId)
      .order('turn_number', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error in getBattleHistory:', error);
    return { success: false, error: 'database_error' };
  }
}

// ============================================================
// Player Stats API
// ============================================================

export async function getPlayerStats(nickname) {
  try {
    const { data, error } = await supabase
      .from('match_stats')
      .select('*')
      .eq('nickname', nickname)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return { 
      success: true, 
      data: data || { nickname, total_matches: 0, wins: 0, losses: 0, draws: 0 }
    };
  } catch (error) {
    console.error('Error in getPlayerStats:', error);
    return { success: false, error: 'database_error' };
  }
}

// ============================================================
// Batch Operations
// ============================================================

export async function saveBattleLogs(matchId, logs) {
  try {
    const entries = logs.map(log => ({
      match_id: matchId,
      turn_number: log.turnNumber,
      actor_id: log.actorId,
      action_type: log.type,
      spell_name: log.spellName || null,
      target_id: log.targetId || null,
      hp_before: log.hpBefore,
      hp_after: log.hpAfter,
      mana_before: log.manaBefore,
      mana_after: log.manaAfter,
      damage_dealt: log.damageDelt || 0,
      healing_amount: log.healingAmount || 0,
      status_effects: log.statusEffects ? log.statusEffects.join(',') : null,
      description: log.description
    }));

    const { error } = await supabase
      .from('battle_logs')
      .insert(entries);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error in saveBattleLogs:', error);
    return { success: false, error: 'database_error' };
  }
}
