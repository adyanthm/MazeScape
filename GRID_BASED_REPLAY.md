# Grid-Based Replay System

## Major Changes

### 1. Movement Recording Changed to Grid Coordinates
**Before**: Recorded absolute pixel positions (x, y)
**After**: Record grid positions (gridX, gridY)

**Benefits**:
- Position-independent: Works regardless of screen size or maze offset
- Reliable: Grid positions are always consistent across different render contexts
- Simple: No need for complex offset calculations

### 2. Recording Implementation
```typescript
// Record grid position instead of pixel position
const gridX = Math.round((player.x - offsetX - TILE_SIZE / 2) / TILE_SIZE)
const gridY = Math.round((player.y - offsetY - TILE_SIZE / 2) / TILE_SIZE)

movements.push({ gridX, gridY, time: gameTime })
```

### 3. Replay Implementation
```typescript
// Convert grid position back to pixel position for each maze
const leftMazeOffsetX = offsetX
const targetX = gridX * TILE_SIZE + TILE_SIZE / 2 + leftMazeOffsetX
const targetY = gridY * TILE_SIZE + TILE_SIZE / 2 + offsetY

// For AI in right maze
const rightMazeOffsetX = offsetX + (MAZE_WIDTH + 40)
const targetX = gridX * TILE_SIZE + TILE_SIZE / 2 + rightMazeOffsetX
```

### 4. Both Players Spawn at Start Position
- Player spawns at start dock in left maze (mazeIndex 0)
- AI spawns at start dock in right maze (mazeIndex 1)
- Both use same grid coordinates, different pixel offsets

### 5. Same Speed and Physics
- Both use `speed = 150`
- Both use physics engine with `body.setVelocity()`
- Both calculate velocity the same way: `(delta / distance) * speed`
- Smooth interpolation between grid positions

### 6. Coin Collection Fixed
- Separate coin arrays: `playerGold` and `aiGold`
- Each maze has its own coins
- Increased detection radius from 20 to 25 pixels for better detection
- Both players collect coins independently
- Coins disappear when collected

### 7. Replay Restart Button
- Added "🔄 RESTART REPLAY" button in header
- Added "🔄 WATCH AGAIN" button in completion modal
- Restarts replay from beginning
- Destroys and recreates game scene

## Data Structure

### Movement Recording
```typescript
{
  gridX: number,  // Grid column (0-9 for 10x10 maze)
  gridY: number,  // Grid row (0-9 for 10x10 maze)
  time: number    // Timestamp in seconds
}
```

### Coin Tracking
```typescript
{
  sprite: Phaser.Image,
  posX: number,      // Pixel X position
  posY: number,      // Pixel Y position
  collected: boolean,
  gridX: number,     // Grid column
  gridY: number      // Grid row
}
```

## User Experience

1. **Play Game**: Movements recorded as grid positions
2. **Complete Game**: Movements stored with game result
3. **View Review**: See score comparison
4. **Watch Replay**: 
   - Two mazes side-by-side
   - Player on left (blue label)
   - AI on right (green label)
   - Both move at same speed
   - Both collect coins
5. **Restart Replay**: Click button to watch again
6. **Back to Menu**: Return to start screen

## Technical Benefits

- **Reliable**: No offset calculation errors
- **Scalable**: Works with any maze size
- **Maintainable**: Simple grid-to-pixel conversion
- **Accurate**: Movements replay exactly as recorded
- **Performant**: Minimal calculations per frame
