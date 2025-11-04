"use client"

export const dynamic = "force-dynamic"

import * as Phaser from "phaser"
import { useEffect, useRef, useState } from "react"

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

const GameComponent = () => {
  const gameRef = useRef<Phaser.Game | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [playerName, setPlayerName] = useState("")

  const startGame = (name: string) => {
    if (name.trim()) {
      setPlayerName(name)
      setGameStarted(true)
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
  }, [])

  useEffect(() => {
    if (!gameStarted || gameRef.current) return

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
      mazeGrid: [] as number[][],
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

      // Calculate center offsets
      const offsetX = (gameWidth - MAZE_WIDTH) / 2
      const offsetY = (gameHeight - MAZE_HEIGHT) / 2 + OFFSET_Y / 2

      // Draw cream background with black border around entire maze
      graphics.fillStyle(0xf5deb3, 1)
      graphics.fillRect(offsetX - 6, offsetY - 6, MAZE_WIDTH + 12, MAZE_HEIGHT + 12)
      graphics.lineStyle(3, 0x000000, 1)
      graphics.strokeRect(offsetX - 6, offsetY - 6, MAZE_WIDTH + 12, MAZE_HEIGHT + 12)

      // Create maze grid for pathfinding (0 = walkable, 1 = wall)
      gameState.mazeGrid = currentMaze.map(row => 
        row.split('').map(tile => tile === '#' ? 1 : 0)
      )

      // Draw all tiles - cream for floors, brick texture for walls
      for (let y = 0; y < currentMaze.length; y++) {
        for (let x = 0; x < currentMaze[y].length; x++) {
          const tile = currentMaze[y][x]
          const posX = x * TILE_SIZE + offsetX
          const posY = y * TILE_SIZE + offsetY

          if (tile !== "#") {
            // Draw cream floor tiles
            graphics.fillStyle(0xf5deb3, 1)
            graphics.fillRect(posX, posY, TILE_SIZE, TILE_SIZE)
          }
        }
      }

      // Find all docks and determine which is top/bottom
      const docks: Array<{x: number, y: number, posX: number, posY: number}> = []
      
      for (let y = 0; y < currentMaze.length; y++) {
        for (let x = 0; x < currentMaze[y].length; x++) {
          const tile = currentMaze[y][x]
          const posX = x * TILE_SIZE + TILE_SIZE / 2 + offsetX
          const posY = y * TILE_SIZE + TILE_SIZE / 2 + offsetY

          if (tile === "#") {
            // Create brick textured wall
            const wall = this.add.image(posX, posY, 'brick')
            wall.setDisplaySize(TILE_SIZE, TILE_SIZE)
            wall.setDepth(0)
            this.physics.add.existing(wall, true)
            gameState.walls.add(wall)
          } else if (tile === "G") {
            // Create coin with texture (cheese) - 25% larger
            const gold = this.add.image(posX, posY, 'coin')
            gold.setDisplaySize(50, 50)
            gold.setDepth(1)
            gameState.gold.push({ sprite: gold, posX, posY, collected: false })
          } else if (tile === "D") {
            docks.push({ x, y, posX, posY })
          }
        }
      }

      // Sort docks by Y position (top to bottom)
      docks.sort((a, b) => a.y - b.y)

      // Create docks: top dock = finish (red), bottom dock = start (green)
      docks.forEach((dock, index) => {
        if (index === 0) {
          // Top dock is finish dock (purple)
          gameState.finishDock = this.add.rectangle(dock.posX, dock.posY, TILE_SIZE - 8, TILE_SIZE - 8, 0x8b5cf6)
          gameState.finishDock.setStrokeStyle(2, 0x7c3aed)
          gameState.finishDock.setAlpha(0.8)
          gameState.finishDock.setDepth(1)
        } else if (index === docks.length - 1) {
          // Bottom dock is start dock (light purple)
          gameState.startDock = this.add.rectangle(dock.posX, dock.posY, TILE_SIZE - 8, TILE_SIZE - 8, 0xc4b5fd)
          gameState.startDock.setStrokeStyle(2, 0xa78bfa)
          gameState.startDock.setAlpha(0.8)
          gameState.startDock.setDepth(1)
          
          // Store start dock position for monster spawn
          gameState.startDockPos = { x: dock.posX, y: dock.posY }
          
          // Spawn player at start dock (bottom) - Jerry
          gameState.player = this.add.image(dock.posX, dock.posY, 'jerry')
          gameState.player.setDisplaySize(40, 40)
          gameState.player.setDepth(2)
          this.physics.add.existing(gameState.player, false)
          gameState.player.body.setCollideWorldBounds(true)
          gameState.player.body.setBounce(0)
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
  }, [gameStarted, playerName, currentMaze, mazeDimensions])

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
          <GameUI playerName={playerName} onResetGame={resetGame} />
        </>
      )}
    </div>
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
          onKeyPress={(e) => e.key === "Enter" && onStart(name)}
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
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleGameComplete = (e: any) => {
      setFinalTime(e.detail.time)
      setFinalScore(e.detail.score)
      setCoinsCollected(e.detail.coinsCollected)
      setBonusPoints(e.detail.bonusPoints)
      setCaughtByMonster(e.detail.caughtByMonster || false)
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

          <button
            onClick={onResetGame}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-lg transition-all border-2 border-black shadow-lg"
          >
            PLAY AGAIN
          </button>
        </div>
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
