# Record Mode Implementation

## Overview
Removed AI algorithm and replaced with user-recorded optimal run system. Users can now record their own optimal gameplay and compare against it.

## New Features

### 1. Record Mode Page (`/record`)
- Dedicated page for recording optimal runs
- Same game layout and mechanics as normal mode
- Records all movements with timestamps
- Saves to localStorage as `optimal_recording`

### 2. Recording Process
1. Navigate to `/record`
2. Enter player name
3. Play through the maze (avoid monster!)
4. Complete the maze to save recording
5. Recording includes:
   - Player name
   - Timestamp
   - Time taken
   - Score
   - Coins collected
   - All movements (grid coordinates + timestamps)

### 3. Replay System Updated
- Uses recorded optimal run instead of AI algorithm
- Shows "YOUR RUN" vs "OPTIMAL RUN" side-by-side
- Both use same movement recording format (grid coordinates)
- Both spawn at their respective start positions
- Both move at same speed with same physics

## Technical Changes

### Removed
- `OPTIMAL_SOLUTION` constant from `optimalSolution.ts`
- AI pathfinding algorithm
- Pre-computed optimal path
- Brute force script

### Added
- `/record` page for recording optimal runs
- `optimalMovements` state for storing recorded optimal run
- localStorage integration for saving/loading recordings
- Warning modal if no optimal run exists

## Data Structure

### Recording Format
```typescript
{
  playerName: string,
  timestamp: number,
  time: number,
  score: number,
  coinsCollected: number,
  bonusPoints: number,
  movements: Array<{
    gridX: number,
    gridY: number,
    time: number
  }>
}
```

### Storage
- Key: `optimal_recording`
- Location: localStorage
- Format: JSON string
- Replaces previous recording when new one is saved

## Positioning Fixes

### Player Spawn (Left Maze)
```typescript
// Spawn at first recorded position
if (replayMode && replayMovements.length > 0) {
  const firstMove = replayMovements[0]
  const leftMazeOffsetX = offsetX
  spawnX = firstMove.gridX * TILE_SIZE + TILE_SIZE / 2 + leftMazeOffsetX
  spawnY = firstMove.gridY * TILE_SIZE + TILE_SIZE / 2 + offsetY
}
```

### Optimal Run Spawn (Right Maze)
```typescript
// Spawn at first recorded position
if (replayMode && optimalMovements.length > 0) {
  const firstMove = optimalMovements[0]
  const rightMazeOffsetX = offsetX + (MAZE_WIDTH + 40)
  spawnX = firstMove.gridX * TILE_SIZE + TILE_SIZE / 2 + rightMazeOffsetX
  spawnY = firstMove.gridY * TILE_SIZE + TILE_SIZE / 2 + offsetY
}
```

### Movement Replay
Both player and optimal run use identical logic:
1. Find current and next movement based on game time
2. Convert grid position to pixel position with correct maze offset
3. Calculate velocity towards next position
4. Apply velocity using physics engine

## User Flow

### Recording Flow
1. Click "Record Mode" or navigate to `/record`
2. See warning about recording optimal run
3. Enter name and start recording
4. Play through maze (must complete without being caught)
5. Recording saved automatically on completion
6. Redirected to home page

### Replay Flow
1. Complete a normal game
2. Click "VIEW REVIEW"
3. If no optimal recording exists:
   - See warning modal
   - Option to go to record mode
4. If optimal recording exists:
   - See score comparison
   - Click "WATCH SIDE-BY-SIDE REPLAY"
   - Watch both runs simultaneously
   - Click "RESTART REPLAY" to watch again

## Benefits

1. **Personalized**: Compare against your own best run
2. **Realistic**: Optimal run is actually achievable (you did it!)
3. **Flexible**: Can re-record optimal run anytime
4. **Simple**: No complex AI algorithms needed
5. **Accurate**: Both runs use same recording/replay system

## UI Updates

- Changed "AI OPTIMAL" to "OPTIMAL RUN"
- Changed "🤖" to "🏆" for optimal run
- Added record mode button/link
- Added warning modal for missing recording
- Updated all labels and descriptions
