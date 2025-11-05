"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const MazeBuilder = () => {
  const [width, setWidth] = useState(10)
  const [height, setHeight] = useState(10)
  const [mazeInitialized, setMazeInitialized] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  const TILE_TYPES = {
    FLOOR: ".",
    WALL: "#",
    GOLD: "G",
    DOCK: "D",
  }

  const [maze, setMaze] = useState<string[][]>([])
  const [selectedTile, setSelectedTile] = useState(TILE_TYPES.FLOOR)
  const [savedMaze, setSavedMaze] = useState(false)
  const [showMazeArray, setShowMazeArray] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      }
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  useEffect(() => {
    if (mazeInitialized) {
      const initialMaze = Array(height)
        .fill(null)
        .map(() => Array(width).fill(TILE_TYPES.FLOOR))
      setMaze(initialMaze)
      setSavedMaze(false)
    }
  }, [mazeInitialized, width, height])

  useEffect(() => {
    const savedConfig = localStorage.getItem("custom_maze_config")
    if (savedConfig) {
      const { width: w, height: h } = JSON.parse(savedConfig)
      setWidth(w)
      setHeight(h)
    }
    setMazeInitialized(true)
  }, [])

  const calculateTileSize = () => {
    if (windowSize.width === 0) return 40

    // Available space (accounting for padding and UI elements)
    const availableWidth = windowSize.width - 80 // 40px padding on each side
    const availableHeight = windowSize.height - 420 // More space for header, spacing, and footer

    // Calculate max tile size based on width and height
    const tileByWidth = Math.floor(availableWidth / width)
    const tileByHeight = Math.floor(availableHeight / height)

    // Use the smaller value to ensure maze fits in both dimensions
    return Math.max(20, Math.min(tileByWidth, tileByHeight))
  }

  const tileSize = calculateTileSize()

  const toggleTile = (row: number, col: number) => {
    const newMaze = maze.map((r) => [...r])
    newMaze[row][col] = selectedTile
    setMaze(newMaze)
  }

  const getMazeArray = () => {
    return maze.map((row) => row.join(""))
  }

  const saveMaze = () => {
    const mazeStrings = getMazeArray()
    localStorage.setItem("custom_maze", JSON.stringify(mazeStrings))
    localStorage.setItem("custom_maze_config", JSON.stringify({ width, height }))
    console.log("[MazeScape] Maze saved successfully!")
    console.log("[MazeScape] Maze Array:", mazeStrings)
    console.log("[MazeScape] Dimensions:", { width, height })
    setSavedMaze(true)
    setShowMazeArray(true)
    setTimeout(() => setSavedMaze(false), 2000)
  }

  const copyMazeToClipboard = () => {
    const mazeArray = getMazeArray()
    const textToCopy = JSON.stringify(mazeArray, null, 2)
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const exportMazeAsJSON = () => {
    const mazeArray = getMazeArray()
    const exportData = {
      maze: mazeArray,
      dimensions: { width, height },
      createdAt: new Date().toISOString(),
    }
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `maze_${width}x${height}_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const clearMaze = () => {
    const initialMaze = Array(height)
      .fill(null)
      .map(() => Array(width).fill(TILE_TYPES.FLOOR))
    setMaze(initialMaze)
  }

  const getTileColor = (tile: string) => {
    switch (tile) {
      case TILE_TYPES.WALL:
        return "#000000"
      case TILE_TYPES.GOLD:
        return "#ffd700"
      case TILE_TYPES.DOCK:
        return "#00ff88"
      default:
        return "#f5deb3"
    }
  }

  const getTileBorder = (tile: string) => {
    return "none"
  }

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-slate-900/80 border-b border-cyan-500/30 px-6 py-4 space-y-3">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Maze Builder
          </h1>
          <p className="text-slate-400 text-sm">Design your own custom maze</p>
        </div>

        {/* Maze Dimensions */}
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-slate-300 font-bold">Width (X)</label>
            <input
              type="number"
              min="5"
              max="30"
              value={width}
              onChange={(e) => {
                const val = Math.max(5, Math.min(30, Number.parseInt(e.target.value) || 5))
                setWidth(val)
              }}
              className="w-full px-3 py-1 bg-slate-700/50 border border-cyan-500/50 rounded text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs text-slate-300 font-bold">Height (Y)</label>
            <input
              type="number"
              min="5"
              max="30"
              value={height}
              onChange={(e) => {
                const val = Math.max(5, Math.min(30, Number.parseInt(e.target.value) || 5))
                setHeight(val)
              }}
              className="w-full px-3 py-1 bg-slate-700/50 border border-cyan-500/50 rounded text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Tile Selection - Inline */}
          <div className="flex gap-2">
            {Object.entries(TILE_TYPES).map(([name, type]) => (
              <button
                key={type}
                onClick={() => setSelectedTile(type)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all border-2 ${
                  selectedTile === type
                    ? "border-cyan-400 shadow-lg shadow-cyan-400/50"
                    : "border-slate-600 hover:border-cyan-400/50"
                }`}
                style={{
                  backgroundColor: getTileColor(type),
                  color: ["#", "G"].includes(type) ? "#000" : "#fff",
                  borderColor: selectedTile === type ? getTileColor(type) : undefined,
                }}
                title={name}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <button
            onClick={clearMaze}
            className="px-4 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded transition-all"
          >
            Clear
          </button>
          <button
            onClick={saveMaze}
            className={`px-4 py-1 text-sm font-bold rounded transition-all ${
              savedMaze
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
            }`}
          >
            {savedMaze ? "✓ Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Maze Grid - Scrollable Center */}
      <div className="flex-1 overflow-auto flex items-start justify-center px-8 py-8">
        <div
          className="grid gap-0 bg-cream p-1 border-4 border-black"
          style={{
            gridTemplateColumns: `repeat(${width}, 1fr)`,
            gap: "0px",
            backgroundColor: "#f5deb3",
          }}
        >
          {maze.map((row, rowIdx) =>
            row.map((tile, colIdx) => (
              <button
                key={`${rowIdx}-${colIdx}`}
                onClick={() => toggleTile(rowIdx, colIdx)}
                className="transition-all hover:opacity-80"
                style={{
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                  backgroundColor: getTileColor(tile),
                  border: getTileBorder(tile),
                  cursor: "pointer",
                  borderRadius: "0px",
                }}
                title={`${tile}`}
              />
            )),
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="flex-shrink-0 bg-slate-700/50 rounded-lg mx-6 mb-4 p-4 border border-cyan-500/20">
        <div className="text-sm text-slate-300 space-y-1">
          <p>
            <strong className="text-cyan-400">Tips:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Set maze dimensions (5-30 tiles)</li>
            <li>Click tiles to change them</li>
            <li>Add exactly ONE Dock (D) where players return</li>
            <li>Add at least ONE Gold (G) to collect</li>
            <li>Use Walls (#) to create the maze challenge</li>
          </ul>
        </div>
      </div>

      {/* Maze Array Notification Modal */}
      {showMazeArray && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border-2 border-cyan-400 rounded-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col space-y-4">
            <h2 className="text-xl font-bold text-cyan-400">Maze Array</h2>
            <div className="bg-slate-900 rounded p-4 overflow-auto flex-1">
              <pre className="text-xs text-slate-200 whitespace-pre-wrap break-words font-mono">
                {JSON.stringify(getMazeArray(), null, 2)}
              </pre>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyMazeToClipboard}
                className={`flex-1 px-4 py-2 rounded font-bold transition-all ${
                  copied ? "bg-green-500 text-white" : "bg-cyan-500 hover:bg-cyan-400 text-white"
                }`}
              >
                {copied ? "✓ COPIED!" : "COPY ARRAY"}
              </button>
              <button
                onClick={exportMazeAsJSON}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded transition-all"
              >
                EXPORT JSON
              </button>
              <button
                onClick={() => setShowMazeArray(false)}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back to Game */}
      {savedMaze && (
        <Link
          href="/"
          className="block w-full px-6 py-3 mx-0 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-lg transition-all text-center shadow-lg hover:shadow-green-500/50"
        >
          START GAME WITH YOUR MAZE
        </Link>
      )}

      <Link
        href="/"
        className="block w-full px-6 py-3 text-cyan-400 hover:text-cyan-300 text-center font-bold transition-all"
      >
        ← Back to Game
      </Link>
    </div>
  )
}

export default MazeBuilder
