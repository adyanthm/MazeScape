"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef, useState } from "react"

// Dynamically import Phaser only on client-side
let Phaser: any = null
if (typeof window !== "undefined") {
  Phaser = require("phaser")
}

// Import GameReview component dynamically
const GameReview = typeof window !== "undefined" ? require('./components/GameReview').default : null

// Optimal solution will be loaded from localStorage (recorded run)

const MAZE_MAP = [
  "##########",
  "#D...G#.G#",
  "####.###.#",
  "#.G#.....#",
  "#.####..G#",
  "#......###",
  "#.##..G..#",
  "#G#...####",
  "#..G#G..D#",
  "##########",
]

// PathFinder removed - using pre-computed optimal solution for instant performance

const GameComponent = () => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [playerName, setPlayerName] = useState("")
  const [showReview, setShowReview] = useState(false)
  const [replayMode, setReplayMode] = useState(false)
  const [playerMovements, setPlayerMovements] = useState<{gridX: number, gridY: number, pixelX?: number, pixelY?: number, time: number}[]>([])
  const [optimalMovements, setOptimalMovements] = useState<{gridX: number, gridY: number, pixelX?: number, pixelY?: number, time: number}[]>([])
  const [gameResult, setGameResult] = useState<any>(null)

  const startGame = (name: string) => {
    if (name.trim()) {
      setPlayerName(name)
      setGameStarted(true)
      setReplayMode(false)
      setShowReview(false)
      setPlayerMovements([])
      setOptimalMovements([])
      setGameResult(null)
    }
  }

  const resetGame = () => {
    // Destroy existing game
    if (gameRef.current) {
      gameRef.current.destroy(true)
      gameRef.current = null
    }
    
    // Reset all states
    setGameStarted(false)
    setPlayerName("")
    setReplayMode(false)
    setShowReview(false)
    setPlayerMovements([])
    setOptimalMovements([])
    setGameResult(null)
  }

  const startReplay = (
    playerMoves: {gridX: number, gridY: number, pixelX?: number, pixelY?: number, time: number}[], 
    optimalMoves: {gridX: number, gridY: number, pixelX?: number, pixelY?: number, time: number}[]
  ) => {
    // Destroy existing game FIRST - this must happen before state updates
    if (gameRef.current) {
      gameRef.current.destroy(true)
      gameRef.current = null
    }
    
    // Clear the game container
    const container = document.getElementById('game-container')
    if (container) {
      container.innerHTML = ''
    }
    
    // Now update states - this will trigger useEffect to create new game
    setPlayerMovements(playerMoves)
    setOptimalMovements(optimalMoves)
    setReplayMode(true)
  }

  const [currentMaze, setCurrentMaze] = useState<string[]>(MAZE_MAP)
  const [mazeDimensions, setMazeDimensions] = useState({ width: 10, height: 10 })

  useEffect(() => {
    const customMaze = localStorage.getItem("custom_maze")
    if (customMaze) {
      try {
        setCurrentMaze(JSON.parse(customMaze))
      } catch {
        setCurrentMaze(MAZE_MAP)
      }
    }

    const customConfig = localStorage.getItem("custom_maze_config")
    if (customConfig) {
      try {
        setMazeDimensions(JSON.parse(customConfig))
      } catch {
        setMazeDimensions({ width: 10, height: 10 })
      }
    }

    // Listen for replay start event
    const handleStartReplay = (e: any) => {
      startReplay(
        e.detail.playerMovements, 
        e.detail.optimalMovements
      )
    }

    // Listen for replay restart event
    const handleRestartReplay = () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
      
      const container = document.getElementById('game-container')
      if (container) {
        container.innerHTML = ''
      }
      
      // Force re-render by toggling state
      setGameStarted(false)
      setTimeout(() => {
        setGameStarted(true)
      }, 10)
    }

    window.addEventListener("startReplay", handleStartReplay)
    window.addEventListener("restartReplay", handleRestartReplay)

    return () => {
      window.removeEventListener("startReplay", handleStartReplay)
      window.removeEventListener("restartReplay", handleRestartReplay)
    }
  }, [])

  useEffect(() => {
    if (!gameStarted || typeof window === "undefined") return
    
    // If game already exists, don't recreate (it will be destroyed manually when needed)
    if (gameRef.current) return
    
    // Ensure Phaser is loaded
    if (!Phaser) {
      Phaser = require("phaser")
    }

    const gameWidth = typeof window !== "undefined" ? window.innerWidth : 1024
    const gameHeight = typeof window !== "undefined" ? window.innerHeight : 768
    
    // Calculate optimal tile size to fit the maze on screen
    const availableWidth = gameWidth - 100 // Leave some padding
    const availableHeight = gameHeight - 160 // Leave space for UI
    
    const tileByWidth = Math.floor(availableWidth / mazeDimensions.width)
    const tileByHeight = Math.floor(availableHeight / mazeDimensions.height)
    
    const TILE_SIZE = Math.max(30, Math.min(tileByWidth, tileByHeight, 80)) // Min 30px, max 80px
    const MAZE_WIDTH = mazeDimensions.width * TILE_SIZE
    const MAZE_HEIGHT = mazeDimensions.height * TILE_SIZE
    const OFFSET_Y = 80

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: "game-container",
      width: gameWidth,
      height: gameHeight,
      transparent: true,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: {
        init: initScene,
        preload: preloadScene,
        create: createScene,
        update: updateScene,
      },
    }

    const gameState = {
      cursors: null as any,
      player: null as any,
      gold: [] as any[],
      startDock: null as any,
      finishDock: null as any,
      walls: null as any,
      goldCollected: 0,
      gameTime: 0,
      gameOver: false,
      playerName: playerName,
      score: 0,
      bonusPoints: 0,
      monster: null as any,
      monsterSpawned: false,
      startDockPos: { x: 0, y: 0 },
      finishDockPos: { x: 0, y: 0 },
      mazeGrid: [] as number[][],
      movements: [] as {gridX: number, gridY: number, pixelX: number, pixelY: number, time: number}[],
      monsterMovements: [] as {gridX: number, gridY: number, time: number}[],
      coinPositions: [] as {x: number, y: number}[],
      startGridPos: { x: 0, y: 0 },
      finishGridPos: { x: 0, y: 0 },
      TILE_SIZE: TILE_SIZE,
      offsetX: 0,
      offsetY: 0,
      isReplayMode: replayMode,
      replayMovements: playerMovements,
      optimalMovements: optimalMovements,
      aiPlayer: null as any,
      aiGold: [] as any[],
      aiGoldCollected: 0,
      playerGold: [] as any[],
      playerGoldCollected: 0,
    }

    function initScene(this: Phaser.Scene) {
      const offsetX = (gameWidth - MAZE_WIDTH) / 2
      const offsetY = (gameHeight - MAZE_HEIGHT) / 2 + OFFSET_Y / 2
      this.physics.world.setBounds(offsetX, offsetY, MAZE_WIDTH, MAZE_HEIGHT)
    }

    function preloadScene(this: Phaser.Scene) {
      // Load textures
      this.load.image('brick', '/brick.avif')
      this.load.image('coin', '/coin.png')
      this.load.image('jerry', '/jerry.png')
      this.load.image('tom', '/tom.png')
    }

    function createScene(this: Phaser.Scene) {
      const graphics = this.add.graphics()
      graphics.setDepth(0)

      gameState.walls = this.physics.add.staticGroup()

      // In replay mode, create two side-by-side mazes
      const mazeCount = gameState.isReplayMode ? 2 : 1
      const totalWidth = MAZE_WIDTH * mazeCount + (mazeCount > 1 ? 40 : 0) // 40px gap between mazes
      const offsetX = (gameWidth - totalWidth) / 2
      const offsetY = (gameHeight - MAZE_HEIGHT) / 2 + OFFSET_Y / 2
      
      // Store offsets in gameState
      gameState.offsetX = offsetX
      gameState.offsetY = offsetY
      
      // In replay mode, calculate offset adjustment for recorded movements
      if (gameState.isReplayMode) {
        // Original recording was with single centered maze
        const originalOffsetX = (gameWidth - MAZE_WIDTH) / 2
        gameState.originalOffsetX = originalOffsetX
        gameState.replayOffsetX = offsetX // Left maze offset in replay
      }

      // Draw maze(s)
      for (let mazeIndex = 0; mazeIndex < mazeCount; mazeIndex++) {
        const mazeOffsetX = offsetX + mazeIndex * (MAZE_WIDTH + 40)
        
        // Draw cream background with black border
        graphics.fillStyle(0xf5deb3, 1)
        graphics.fillRect(mazeOffsetX - 6, offsetY - 6, MAZE_WIDTH + 12, MAZE_HEIGHT + 12)
        graphics.lineStyle(3, 0x000000, 1)
        graphics.strokeRect(mazeOffsetX - 6, offsetY - 6, MAZE_WIDTH + 12, MAZE_HEIGHT + 12)
      }

      // Create maze grid for pathfinding (0 = walkable, 1 = wall)
      gameState.mazeGrid = currentMaze.map(row => 
        row.split('').map(tile => tile === '#' ? 1 : 0)
      )

      // Draw all tiles for each maze
      for (let mazeIndex = 0; mazeIndex < mazeCount; mazeIndex++) {
        const mazeOffsetX = offsetX + mazeIndex * (MAZE_WIDTH + 40)
        
        for (let y = 0; y < currentMaze.length; y++) {
          for (let x = 0; x < currentMaze[y].length; x++) {
            const tile = currentMaze[y][x]
            const posX = x * TILE_SIZE + mazeOffsetX
            const posY = y * TILE_SIZE + offsetY

            if (tile !== "#") {
              // Draw cream floor tiles
              graphics.fillStyle(0xf5deb3, 1)
              graphics.fillRect(posX, posY, TILE_SIZE, TILE_SIZE)
            }
          }
        }
      }

      // Find all docks and determine which is top/bottom
      const docks: Array<{x: number, y: number, posX: number, posY: number}> = []
      
      // Create walls, coins, and docks for each maze
      for (let mazeIndex = 0; mazeIndex < mazeCount; mazeIndex++) {
        const mazeOffsetX = offsetX + mazeIndex * (MAZE_WIDTH + 40)
        
        for (let y = 0; y < currentMaze.length; y++) {
          for (let x = 0; x < currentMaze[y].length; x++) {
            const tile = currentMaze[y][x]
            const posX = x * TILE_SIZE + TILE_SIZE / 2 + mazeOffsetX
            const posY = y * TILE_SIZE + TILE_SIZE / 2 + offsetY

            if (tile === "#") {
              // Create brick textured wall
              const wall = this.add.image(posX, posY, 'brick')
              wall.setDisplaySize(TILE_SIZE, TILE_SIZE)
              wall.setDepth(0)
              this.physics.add.existing(wall, true)
              gameState.walls.add(wall)
            } else if (tile === "G") {
              // Create coin with texture (cheese)
              const gold = this.add.image(posX, posY, 'coin')
              gold.setDisplaySize(30, 30)
              gold.setDepth(1)
              
              if (gameState.isReplayMode) {
                // In replay mode, track coins separately for each maze
                if (mazeIndex === 0) {
                  gameState.playerGold.push({ sprite: gold, posX, posY, collected: false, gridX: x, gridY: y })
                } else {
                  gameState.aiGold.push({ sprite: gold, posX, posY, collected: false, gridX: x, gridY: y })
                }
              } else {
                // Normal mode
                gameState.gold.push({ sprite: gold, posX, posY, collected: false, mazeIndex })
                gameState.coinPositions.push({ x, y })
              }
            } else if (tile === "D" && mazeIndex === 0) {
              // Only store dock positions from first maze
              docks.push({ x, y, posX, posY })
            }
          }
        }
      }

      // Sort docks by Y position (top to bottom)
      docks.sort((a, b) => a.y - b.y)

      // Create docks for each maze
      for (let mazeIndex = 0; mazeIndex < mazeCount; mazeIndex++) {
        const mazeOffsetX = offsetX + mazeIndex * (MAZE_WIDTH + 40)
        
        docks.forEach((dock, index) => {
          const dockPosX = dock.x * TILE_SIZE + TILE_SIZE / 2 + mazeOffsetX
          const dockPosY = dock.y * TILE_SIZE + TILE_SIZE / 2 + offsetY
          
          if (index === 0) {
            // Top dock is finish dock (purple)
            const finishDock = this.add.rectangle(dockPosX, dockPosY, TILE_SIZE - 8, TILE_SIZE - 8, 0x8b5cf6)
            finishDock.setStrokeStyle(2, 0x7c3aed)
            finishDock.setAlpha(0.8)
            finishDock.setDepth(1)
            
            if (mazeIndex === 0) {
              gameState.finishDock = finishDock
              gameState.finishDockPos = { x: dockPosX, y: dockPosY }
              gameState.finishGridPos = { x: dock.x, y: dock.y }
            }
          } else if (index === docks.length - 1) {
            // Bottom dock is start dock (light purple)
            const startDock = this.add.rectangle(dockPosX, dockPosY, TILE_SIZE - 8, TILE_SIZE - 8, 0xc4b5fd)
            startDock.setStrokeStyle(2, 0xa78bfa)
            startDock.setAlpha(0.8)
            startDock.setDepth(1)
            
            if (mazeIndex === 0) {
              gameState.startDock = startDock
              gameState.startDockPos = { x: dockPosX, y: dockPosY }
              gameState.startGridPos = { x: dock.x, y: dock.y }
              
              // Spawn player at start dock - Jerry
              let spawnX = dockPosX
              let spawnY = dockPosY
              
              // In replay mode, use first recorded position if available
              if (gameState.isReplayMode && gameState.replayMovements.length > 0) {
                const firstMove = gameState.replayMovements[0]
                const leftMazeOffsetX = gameState.offsetX
                
                // Use pixel positions if available, otherwise calculate from grid
                if (firstMove.pixelX !== undefined && firstMove.pixelY !== undefined) {
                  spawnX = firstMove.pixelX + leftMazeOffsetX
                  spawnY = firstMove.pixelY + gameState.offsetY
                } else {
                  spawnX = firstMove.gridX * TILE_SIZE + TILE_SIZE / 2 + leftMazeOffsetX
                  spawnY = firstMove.gridY * TILE_SIZE + TILE_SIZE / 2 + gameState.offsetY
                }
              }
              
              gameState.player = this.add.image(spawnX, spawnY, 'jerry')
              gameState.player.setDisplaySize(40, 40)
              gameState.player.setDepth(2)
              
              if (gameState.isReplayMode) {
                // In replay mode, use physics for smooth movement
                gameState.player.setAlpha(0.7)
                this.physics.add.existing(gameState.player, false)
                gameState.player.body.setCollideWorldBounds(false) // Allow free movement in replay
              } else {
                // Normal game mode
                this.physics.add.existing(gameState.player, false)
                gameState.player.body.setCollideWorldBounds(true)
                gameState.player.body.setBounce(0)
                
                // Record initial position (grid coordinates + pixel positions)
                const relativePixelX = gameState.player.x - gameState.offsetX
                const relativePixelY = gameState.player.y - gameState.offsetY
                gameState.movements.push({ 
                  gridX: dock.x, 
                  gridY: dock.y, 
                  pixelX: relativePixelX,
                  pixelY: relativePixelY,
                  time: 0 
                })
              }
            }
          }
        })
      }

      // Spawn optimal player in second maze (outside dock loop)
      if (gameState.isReplayMode && gameState.optimalMovements && gameState.optimalMovements.length > 0) {
        const firstMove = gameState.optimalMovements[0]
        const rightMazeOffsetX = offsetX + (MAZE_WIDTH + 40)
        
        // Use pixel positions if available, otherwise calculate from grid
        let optimalSpawnX, optimalSpawnY
        if (firstMove.pixelX !== undefined && firstMove.pixelY !== undefined) {
          // Use recorded pixel positions
          optimalSpawnX = firstMove.pixelX + rightMazeOffsetX
          optimalSpawnY = firstMove.pixelY + offsetY
        } else {
          // Calculate from grid coordinates
          optimalSpawnX = firstMove.gridX * TILE_SIZE + TILE_SIZE / 2 + rightMazeOffsetX
          optimalSpawnY = firstMove.gridY * TILE_SIZE + TILE_SIZE / 2 + offsetY
        }
        
        gameState.aiPlayer = this.add.image(optimalSpawnX, optimalSpawnY, 'jerry')
        gameState.aiPlayer.setDisplaySize(40, 40)
        gameState.aiPlayer.setAlpha(0.7)
        gameState.aiPlayer.setTint(0x00ff00) // Green tint for optimal run
        gameState.aiPlayer.setDepth(2)
        
        // Add physics to optimal player
        this.physics.add.existing(gameState.aiPlayer, false)
        gameState.aiPlayer.body.setCollideWorldBounds(false) // Allow free movement in replay
      }

      this.physics.add.collider(gameState.player, gameState.walls)

      gameState.cursors = this.input.keyboard?.createCursorKeys()
      this.input.keyboard?.addKeys({
        W: Phaser.Input.Keyboard.KeyCodes.W,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        S: Phaser.Input.Keyboard.KeyCodes.S,
        D: Phaser.Input.Keyboard.KeyCodes.D,
      })

      const camera = this.cameras.main
      camera.setBounds(0, 0, gameWidth, gameHeight)
      camera.setZoom(1)

      gameState.gameTime = 0
    }

    function updateScene(this: Phaser.Scene) {
      if (gameState.gameOver) return

      gameState.gameTime += this.game.loop.delta / 1000

      if (gameState.isReplayMode) {
        // Replay mode: smooth interpolation between recorded positions
        
        // Helper function for linear interpolation
        const lerp = (start: number, end: number, t: number) => {
          return start + (end - start) * t
        }
        
        // Animate player replay using smooth interpolation
        if (gameState.replayMovements && gameState.replayMovements.length > 1) {
          // Find current and next movement based on time
          let currentIdx = 0
          for (let i = 0; i < gameState.replayMovements.length - 1; i++) {
            if (gameState.replayMovements[i].time <= gameState.gameTime) {
              currentIdx = i
            } else {
              break
            }
          }
          
          // Ensure we don't go past the last movement
          if (currentIdx >= gameState.replayMovements.length - 1) {
            currentIdx = gameState.replayMovements.length - 2
          }
          
          const current = gameState.replayMovements[currentIdx]
          const next = gameState.replayMovements[currentIdx + 1]
          
          if (current && next) {
            // Calculate interpolation factor (0 to 1)
            const timeDiff = next.time - current.time
            const elapsed = gameState.gameTime - current.time
            const t = timeDiff > 0 ? Math.min(elapsed / timeDiff, 1) : 1
            
            // Interpolate using pixel positions for smoother movement
            const interpPixelX = lerp(current.pixelX || (current.gridX * TILE_SIZE + TILE_SIZE / 2), 
                                     next.pixelX || (next.gridX * TILE_SIZE + TILE_SIZE / 2), t)
            const interpPixelY = lerp(current.pixelY || (current.gridY * TILE_SIZE + TILE_SIZE / 2), 
                                     next.pixelY || (next.gridY * TILE_SIZE + TILE_SIZE / 2), t)
            
            // Apply to player position in left maze
            const leftMazeOffsetX = gameState.offsetX
            gameState.player.x = interpPixelX + leftMazeOffsetX
            gameState.player.y = interpPixelY + gameState.offsetY
          }
        }
        
        // Animate optimal replay using smooth interpolation
        if (gameState.aiPlayer && gameState.optimalMovements && gameState.optimalMovements.length > 1) {
          // Find current and next movement based on time
          let optimalIdx = 0
          for (let i = 0; i < gameState.optimalMovements.length - 1; i++) {
            if (gameState.optimalMovements[i].time <= gameState.gameTime) {
              optimalIdx = i
            } else {
              break
            }
          }
          
          // Ensure we don't go past the last movement
          if (optimalIdx >= gameState.optimalMovements.length - 1) {
            optimalIdx = gameState.optimalMovements.length - 2
          }
          
          const currentOptimal = gameState.optimalMovements[optimalIdx]
          const nextOptimal = gameState.optimalMovements[optimalIdx + 1]
          
          if (currentOptimal && nextOptimal) {
            // Calculate interpolation factor (0 to 1)
            const timeDiff = nextOptimal.time - currentOptimal.time
            const elapsed = gameState.gameTime - currentOptimal.time
            const t = timeDiff > 0 ? Math.min(elapsed / timeDiff, 1) : 1
            
            // Interpolate using pixel positions for smoother movement
            const interpPixelX = lerp(currentOptimal.pixelX || (currentOptimal.gridX * TILE_SIZE + TILE_SIZE / 2), 
                                     nextOptimal.pixelX || (nextOptimal.gridX * TILE_SIZE + TILE_SIZE / 2), t)
            const interpPixelY = lerp(currentOptimal.pixelY || (currentOptimal.gridY * TILE_SIZE + TILE_SIZE / 2), 
                                     nextOptimal.pixelY || (nextOptimal.gridY * TILE_SIZE + TILE_SIZE / 2), t)
            
            // Apply to optimal player position in right maze
            const rightMazeOffsetX = gameState.offsetX + (MAZE_WIDTH + 40)
            gameState.aiPlayer.x = interpPixelX + rightMazeOffsetX
            gameState.aiPlayer.y = interpPixelY + gameState.offsetY
          }
        }
        
        // Check coin collection for player (increased radius for better detection)
        gameState.playerGold.forEach((gold: any) => {
          if (!gold.collected) {
            const dx = gameState.player.x - gold.posX
            const dy = gameState.player.y - gold.posY
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < 25) { // Increased from 20 to 25 for better detection
              gold.collected = true
              gold.sprite.setVisible(false)
              gameState.playerGoldCollected++
            }
          }
        })
        
        // Check coin collection for AI (increased radius for better detection)
        if (gameState.aiPlayer) {
          gameState.aiGold.forEach((gold: any) => {
            if (!gold.collected) {
              const dx = gameState.aiPlayer.x - gold.posX
              const dy = gameState.aiPlayer.y - gold.posY
              const distance = Math.sqrt(dx * dx + dy * dy)
              
              if (distance < 25) { // Increased from 20 to 25 for better detection
                gold.collected = true
                gold.sprite.setVisible(false)
                gameState.aiGoldCollected++
              }
            }
          })
        }
        
        // Update timer display
        const playerMaxTime = gameState.replayMovements[gameState.replayMovements.length - 1]?.time || 0
        const optimalMaxTime = gameState.optimalMovements[gameState.optimalMovements.length - 1]?.time || 0
        const playerCurrentTime = Math.min(gameState.gameTime, playerMaxTime)
        const optimalCurrentTime = Math.min(gameState.gameTime, optimalMaxTime)
        const playerFinished = gameState.gameTime >= playerMaxTime
        const optimalFinished = gameState.gameTime >= optimalMaxTime
        
        // Dispatch timer update event
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("replayTick", {
            detail: {
              playerTime: playerCurrentTime,
              optimalTime: optimalCurrentTime,
              playerFinished: playerFinished,
              optimalFinished: optimalFinished
            }
          }))
        }
        
        // End replay when both finish
        const maxTime = Math.max(playerMaxTime, optimalMaxTime)
        
        if (gameState.gameTime >= maxTime + 1) {
          gameState.gameOver = true
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("replayComplete"))
          }
        }
        
        return
      }

      // Normal game mode
      // Spawn monster after 5 seconds - Tom chasing Jerry!
      if (gameState.gameTime >= 5 && !gameState.monsterSpawned) {
        gameState.monsterSpawned = true
        gameState.monster = this.add.image(
          gameState.startDockPos.x, 
          gameState.startDockPos.y, 
          'tom'
        )
        gameState.monster.setDisplaySize(45, 45)
        gameState.monster.setDepth(2)
        this.physics.add.existing(gameState.monster, false)
        gameState.monster.body.setCollideWorldBounds(true)
        this.physics.add.collider(gameState.monster, gameState.walls)
      }

      const speed = 150
      const keys = this.input.keyboard?.keys
      let velocityX = 0
      let velocityY = 0

      if (keys?.[87]?.isDown || gameState.cursors?.up.isDown) velocityY = -speed
      if (keys?.[83]?.isDown || gameState.cursors?.down.isDown) velocityY = speed
      if (keys?.[65]?.isDown || gameState.cursors?.left.isDown) velocityX = -speed
      if (keys?.[68]?.isDown || gameState.cursors?.right.isDown) velocityX = speed

      gameState.player.body.setVelocity(velocityX, velocityY)
      
      // Record player movement every 50ms (0.05 seconds) for smooth replay
      if (gameState.movements.length === 0 || gameState.gameTime - gameState.movements[gameState.movements.length - 1].time >= 0.05) {
        // Convert pixel position to grid position
        const gridX = Math.round((gameState.player.x - gameState.offsetX - TILE_SIZE / 2) / TILE_SIZE)
        const gridY = Math.round((gameState.player.y - gameState.offsetY - TILE_SIZE / 2) / TILE_SIZE)
        
        // Also store actual pixel positions relative to maze
        const relativePixelX = gameState.player.x - gameState.offsetX
        const relativePixelY = gameState.player.y - gameState.offsetY
        
        gameState.movements.push({
          gridX: gridX,
          gridY: gridY,
          pixelX: relativePixelX,
          pixelY: relativePixelY,
          time: gameState.gameTime
        })
      }
      
      // Monster AI - chase player using simple pathfinding
      if (gameState.monster) {
        const monsterSpeed = 100
        const dx = gameState.player.x - gameState.monster.x
        const dy = gameState.player.y - gameState.monster.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance > 0) {
          const monsterVelX = (dx / distance) * monsterSpeed
          const monsterVelY = (dy / distance) * monsterSpeed
          gameState.monster.body.setVelocity(monsterVelX, monsterVelY)
        }

        // Check if monster caught player
        if (distance < 30) {
          gameState.gameOver = true
          gameState.score = gameState.bonusPoints // Only coins collected

          const leaderboard = JSON.parse(localStorage.getItem("MazeScape_leaderboard") || "[]")
          leaderboard.push({
            name: gameState.playerName,
            time: Math.round(gameState.gameTime * 100) / 100,
            score: gameState.score,
            coinsCollected: gameState.goldCollected,
            timestamp: Date.now(),
            caughtByMonster: true,
          })
          leaderboard.sort((a: any, b: any) => b.score - a.score)
          localStorage.setItem("MazeScape_leaderboard", JSON.stringify(leaderboard.slice(0, 50)))

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("gameComplete", {
                detail: {
                  playerName: gameState.playerName,
                  time: Math.round(gameState.gameTime * 100) / 100,
                  score: gameState.score,
                  coinsCollected: gameState.goldCollected,
                  bonusPoints: gameState.bonusPoints,
                  caughtByMonster: true,
                  movements: gameState.movements,
                },
              }),
            )
          }
          return
        }
      }

      // Check for gold collection
      gameState.gold.forEach((gold: any) => {
        if (
          !gold.collected &&
          Phaser.Geom.Circle.ContainsPoint(new Phaser.Geom.Circle(gameState.player.x, gameState.player.y, 20), {
            x: gold.sprite.x,
            y: gold.sprite.y,
          })
        ) {
          gold.collected = true
          gold.sprite.setVisible(false)
          gameState.goldCollected++
          gameState.bonusPoints += 10 // 10 points per coin
          
          // Dispatch coin collected event for UI update
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("coinCollected"))
          }
        }
      })

      // Check if player reached finish dock
      if (
        gameState.finishDock &&
        Phaser.Geom.Rectangle.ContainsPoint(
          new Phaser.Geom.Rectangle(gameState.finishDock.x - 20, gameState.finishDock.y - 20, 40, 40),
          { x: gameState.player.x, y: gameState.player.y },
        )
      ) {
        gameState.gameOver = true
        
        // Calculate final score: 100 base + 10 per coin - time in seconds
        gameState.score = 100 + gameState.bonusPoints - Math.round(gameState.gameTime)

        const leaderboard = JSON.parse(localStorage.getItem("MazeScape_leaderboard") || "[]")
        leaderboard.push({
          name: gameState.playerName,
          time: Math.round(gameState.gameTime * 100) / 100,
          score: gameState.score,
          coinsCollected: gameState.goldCollected,
          timestamp: Date.now(),
        })
        leaderboard.sort((a: any, b: any) => b.score - a.score) // Sort by score (highest first)
        localStorage.setItem("MazeScape_leaderboard", JSON.stringify(leaderboard.slice(0, 50)))

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("gameComplete", {
              detail: {
                playerName: gameState.playerName,
                time: Math.round(gameState.gameTime * 100) / 100,
                score: gameState.score,
                coinsCollected: gameState.goldCollected,
                bonusPoints: gameState.bonusPoints,
                movements: gameState.movements,
              },
            }),
          )
        }
      }
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [gameStarted, playerName, currentMaze, mazeDimensions, replayMode, playerMovements, optimalMovements])

  return (
    <div 
      className="w-full h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {!gameStarted ? (
        <div className="w-full h-screen flex items-center justify-center">
          <StartScreen onStart={startGame} />
        </div>
      ) : (
        <>
          <div id="game-container" className="w-full flex-1" />
          {replayMode ? (
            <ReplayUI onClose={resetGame} />
          ) : (
            <GameUI playerName={playerName} onResetGame={resetGame} />
          )}
        </>
      )}
    </div>
  )
}

