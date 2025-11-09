"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

// Dynamically import Phaser only on client-side
let Phaser: any = null
if (typeof window !== "undefined") {
  Phaser = require("phaser")
}

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

const RecordPage = () => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [playerName, setPlayerName] = useState("")
  const router = useRouter()

  const startRecording = (name: string) => {
    if (name.trim()) {
      setPlayerName(name)
      setGameStarted(true)
    }
  }

  const cancelRecording = () => {
    if (gameRef.current) {
      gameRef.current.destroy(true)
      gameRef.current = null
    }
    router.push('/')
  }

  useEffect(() => {
    if (!gameStarted || gameRef.current || typeof window === "undefined") return
    
    if (!Phaser) {
      Phaser = require("phaser")
    }

    const gameWidth = window.innerWidth
    const gameHeight = window.innerHeight
    
    const mazeDimensions = { width: 10, height: 10 }
    const availableWidth = gameWidth - 100
    const availableHeight = gameHeight - 160
    
    const tileByWidth = Math.floor(availableWidth / mazeDimensions.width)
    const tileByHeight = Math.floor(availableHeight / mazeDimensions.height)
    
    const TILE_SIZE = Math.max(30, Math.min(tileByWidth, tileByHeight, 80))
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
      scene: {
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
      movements: [] as {gridX: number, gridY: number, pixelX: number, pixelY: number, time: number}[],
      TILE_SIZE: TILE_SIZE,
      offsetX: 0,
      offsetY: 0,
    }

    function preloadScene(this: Phaser.Scene) {
      this.load.image('brick', '/brick.avif')
      this.load.image('coin', '/coin.png')
      this.load.image('jerry', '/jerry.png')
      this.load.image('tom', '/tom.png')
    }

    function createScene(this: Phaser.Scene) {
      const graphics = this.add.graphics()
      graphics.setDepth(0)

      gameState.walls = this.physics.add.staticGroup()

      const offsetX = (gameWidth - MAZE_WIDTH) / 2
      const offsetY = (gameHeight - MAZE_HEIGHT) / 2 + OFFSET_Y / 2
      
      gameState.offsetX = offsetX
      gameState.offsetY = offsetY

      // Draw cream background with black border
      graphics.fillStyle(0xf5deb3, 1)
      graphics.fillRect(offsetX - 6, offsetY - 6, MAZE_WIDTH + 12, MAZE_HEIGHT + 12)
      graphics.lineStyle(3, 0x000000, 1)
      graphics.strokeRect(offsetX - 6, offsetY - 6, MAZE_WIDTH + 12, MAZE_HEIGHT + 12)

      // Draw floor tiles
      for (let y = 0; y < MAZE_MAP.length; y++) {
        for (let x = 0; x < MAZE_MAP[y].length; x++) {
          const tile = MAZE_MAP[y][x]
          const posX = x * TILE_SIZE + offsetX
          const posY = y * TILE_SIZE + offsetY

          if (tile !== "#") {
            graphics.fillStyle(0xf5deb3, 1)
            graphics.fillRect(posX, posY, TILE_SIZE, TILE_SIZE)
          }
        }
      }

      const docks: Array<{x: number, y: number}> = []
      
      // Create walls, coins, and find docks
      for (let y = 0; y < MAZE_MAP.length; y++) {
        for (let x = 0; x < MAZE_MAP[y].length; x++) {
          const tile = MAZE_MAP[y][x]
          const posX = x * TILE_SIZE + TILE_SIZE / 2 + offsetX
          const posY = y * TILE_SIZE + TILE_SIZE / 2 + offsetY

          if (tile === "#") {
            const wall = this.add.image(posX, posY, 'brick')
            wall.setDisplaySize(TILE_SIZE, TILE_SIZE)
            wall.setDepth(0)
            this.physics.add.existing(wall, true)
            gameState.walls.add(wall)
          } else if (tile === "G") {
            const gold = this.add.image(posX, posY, 'coin')
            gold.setDisplaySize(30, 30)
            gold.setDepth(1)
            gameState.gold.push({ sprite: gold, posX, posY, collected: false })
          } else if (tile === "D") {
            docks.push({ x, y })
          }
        }
      }

      docks.sort((a, b) => a.y - b.y)

      docks.forEach((dock, index) => {
        const dockPosX = dock.x * TILE_SIZE + TILE_SIZE / 2 + offsetX
        const dockPosY = dock.y * TILE_SIZE + TILE_SIZE / 2 + offsetY
        
        if (index === 0) {
          // Top dock is finish
          gameState.finishDock = this.add.rectangle(dockPosX, dockPosY, TILE_SIZE - 8, TILE_SIZE - 8, 0x8b5cf6)
          gameState.finishDock.setStrokeStyle(2, 0x7c3aed)
          gameState.finishDock.setAlpha(0.8)
          gameState.finishDock.setDepth(1)
        } else if (index === docks.length - 1) {
          // Bottom dock is start
          gameState.startDock = this.add.rectangle(dockPosX, dockPosY, TILE_SIZE - 8, TILE_SIZE - 8, 0xc4b5fd)
          gameState.startDock.setStrokeStyle(2, 0xa78bfa)
          gameState.startDock.setAlpha(0.8)
          gameState.startDock.setDepth(1)
          
          // Spawn player
          gameState.player = this.add.image(dockPosX, dockPosY, 'jerry')
          gameState.player.setDisplaySize(40, 40)
          gameState.player.setDepth(2)
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
      })

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

      // Spawn monster after 5 seconds
      if (gameState.gameTime >= 5 && !gameState.monsterSpawned) {
        gameState.monsterSpawned = true
        const startDockPos = { 
          x: gameState.startDock.x, 
          y: gameState.startDock.y 
        }
        gameState.monster = this.add.image(startDockPos.x, startDockPos.y, 'tom')
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

      // Monster AI
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

        if (distance < 30) {
          gameState.gameOver = true
          gameState.score = gameState.bonusPoints
          alert(`Caught by monster! Score: ${gameState.score}. Recording NOT saved.`)
          if (typeof window !== "undefined") {
            window.location.href = '/'
          }
          return
        }
      }

      // Check for gold collection
      gameState.gold.forEach((gold: any) => {
        if (!gold.collected) {
          const dx = gameState.player.x - gold.sprite.x
          const dy = gameState.player.y - gold.sprite.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 20) {
            gold.collected = true
            gold.sprite.setVisible(false)
            gameState.goldCollected++
            gameState.bonusPoints += 10
          }
        }
      })

      // Check if player reached finish dock
      if (gameState.finishDock) {
        const dx = gameState.player.x - gameState.finishDock.x
        const dy = gameState.player.y - gameState.finishDock.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 20) {
          gameState.gameOver = true
          gameState.score = 100 + gameState.bonusPoints - Math.round(gameState.gameTime)

          // Save recording
          const timestamp = Date.now()
          const recording = {
            playerName: gameState.playerName,
            timestamp: timestamp,
            time: Math.round(gameState.gameTime * 100) / 100,
            score: gameState.score,
            coinsCollected: gameState.goldCollected,
            bonusPoints: gameState.bonusPoints,
            movements: gameState.movements
          }
          
          localStorage.setItem('optimal_recording', JSON.stringify(recording))
          alert(`Recording saved! Score: ${gameState.score}, Time: ${recording.time}s`)
          
          if (typeof window !== "undefined") {
            window.location.href = '/'
          }
        }
      }
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    return () => {
      game.destroy(true)
      gameRef.current = null
    }
  }, [gameStarted, playerName, router])

  return (
    <div 
      className="w-full h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      {!gameStarted ? (
        <div className="w-full h-screen flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-6 p-10 bg-white/95 backdrop-blur-sm rounded-xl border-2 border-black shadow-2xl max-w-md">
            <div className="text-center">
              <h1 className="text-5xl font-black text-red-600 mb-2 tracking-tight">
                🔴 RECORD MODE
              </h1>
              <p className="text-purple-600 text-base font-bold tracking-widest">OPTIMAL RUN RECORDING</p>
            </div>

            <div className="bg-yellow-100 border-2 border-yellow-600 rounded-lg p-4 text-sm">
              <p className="font-bold text-yellow-800 mb-2">⚠️ IMPORTANT:</p>
              <ul className="text-yellow-900 space-y-1 text-xs">
                <li>• This will record your OPTIMAL run</li>
                <li>• Complete the maze to save recording</li>
                <li>• Don't get caught by the monster!</li>
                <li>• Recording replaces previous optimal run</li>
                <li>• High-quality 50ms recording for smooth replay</li>
              </ul>
            </div>

            <div className="space-y-4 w-full">
              <p className="text-black text-center font-semibold">Enter your name</p>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-red-600 font-medium"
                onKeyDown={(e) => e.key === "Enter" && startRecording(playerName)}
              />
              <button
                onClick={() => startRecording(playerName)}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition-all border-2 border-black shadow-lg"
              >
                🔴 START RECORDING
              </button>
              <button
                onClick={cancelRecording}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold text-lg rounded-lg transition-all border-2 border-black shadow-lg"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div id="game-container" className="w-full flex-1" />
          <div className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-center items-center">
            <div className="bg-red-600/90 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-black shadow-lg">
              <p className="font-black text-xl text-white">🔴 RECORDING IN PROGRESS - {playerName}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RecordPage
