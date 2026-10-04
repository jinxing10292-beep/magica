# Supabase Integration Guide

Magica는 Supabase를 사용해서 플레이어 닉네임과 PvP 대전 로그를 저장합니다.

## 프로젝트 정보

- **URL**: https://ermfvdnfhnosyjyvlxjq.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVybWZ2ZG5maG5vc3lqeXZseGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNzkxNzYsImV4cCI6MjEwNjY1NTE3Nn0.lu_87GX49fkp39zMIAPpMVc3AyUOn7UqSHaUBRXrNes

## 데이터베이스 스키마

### 1. Players 테이블
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY,
  nickname VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

- **id**: UUID 기본키
- **nickname**: 플레이어 닉네임 (고유값, 50자 이하)
- **created_at**: 계정 생성 시간
- **updated_at**: 마지막 업데이트 시간

### 2. Matches 테이블
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  player1_id UUID REFERENCES players(id),
  player2_id UUID REFERENCES players(id),
  winner_id UUID REFERENCES players(id),
  is_draw BOOLEAN,
  turn_count INT,
  created_at TIMESTAMP,
  ended_at TIMESTAMP
);
```

- **id**: UUID 기본키
- **player1_id**: 첫 번째 플레이어
- **player2_id**: 두 번째 플레이어
- **winner_id**: 승리자 (무승부면 NULL)
- **is_draw**: 무승부 여부
- **turn_count**: 전체 턴 수
- **created_at**: 대전 시작 시간
- **ended_at**: 대전 종료 시간

### 3. Battle Logs 테이블
```sql
CREATE TABLE battle_logs (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  turn_number INT,
  actor_id UUID REFERENCES players(id),
  action_type VARCHAR(50),
  spell_name VARCHAR(50),
  target_id UUID REFERENCES players(id),
  hp_before INT,
  hp_after INT,
  mana_before INT,
  mana_after INT,
  damage_dealt INT,
  healing_amount INT,
  status_effects VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP
);
```

- **id**: UUID 기본키
- **match_id**: 대전 ID
- **turn_number**: 턴 번호
- **actor_id**: 행동 플레이어
- **action_type**: 행동 종류 (spell, pass, surrender, etc.)
- **spell_name**: 사용한 마법 이름
- **target_id**: 마법 대상
- **hp_before/after**: 시전 전후 HP
- **mana_before/after**: 시전 전후 마나
- **damage_dealt**: 입힌 피해량
- **healing_amount**: 회복량
- **status_effects**: 적용된 상태 효과
- **description**: 행동 설명
- **created_at**: 로그 생성 시간

## 설정 방법

### Step 1: SQL 스키마 실행

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택 (magica)
3. SQL Editor → New Query
4. `supabase/init.sql` 파일의 내용을 복사해서 붙여넣기
5. Run 클릭

### Step 2: Supabase 설정 확인

- Tables 섹션에서 `players`, `matches`, `battle_logs` 테이블 생성 확인
- RLS (Row Level Security) policies 활성화 확인
- `match_stats` view 생성 확인

## 클라이언트 통합

### Supabase 클라이언트 초기화

```javascript
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

const supabaseUrl = 'https://ermfvdnfhnosyjyvlxjq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 플레이어 생성/조회

```javascript
// 플레이어 생성
const { data, error } = await supabase
  .from('players')
  .insert([{ nickname: '플레이어1' }])
  .select();

// 플레이어 조회
const { data, error } = await supabase
  .from('players')
  .select('*')
  .eq('nickname', '플레이어1');
```

### 대전 기록 저장

```javascript
// 대전 생성
const { data: match } = await supabase
  .from('matches')
  .insert([{
    player1_id: player1Id,
    player2_id: player2Id,
    turn_count: 15
  }])
  .select();

// 대전 로그 추가
const { data } = await supabase
  .from('battle_logs')
  .insert([{
    match_id: matchId,
    turn_number: 1,
    actor_id: player1Id,
    action_type: 'spell',
    spell_name: '아케인 볼트',
    target_id: player2Id,
    hp_before: 100,
    hp_after: 80,
    damage_dealt: 20,
    description: '아케인 볼트로 20 피해'
  }])
  .select();
```

### 대전 종료 처리

```javascript
// 대전 종료, 승자 기록
const { data } = await supabase
  .from('matches')
  .update({
    winner_id: winnerId,
    is_draw: false,
    ended_at: new Date().toISOString()
  })
  .eq('id', matchId)
  .select();
```

## 쿼리 예제

### 플레이어 통계 조회

```javascript
const { data } = await supabase
  .from('match_stats')
  .select('*')
  .eq('nickname', '플레이어1');
// 반환: { wins: 5, losses: 2, draws: 1, total_matches: 8 }
```

### 최근 대전 10개 조회

```javascript
const { data } = await supabase
  .from('matches')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);
```

### 특정 대전의 모든 로그 조회

```javascript
const { data } = await supabase
  .from('battle_logs')
  .select('*')
  .eq('match_id', matchId)
  .order('turn_number', { ascending: true });
```

## RLS 정책

모든 테이블에 RLS가 활성화되어 있습니다. 현재 정책:

- **Players**: 모두 읽기/쓰기 가능
- **Matches**: 모두 읽기/쓰기 가능
- **Battle Logs**: 모두 읽기/쓰기 가능

보안 강화가 필요하면 RLS 정책을 수정하세요.

## 다음 단계

1. `src/supabaseClient.js` 작성 - Supabase 클라이언트 초기화
2. `src/api.js` 작성 - 게임 로직과 Supabase 연동
3. 플레이어 인증 시스템 구현
4. 실시간 매칭 큐 구현
5. 라이브 대전 상태 구독 (Supabase Realtime)

