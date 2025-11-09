# Replay Speed and Position Fixes

## Issues Fixed

### 1. AI Moving Too Fast
**Problem**: AI was completing the maze in ~4.6 seconds instead of 18.4 seconds

**Root Cause**: 
- Used fixed rate: `pathIndex = Math.floor(gameTime * 10)` (10 steps/second)
- Optimal solution has 46 steps total
- This made AI complete in 46/10 = 4.6 seconds

**Solution**:
```typescript
// Calculate correct steps per second based on optimal solution
const totalSteps = OPTIMAL_SOLUTION.path.length  // 46 steps
const totalTime = OPTIMAL_SOLUTION.time          // 18.4 seconds
const stepsPerSecond = totalSteps / totalTime    // 2.5 steps/second
const pathIndex = Math.floor(gameTime * stepsPerSecond)
```

**Result**: AI now takes 18.4 seconds to complete, matching the optimal solution time

### 2. Player Not Spawning at Start Position
**Problem**: Player's Jerry appeared in the middle of the screen instead of at spawn dock

**Root Cause**:
- Player spawned at dock position (dockPosX, dockPosY)
- But first recorded movement might have different grid coordinates
- This caused a mismatch between spawn position and first movement target

**Solution**:
```typescript
// In replay mode, spawn at first recorded position
if (gameState.isReplayMode && gameState.replayMovements.length > 0) {
  const firstMove = gameState.replayMovements[0]
  const leftMazeOffsetX = gameState.offsetX
  spawnX = firstMove.gridX * TILE_SIZE + TILE_SIZE / 2 + leftMazeOffsetX
  spawnY = firstMove.gridY * TILE_SIZE + TILE_SIZE / 2 + gameState.offsetY
}
```

**Result**: Player now spawns at the exact position of the first recorded movement

### 3. AI Spawn Position
**Applied Same Fix**: AI now spawns at first path position from optimal solution

```typescript
if (OPTIMAL_SOLUTION.path && OPTIMAL_SOLUTION.path.length > 0) {
  const firstStep = OPTIMAL_SOLUTION.path[0]
  const rightMazeOffsetX = gameState.offsetX + (MAZE_WIDTH + 40)
  aiSpawnX = firstStep.x * TILE_SIZE + TILE_SIZE / 2 + rightMazeOffsetX
  aiSpawnY = firstStep.y * TILE_SIZE + TILE_SIZE / 2 + gameState.offsetY
}
```

### 4. Improved Movement Index Finding
**Added Better Logic**: Handle edge cases in movement index finding

```typescript
// Find current movement index
let currentIdx = -1
for (let i = 0; i < movements.length - 1; i++) {
  if (movements[i].time <= gameTime && movements[i + 1].time > gameTime) {
    currentIdx = i
    break
  }
}

// Handle past last movement
if (currentIdx === -1 && gameTime >= movements[movements.length - 1].time) {
  currentIdx = movements.length - 2
}

// Default to first movement
if (currentIdx === -1) {
  currentIdx = 0
}
```

## Technical Details

### Speed Calculation
- **Player**: Uses recorded movements with timestamps
- **AI**: Uses optimal solution path with calculated steps per second
- **Both**: Use same velocity calculation: `(delta / distance) * 150`

### Position Calculation
- **Grid to Pixel**: `gridX * TILE_SIZE + TILE_SIZE / 2 + offsetX`
- **Left Maze Offset**: `gameState.offsetX`
- **Right Maze Offset**: `gameState.offsetX + (MAZE_WIDTH + 40)`

### Spawn Positions
- **Player**: First recorded grid position in left maze
- **AI**: First optimal path position in right maze
- **Both**: Converted from grid to pixel coordinates with correct maze offset

## Result
- AI moves at correct speed (18.4 seconds total)
- Player spawns at correct position (first recorded movement)
- Both players move smoothly with same physics
- Replay is synchronized and accurate
