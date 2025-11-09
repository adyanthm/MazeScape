# Monster Recording and Replay Fixes

## New Features

### 1. Monster Movement Recording
- Records monster positions every 0.1 seconds (same as player)
- Stores grid coordinates and timestamps
- Recorded in both normal game and record mode
- Saved with player movements in recording data

### 2. Monster Replay
- Shows monsters in both mazes during replay
- Player's monster in left maze (chasing player's Jerry)
- Optimal's monster in right maze (chasing optimal Jerry)
- Both monsters use same physics and speed as normal game
- Allows comparison of dodging strategies

## Technical Implementation

### Recording Format
```typescript
{
  playerName: string,
  timestamp: number,
  time: number,
  score: number,
  coinsCollected: number,
  bonusPoints: number,
  movements: Array<{gridX, gridY, time}>,
  monsterMovements: Array<{gridX, gridY, time}>  // NEW
}
```

### Monster Recording Logic
```typescript
// Record monster movement every 0.1 seconds
if (monster) {
  if (shouldRecord) {
    const monsterGridX = Math.round((monster.x - offsetX - TILE_SIZE / 2) / TILE_SIZE)
    const monsterGridY = Math.round((monster.y - offsetY - TILE_SIZE / 2) / TILE_SIZE)
    
    monsterMovements.push({
      gridX: monsterGridX,
      gridY: monsterGridY,
      time: gameTime
    })
  }
}
```

### Monster Replay Logic
```typescript
// Spawn monsters at first recorded position
if (replayMode && monsterMovements.length > 0) {
  const firstMove = monsterMovements[0]
  const monsterX = firstMove.gridX * TILE_SIZE + TILE_SIZE / 2 + mazeOffsetX
  const monsterY = firstMove.gridY * TILE_SIZE + TILE_SIZE / 2 + offsetY
  
  monster = createMonster(monsterX, monsterY)
}

// Animate monster movement
for each frame:
  find current and next monster position based on time
  calculate velocity towards next position
  apply velocity (speed = 100, same as normal game)
```

## Glitch/Lag Fixes

### Problem
- Replay sometimes got stuck or glitched
- Players would stop moving or jitter
- Caused by edge cases in movement index finding

### Solution 1: Improved Index Finding
**Before**: Complex logic with multiple edge cases
```typescript
let currentIdx = -1
for (let i = 0; i < movements.length - 1; i++) {
  if (movements[i].time <= gameTime && movements[i + 1].time > gameTime) {
    currentIdx = i
    break
  }
}
// Multiple fallback checks...
```

**After**: Simple forward iteration
```typescript
let currentIdx = 0
for (let i = 0; i < movements.length - 1; i++) {
  if (movements[i].time <= gameTime) {
    currentIdx = i
  } else {
    break
  }
}
```

### Solution 2: Larger Distance Threshold
**Before**: `if (distance > 2)` - Too small, caused jittering
**After**: `if (distance > 5)` - Larger threshold prevents getting stuck

### Solution 3: Better Bounds Checking
```typescript
// Ensure we don't go past the last movement
if (currentIdx >= movements.length - 1) {
  currentIdx = movements.length - 2
}
```

### Solution 4: Fallback Handling
```typescript
if (current && next) {
  // Normal movement
} else {
  // Fallback: stop movement instead of crashing
  player.body.setVelocity(0, 0)
}
```

## Benefits

### Monster Recording
1. **Strategic Comparison**: See how different players dodge the monster
2. **Learning Tool**: Study optimal dodging patterns
3. **Realistic Replay**: Shows the actual challenge faced during gameplay
4. **Complete Picture**: Full context of the run, not just player movement

### Glitch Fixes
1. **Smooth Playback**: No more stuttering or freezing
2. **Reliable**: Handles edge cases gracefully
3. **Robust**: Fallback mechanisms prevent crashes
4. **Performance**: Simpler logic is faster

## Visual Indicators

### In Replay Mode
- **Left Maze**: 
  - Blue Jerry (player's run)
  - Tom chasing (player's monster)
- **Right Maze**:
  - Green Jerry (optimal run)
  - Tom chasing (optimal monster)

### Monster Appearance
- Semi-transparent (alpha: 0.7)
- Same size as normal game (45x45)
- Uses Tom sprite
- Depth: 2 (same as players)

## Data Storage

### localStorage Keys
- `optimal_recording`: Contains optimal run with monster movements
- Format: JSON string
- Size: ~10-20KB depending on run length

### Backward Compatibility
- Old recordings without monster movements still work
- Defaults to empty array if monsterMovements missing
- No monsters shown for old recordings

## User Experience

1. **Record Mode**: Monster movements recorded automatically
2. **Normal Game**: Monster movements recorded automatically
3. **Replay**: Both monsters shown side-by-side
4. **Comparison**: See how dodging strategies differ
5. **Smooth Playback**: No glitches or lag
