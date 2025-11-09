# Replay Mode Fixes

## Issues Fixed

### 1. Positioning Issues
**Problem**: Player's Jerry was positioned incorrectly, appearing in the middle and passing through both mazes.

**Solution**: 
- Added offset adjustment calculation to account for different maze positions between recording and replay
- Original recording has maze centered at `(gameWidth - MAZE_WIDTH) / 2`
- Replay mode has left maze at `(gameWidth - totalWidth) / 2` where totalWidth includes both mazes + gap
- Applied offset difference to all recorded player movements

### 2. AI Speed Issues
**Problem**: AI was moving too fast, teleporting between positions.

**Solution**:
- Changed from direct position setting to physics-based movement
- Added `this.physics.add.existing(gameState.aiPlayer, false)` to enable physics
- Calculate velocity towards next position using same speed (150) as player
- Smooth interpolation between path points

### 3. Physics Consistency
**Problem**: Player and AI had different movement systems.

**Solution**:
- Both now use Phaser physics with `body.setVelocity()`
- Same speed constant (150) for both
- Both calculate velocity as: `(targetDelta / distance) * speed`
- Disabled world bounds collision for both in replay mode to allow free movement

### 4. Coin Collection
**Problem**: AI was not collecting coins, just running over them.

**Solution**:
- Separated coin tracking: `playerGold` and `aiGold` arrays
- Added collision detection for both players in update loop
- Check distance < 20 pixels for collection
- Hide sprite and increment counter when collected
- Each maze has its own set of coins

### 5. Player on Wrong Maze
**Problem**: Both players appeared on the same maze.

**Solution**:
- Fixed maze index logic in dock creation loop
- Player spawns at `mazeIndex === 0` (left maze)
- AI spawns at `mazeIndex === 1` (right maze)
- Each uses their respective maze offset for positioning

## Technical Implementation

### Offset Adjustment
```typescript
// Calculate offset difference
const originalOffsetX = (gameWidth - MAZE_WIDTH) / 2  // Single maze center
const replayOffsetX = (gameWidth - totalWidth) / 2     // Left maze in dual view
const offsetDiff = replayOffsetX - originalOffsetX

// Apply to recorded positions
const adjustedX = recordedX + offsetDiff
```

### Physics-Based Movement
```typescript
// Calculate velocity towards target
const dx = targetX - currentX
const dy = targetY - currentY
const distance = Math.sqrt(dx * dx + dy * dy)

if (distance > 2) {
  const velX = (dx / distance) * speed
  const velY = (dy / distance) * speed
  player.body.setVelocity(velX, velY)
}
```

### Coin Collection
```typescript
// Check distance for collection
const dx = player.x - coin.posX
const dy = player.y - coin.posY
const distance = Math.sqrt(dx * dx + dy * dy)

if (distance < 20) {
  coin.collected = true
  coin.sprite.setVisible(false)
}
```

## Result
- Both players move at same speed with same physics
- Player stays in left maze, AI stays in right maze
- Both collect coins properly
- Smooth, synchronized replay animation
