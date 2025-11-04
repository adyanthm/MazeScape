"use client"

import * as Phaser from "phaser"
import { useEffect, useRef, useState } from "react"

const MAZE_MAP = [
  "##########",
  "#D.......#",
  "#.###...##",
  "#.#.#.#..#",
  "#.#.G.#.##",
  "#...#.#..#",
  "###.#...##",
  "#.......##",
  "#.########",
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

    const TILE_SIZE = 60
    const MAZE_WIDTH = mazeDimensions.width * TILE_SIZE
    const MAZE_HEIGHT = mazeDimensions.height * TILE_SIZE
    const OFFSET_Y = 80

    const gameWidth = typeof window !== "undefined" ? window.innerWidth : 1024
    const gameHeight = typeof window !== "undefined" ? window.innerHeight : 768

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: "game-container",
      width: gameWidth,
      height: gameHeight,
      backgroundColor: "#0a0e27",
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
      dock: null as any,
      walls: null as any,
      goldCollected: 0,
      gameTime: 0,
      gameOver: false,
      playerName: playerName,
      score: 0,
    }

    function initScene(this: Phaser.Scene) {
      this.physics.world.setBounds(0, OFFSET_Y, MAZE_WIDTH, MAZE_HEIGHT)
    }

    function preloadScene(this: Phaser.Scene) {}

    function createScene(this: Phaser.Scene) {
      const graphics = this.add.graphics()
      graphics.setDepth(0)

      gameState.walls = this.physics.add.staticGroup()

      for (let y = 0; y < currentMaze.length; y++) {
        for (let x = 0; x < currentMaze[y].length; x++) {
          const tile = currentMaze[y][x]
          const posX = x * TILE_SIZE
          const posY = y * TILE_SIZE + OFFSET_Y

          if (tile !== "#") {
            graphics.fillStyle(0xf5deb3, 1)
            graphics.fillRect(posX, posY, TILE_SIZE, TILE_SIZE)
            graphics.lineStyle(1, 0xe6d5a0, 0.5)
            graphics.strokeRect(posX, posY, TILE_SIZE, TILE_SIZE)
          }
        }
      }

      for (let y = 0; y < currentMaze.length; y++) {
        for (let x = 0; x < currentMaze[y].length; x++) {
          const tile = currentMaze[y][x]
          const posX = x * TILE_SIZE + TILE_SIZE / 2
          const posY = y * TILE_SIZE + TILE_SIZE / 2 + OFFSET_Y

          if (tile === "#") {
            const wall = this.add.rectangle(posX, posY, TILE_SIZE, TILE_SIZE, 0x8b6914)
            wall.setStrokeStyle(2, 0x5c4509)
            gameState.walls.add(wall)
          } else if (tile === "G") {
            const gold = this.add.circle(posX, posY, 12, 0xffd700)
            gold.setStrokeStyle(1, 0xffed4e)
            gold.setDepth(1)
            gameState.gold.push({ sprite: gold, posX, posY, collected: false })
          } else if (tile === "D") {
            gameState.dock = this.add.rectangle(posX, posY, TILE_SIZE - 8, TILE_SIZE - 8, 0x00ff88)
            gameState.dock.setStrokeStyle(2, 0x00cc66)
            gameState.dock.setAlpha(0.7)
            gameState.dock.setDepth(1)
            gameState.player = this.add.rectangle(posX, posY, 32, 32, 0x0066ff)
            gameState.player.setStrokeStyle(2, 0x00d4ff)
            this.physics.add.existing(gameState.player, false)
            gameState.player.body.setCollideWorldBounds(true)
            gameState.player.body.setBounce(0)
          }
        }
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
      camera.setBounds(0, OFFSET_Y, MAZE_WIDTH, MAZE_HEIGHT)
      camera.setZoom(1)
      camera.centerOn(MAZE_WIDTH / 2, MAZE_HEIGHT / 2 + OFFSET_Y)
      camera.ignore(gameState.walls)

      gameState.gameTime = 0
    }

    function updateScene(this: Phaser.Scene) {
      if (gameState.gameOver) return

      gameState.gameTime += this.game.loop.delta / 1000

      const speed = 150
      const keys = this.input.keyboard?.keys
      let velocityX = 0
      let velocityY = 0

      if (keys?.[87]?.isDown || gameState.cursors?.up.isDown) velocityY = -speed
      if (keys?.[83]?.isDown || gameState.cursors?.down.isDown) velocityY = speed
      if (keys?.[65]?.isDown || gameState.cursors?.left.isDown) velocityX = -speed
      if (keys?.[68]?.isDown || gameState.cursors?.right.isDown) velocityX = speed

      gameState.player.body.setVelocity(velocityX, velocityY)

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
        }
      })

      if (
        gameState.goldCollected === 1 &&
        Phaser.Geom.Rectangle.ContainsPoint(
          new Phaser.Geom.Rectangle(gameState.dock.x - 20, gameState.dock.y - 20, 40, 40),
          { x: gameState.player.x, y: gameState.player.y },
        )
      ) {
        gameState.gameOver = true
        gameState.score = Math.round(gameState.gameTime * 100) / 100

        const leaderboard = JSON.parse(localStorage.getItem("roboquest_leaderboard") || "[]")
        leaderboard.push({
          name: gameState.playerName,
          time: gameState.score,
          timestamp: Date.now(),
        })
        leaderboard.sort((a: any, b: any) => a.time - b.time)
        localStorage.setItem("roboquest_leaderboard", JSON.stringify(leaderboard.slice(0, 50)))

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("gameComplete", {
              detail: {
                playerName: gameState.playerName,
                time: gameState.score,
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
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {!gameStarted ? (
        <div className="w-full h-screen flex items-center justify-center">
          <StartScreen onStart={startGame} />
        </div>
      ) : (
        <>
          <div id="game-container" className="w-full flex-1" />
          <GameUI playerName={playerName} />
        </>
      )}
    </div>
  )
}

function StartScreen({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState("")

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-cyan-500/30 shadow-2xl max-w-md">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
          RoboQuest
        </h1>
        <p className="text-slate-300 text-sm tracking-widest">GOLD COLLECTOR</p>
      </div>

      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center border-2 border-cyan-300">
        <div className="w-12 h-12 bg-slate-800 rounded-full" />
      </div>

      <div className="space-y-4 w-full">
        <p className="text-slate-300 text-center text-sm">Enter your name to start</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
          className="w-full px-4 py-3 bg-slate-700/50 border border-cyan-500/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          onKeyPress={(e) => e.key === "Enter" && onStart(name)}
        />
        <button
          onClick={() => onStart(name)}
          className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50"
        >
          START GAME
        </button>
      </div>

      <div className="text-xs text-slate-400 text-center space-y-1">
        <p>Collect 1 gold piece and return to the dock</p>
        <p>Use WASD or Arrow Keys to move</p>
      </div>
    </div>
  )
}

function GameUI({ playerName }: { playerName: string }) {
  const [gameComplete, setGameComplete] = useState(false)
  const [finalTime, setFinalTime] = useState(0)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleGameComplete = (e: any) => {
      setFinalTime(e.detail.time)
      setGameComplete(true)
      setLeaderboard(JSON.parse(localStorage.getItem("roboquest_leaderboard") || "[]"))
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current)
    }

    window.addEventListener("gameComplete", handleGameComplete)

    timeIntervalRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 0.01)
    }, 10)

    return () => {
      window.removeEventListener("gameComplete", handleGameComplete)
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current)
    }
  }, [])

  if (gameComplete) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-cyan-500/30 p-8 max-w-md shadow-2xl text-center space-y-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
            MISSION COMPLETE
          </h2>

          <div className="space-y-2">
            <p className="text-slate-300">You collected the gold in</p>
            <p className="text-4xl font-bold text-cyan-400">{finalTime.toFixed(2)}s</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
            <h3 className="text-cyan-400 font-bold text-sm tracking-widest">TOP 5 FASTEST</h3>
            <div className="space-y-2 text-sm">
              {leaderboard.slice(0, 5).map((entry: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex justify-between px-3 py-2 rounded ${
                    entry.name === playerName ? "bg-cyan-500/20 border border-cyan-500/50" : "bg-slate-600/30"
                  }`}
                >
                  <span className="text-slate-300">
                    #{idx + 1} {entry.name}
                  </span>
                  <span className="text-cyan-300 font-mono">{entry.time.toFixed(2)}s</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload()
              }
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50"
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-center bg-gradient-to-b from-slate-900/80 to-transparent backdrop-blur-sm">
      <div className="text-white space-y-1">
        <p className="text-xs text-slate-400 tracking-widest">PLAYER</p>
        <p className="font-bold text-lg text-cyan-400">{playerName}</p>
      </div>

      <div className="text-right space-y-1">
        <p className="text-xs text-slate-400 tracking-widest">TIME</p>
        <p className="font-mono text-lg text-cyan-400">{elapsedTime.toFixed(2)}s</p>
      </div>
    </div>
  )
}

export default GameComponent
