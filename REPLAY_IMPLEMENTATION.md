# Replay System Implementation

## Overview
Implemented a proper side-by-side replay system that shows the player's run alongside the AI's optimal solution.

## Features Implemented

### 1. Replay Mode State Management
- Added `replayMode` state to track when the game is in replay mode
- Added `playerMovements` state to store the player's recorded movements
- Added `startReplay()` function to initiate replay with recorded movements

### 2. Movement Recording
- Player movements are recorded every 0.1 seconds during gameplay
- Movements include x, y position and timestamp
- Movements are passed through the `gameComplete` event

### 3. Side-by-Side Display
- In replay mode, two mazes are rendered side-by-side with a 40px gap
- Left maze shows the player's recorded run (blue label: "👤 YOUR RUN")
- Right maze shows the AI's optimal solution (green label: "🤖 AI OPTIMAL")
- Both mazes have identical walls, coins, and docks

### 4. Replay Animation
- Player replay: Animates through recorded movements based on timestamps
- AI replay: Animates through pre-computed optimal path from `OPTIMAL_SOLUTION.path`
- Both animations run simultaneously and synchronously
- Replay ends when both runs complete (max time + 1 second buffer)

### 5. Replay UI Components
- **ReplayUI**: Shows during replay with header indicating replay mode
- **Replay Complete Modal**: Appears when replay finishes with "BACK TO MENU" button
- **GameReview Modal**: Updated to properly trigger replay mode

### 6. Event System
- `gameComplete` event: Now includes movements data
- `startReplay` event: Triggers replay mode with movements
- `replayComplete` event: Signals when replay animation finishes

## Technical Details

### Game State Extensions
```typescript
gameState.isReplayMode: boolean
gameState.replayMovements: {x, y, time}[]
gameState.aiPlayer: Phaser.Image
```

### Replay Animation Logic
- Player position interpolated from recorded movements based on current game time
- AI position calculated from optimal path array (10 steps per second)
- No physics or collision detection in replay mode (pure animation)

### Visual Differences
- Replay characters are semi-transparent (alpha: 0.7)
- AI character has green tint to distinguish from player
- No monsters spawn in replay mode
- Coins are displayed but not collected

## User Flow
1. Player completes game
2. Clicks "🤖 VIEW AI REVIEW" button
3. Reviews score comparison in GameReview modal
4. Clicks "👻 WATCH SIDE-BY-SIDE REPLAY" button
5. Watches both runs simultaneously
6. Replay completes and shows completion modal
7. Returns to main menu

## Files Modified
- `app/page.tsx`: Main game logic with replay mode implementation
- `app/components/GameReview.tsx`: Updated to trigger replay properly

## Performance
- Replay mode has no physics calculations (pure animation)
- Efficient rendering with pre-computed paths
- Smooth 60fps animation for both players