function ReplayUI({ onClose }: { onClose: () => void }) {
  const [replayComplete, setReplayComplete] = useState(false)
  const [playerTime, setPlayerTime] = useState(0)
  const [optimalTime, setOptimalTime] = useState(0)
  const [playerFinished, setPlayerFinished] = useState(false)
  const [optimalFinished, setOptimalFinished] = useState(false)

  useEffect(() => {
    const handleReplayComplete = () => {
      setReplayComplete(true)
    }

    const handleReplayTick = (e: any) => {
      if (e.detail) {
        setPlayerTime(e.detail.playerTime || 0)
        setOptimalTime(e.detail.optimalTime || 0)
        setPlayerFinished(e.detail.playerFinished || false)
        setOptimalFinished(e.detail.optimalFinished || false)
      }
    }

    window.addEventListener("replayComplete", handleReplayComplete)
    window.addEventListener("replayTick", handleReplayTick)

    return () => {
      window.removeEventListener("replayComplete", handleReplayComplete)
      window.removeEventListener("replayTick", handleReplayTick)
    }
  }, [])

  const handleRestart = () => {
    setReplayComplete(false)
    setPlayerTime(0)
    setOptimalTime(0)
    setPlayerFinished(false)
    setOptimalFinished(false)
    // Trigger replay restart
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("restartReplay"))
    }
  }

  return (
    <>
      {/* Top Bar with Timers */}
      <div className="fixed top-0 left-0 right-0 z-40 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Left Timer - Your Run */}
            <div className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-sm px-6 py-4 rounded-2xl border-4 border-blue-800 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                    👤
                  </div>
                  <span className="font-black text-lg text-white tracking-wide">YOUR RUN</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-3xl text-white">{playerTime.toFixed(2)}</span>
                  <span className="text-sm font-bold text-blue-200">SEC</span>
                  {playerFinished && <span className="ml-2 text-2xl">✓</span>}
                </div>
              </div>
            </div>

            {/* Center - Replay Mode Badge (Clickable to Restart) */}
            <button
              onClick={handleRestart}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 backdrop-blur-sm px-6 py-4 rounded-2xl border-4 border-purple-800 shadow-2xl transform transition-all hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-pulse">👻</span>
                <span className="font-black text-lg text-white tracking-wide">REPLAY</span>
              </div>
            </button>

            {/* Right Timer - Optimal Run */}
            <div className="flex-1 bg-gradient-to-r from-green-600 to-green-700 backdrop-blur-sm px-6 py-4 rounded-2xl border-4 border-green-800 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                    🏆
                  </div>
                  <span className="font-black text-lg text-white tracking-wide">OPTIMAL RUN</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-3xl text-white">{optimalTime.toFixed(2)}</span>
                  <span className="text-sm font-bold text-green-200">SEC</span>
                  {optimalFinished && <span className="ml-2 text-2xl">✓</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {replayComplete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl border-4 border-purple-600 p-10 max-w-lg shadow-2xl text-center space-y-6">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-5xl font-black text-purple-700 tracking-tight">REPLAY COMPLETE</h2>
            <p className="text-xl text-gray-700 font-bold">You've seen both runs side-by-side!</p>
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleRestart}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-black text-lg rounded-2xl border-4 border-green-800 shadow-xl transform transition-all hover:scale-105"
              >
                WATCH AGAIN
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black text-lg rounded-2xl border-4 border-purple-800 shadow-xl transform transition-all hover:scale-105"
              >
                BACK TO MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StartScreen({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState("")

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-10 bg-white/95 backdrop-blur-sm rounded-xl border-2 border-black shadow-2xl max-w-md">
      <div className="text-center">
        <h1 className="text-6xl font-black text-black mb-2 tracking-tight">
          MazeScape
        </h1>
        <p className="text-purple-600 text-base font-bold tracking-widest">GOLD COLLECTOR</p>
      </div>

      <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center border-4 border-black shadow-lg">
        <div className="w-12 h-12 bg-white rounded-full" />
      </div>

      <div className="space-y-4 w-full">
        <p className="text-black text-center font-semibold">Enter your name to start</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
          className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-purple-600 font-medium"
          onKeyDown={(e) => e.key === "Enter" && onStart(name)}
        />
        <button
          onClick={() => onStart(name)}
          className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-lg transition-all border-2 border-black shadow-lg"
        >
          START GAME
        </button>
      </div>

      <div className="text-xs text-gray-700 text-center space-y-1 font-medium">
        <p className="text-purple-600 font-bold">Start at bottom, reach the top purple dock to finish</p>
        <p>Score: 100 base + 10 per coin - time in seconds</p>
        <p>Use WASD or Arrow Keys to move</p>
      </div>
    </div>
  )
}

function GameUI({ playerName, onResetGame }: { playerName: string; onResetGame: () => void }) {
  const [gameComplete, setGameComplete] = useState(false)
  const [finalTime, setFinalTime] = useState(0)
  const [finalScore, setFinalScore] = useState(0)
  const [coinsCollected, setCoinsCollected] = useState(0)
  const [bonusPoints, setBonusPoints] = useState(0)
  const [caughtByMonster, setCaughtByMonster] = useState(false)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentScore, setCurrentScore] = useState(0)
  const [currentCoins, setCurrentCoins] = useState(0)
  const [showReview, setShowReview] = useState(false)
  const [playerMovements, setPlayerMovements] = useState<{gridX: number, gridY: number, pixelX?: number, pixelY?: number, time: number}[]>([])
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleGameComplete = (e: any) => {
      setFinalTime(e.detail.time)
      setFinalScore(e.detail.score)
      setCoinsCollected(e.detail.coinsCollected)
      setBonusPoints(e.detail.bonusPoints)
      setCaughtByMonster(e.detail.caughtByMonster || false)
      setPlayerMovements(e.detail.movements || [])
      setGameComplete(true)
      setLeaderboard(JSON.parse(localStorage.getItem("MazeScape_leaderboard") || "[]"))
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current)
    }

    const handleCoinCollected = () => {
      setCurrentCoins(prev => prev + 1)
    }

    window.addEventListener("gameComplete", handleGameComplete)
    window.addEventListener("coinCollected", handleCoinCollected)

    timeIntervalRef.current = setInterval(() => {
      setElapsedTime((prevTime) => {
        const newTime = prevTime + 0.01
        // Update current score: 100 base + 10 per coin - time in seconds
        setCurrentScore(100 + currentCoins * 10 - Math.round(newTime))
        return newTime
      })
    }, 10)

    return () => {
      window.removeEventListener("gameComplete", handleGameComplete)
      window.removeEventListener("coinCollected", handleCoinCollected)
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current)
    }
  }, [currentCoins])

  if (gameComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border-4 border-black p-8 max-w-md shadow-2xl text-center space-y-6">
          <h2 className={`text-4xl font-black ${caughtByMonster ? 'text-red-600' : 'text-black'}`}>
            {caughtByMonster ? 'CAUGHT BY MONSTER!' : 'MISSION COMPLETE'}
          </h2>

          <div className="space-y-3">
            <p className="text-gray-700 font-bold text-lg">Final Score</p>
            <p className={`text-6xl font-black ${caughtByMonster ? 'text-red-600' : 'text-purple-600'}`}>{finalScore}</p>
            <div className="text-sm text-gray-700 space-y-1 font-medium">
              {caughtByMonster ? (
                <>
                  <p className="text-red-600 font-bold">Monster caught you!</p>
                  <p>Coins: {coinsCollected} (+{bonusPoints} pts)</p>
                  <p>Time survived: {finalTime.toFixed(2)}s</p>
                </>
              ) : (
                <>
                  <p>Time: {finalTime.toFixed(2)}s (-{Math.round(finalTime)} pts)</p>
                  <p>Coins: {coinsCollected} (+{bonusPoints} pts)</p>
                  <p>Base: 100 pts</p>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-3 border-2 border-black">
            <h3 className="text-black font-black text-base tracking-widest">TOP 5 SCORES</h3>
            <div className="space-y-2 text-sm">
              {leaderboard.slice(0, 5).map((entry: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex justify-between px-3 py-2 rounded font-bold ${
                    entry.name === playerName && entry.timestamp === leaderboard.find(e => e.name === playerName)?.timestamp ? "bg-purple-600 text-white border-2 border-black" : "bg-gray-100 text-black border border-gray-300"
                  }`}
                >
                  <span>
                    #{idx + 1} {entry.name}
                  </span>
                  <span className="font-mono">{entry.score || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowReview(true)}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-lg transition-all border-2 border-black shadow-lg"
            >
              AI REVIEW
            </button>
            <button
              onClick={onResetGame}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg transition-all border-2 border-black shadow-lg"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
        
        {showReview && GameReview && (() => {
          // Load optimal recording from localStorage
          const optimalRecording = JSON.parse(localStorage.getItem('optimal_recording') || 'null')
          
          if (!optimalRecording) {
            return (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
                <div className="bg-white/95 rounded-xl border-4 border-black p-8 max-w-md shadow-2xl text-center space-y-6">
                  <h2 className="text-3xl font-black text-red-600">NO OPTIMAL RUN RECORDED</h2>
                  <p className="text-gray-700 font-bold">Please record an optimal run first!</p>
                  <button
                    onClick={() => {
                      setShowReview(false)
                      if (typeof window !== "undefined") {
                        window.location.href = '/record'
                      }
                    }}
                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg border-2 border-black"
                  >
                    GO TO RECORD MODE
                  </button>
                  <button
                    onClick={() => setShowReview(false)}
                    className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg rounded-lg border-2 border-black"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            )
          }
          
          return (
            <GameReview
              playerScore={finalScore}
              playerTime={finalTime}
              playerCoins={coinsCollected}
              aiScore={optimalRecording.score}
              aiTime={optimalRecording.time}
              aiCoins={optimalRecording.coinsCollected}
              onClose={() => setShowReview(false)}
              onStartReplay={() => {
                setShowReview(false)
                setGameComplete(false)
                // Trigger replay mode with both movements
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("startReplay", {
                    detail: { 
                      playerMovements: playerMovements,
                      optimalMovements: optimalRecording.movements
                    }
                  }))
                }
              }}
            />
          )
        })()}
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-center">
      <div className="space-y-1 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-black shadow-lg">
        <p className="text-xs text-gray-600 tracking-widest font-bold">PLAYER</p>
        <p className="font-black text-xl text-black">{playerName}</p>
      </div>

      <div className="flex gap-4">
        <div className="text-center space-y-1 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-black shadow-lg">
          <p className="text-xs text-gray-600 tracking-widest font-bold">COINS</p>
          <p className="font-black text-2xl text-purple-600">{currentCoins}</p>
        </div>
        
        <div className="text-center space-y-1 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-black shadow-lg">
          <p className="text-xs text-gray-600 tracking-widest font-bold">SCORE</p>
          <p className="font-black text-2xl text-purple-600">{currentScore}</p>
        </div>

        <div className="text-right space-y-1 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-black shadow-lg">
          <p className="text-xs text-gray-600 tracking-widest font-bold">TIME</p>
          <p className="font-mono font-bold text-xl text-black">{elapsedTime.toFixed(2)}s</p>
        </div>
      </div>
    </div>
  )
}

export default GameComponent
