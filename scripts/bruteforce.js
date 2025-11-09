// Brute Force Maze Solver
// Run this script once to find the optimal solution for the maze

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

// A* Pathfinding Algorithm
class PathFinder {
  static findPath(grid, start, end) {
    const rows = grid.length
    const cols = grid[0].length
    
    const openSet = []
    const closedSet = new Set()
    const cameFrom = new Map()
    
    const gScore = new Map()
    const fScore = new Map()
    
    const key = (p) => `${p.x},${p.y}`
    const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
    
    openSet.push(start)
    gScore.set(key(start), 0)
    fScore.set(key(start), heuristic(start, end))
    
    while (openSet.length > 0) {
      openSet.sort((a, b) => (fScore.get(key(a)) || Infinity) - (fScore.get(key(b)) || Infinity))
      const current = openSet.shift()
      
      if (current.x === end.x && current.y === end.y) {
        const path = []
        let temp = current
        while (temp) {
          path.unshift(temp)
          temp = cameFrom.get(key(temp))
        }
        return path
      }
      
      closedSet.add(key(current))
      
      const neighbors = [
        {x: current.x + 1, y: current.y},
        {x: current.x - 1, y: current.y},
        {x: current.x, y: current.y + 1},
        {x: current.x, y: current.y - 1},
      ]
      
      for (const neighbor of neighbors) {
        if (neighbor.x < 0 || neighbor.x >= cols || neighbor.y < 0 || neighbor.y >= rows) continue
        if (grid[neighbor.y][neighbor.x] === 1) continue
        if (closedSet.has(key(neighbor))) continue
        
        const tentativeGScore = (gScore.get(key(current)) || Infinity) + 1
        
        if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
          openSet.push(neighbor)
        } else if (tentativeGScore >= (gScore.get(key(neighbor)) || Infinity)) {
          continue
        }
        
        cameFrom.set(key(neighbor), current)
        gScore.set(key(neighbor), tentativeGScore)
        fScore.set(key(neighbor), tentativeGScore + heuristic(neighbor, end))
      }
    }
    
    return []
  }
  
  static getPermutations(arr) {
    if (arr.length <= 1) return [arr]
    const result = []
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
      const perms = this.getPermutations(rest)
      for (const perm of perms) {
        result.push([arr[i], ...perm])
      }
    }
    return result
  }
  
  static findOptimalPath(grid, start, coins, finish) {
    const allPaths = []
    const permutations = this.getPermutations(coins)
    
    console.log(`Testing ${permutations.length} coin collection orders...`)
    
    for (const coinOrder of permutations) {
      let currentPos = start
      let totalPath = [start]
      let totalDistance = 0
      let coinsCollected = 0
      
      for (const coin of coinOrder) {
        const path = this.findPath(grid, currentPos, coin)
        if (path.length === 0) break
        totalPath = totalPath.concat(path.slice(1))
        totalDistance += path.length - 1
        currentPos = coin
        coinsCollected++
      }
      
      const finalPath = this.findPath(grid, currentPos, finish)
      if (finalPath.length > 0) {
        totalPath = totalPath.concat(finalPath.slice(1))
        totalDistance += finalPath.length - 1
        
        // Calculate score: 100 base + 10 per coin - time (1 tile = ~0.4s at speed 150)
        const estimatedTime = totalDistance * 0.4
        const score = 100 + (coinsCollected * 10) - Math.round(estimatedTime)
        
        allPaths.push({
          path: totalPath,
          distance: totalDistance,
          coinsCollected,
          estimatedTime,
          score,
          coinOrder: coinOrder.map(c => `(${c.x},${c.y})`)
        })
      }
    }
    
    allPaths.sort((a, b) => b.score - a.score)
    return allPaths[0]
  }
}

// Parse maze
const grid = MAZE_MAP.map(row => row.split('').map(tile => tile === '#' ? 1 : 0))

let start = null
let finish = null
const coins = []
const docks = []

for (let y = 0; y < MAZE_MAP.length; y++) {
  for (let x = 0; x < MAZE_MAP[y].length; x++) {
    const tile = MAZE_MAP[y][x]
    if (tile === 'G') {
      coins.push({x, y})
    } else if (tile === 'D') {
      docks.push({x, y})
    }
  }
}

// Sort docks by Y (top = finish, bottom = start)
docks.sort((a, b) => a.y - b.y)
finish = docks[0]
start = docks[docks.length - 1]

console.log('Maze Analysis:')
console.log('Start:', start)
console.log('Finish:', finish)
console.log('Coins:', coins)
console.log('\nCalculating optimal path...\n')

const optimalSolution = PathFinder.findOptimalPath(grid, start, coins, finish)

console.log('\n=== OPTIMAL SOLUTION ===')
console.log('Score:', optimalSolution.score)
console.log('Time:', optimalSolution.estimatedTime.toFixed(2), 'seconds')
console.log('Coins Collected:', optimalSolution.coinsCollected)
console.log('Total Distance:', optimalSolution.distance, 'tiles')
console.log('Coin Order:', optimalSolution.coinOrder.join(' -> '))
console.log('\nPath (grid coordinates):')
console.log(JSON.stringify(optimalSolution.path, null, 2))

// Generate movement commands with diagonal optimization
console.log('\n=== MOVEMENT SEQUENCE (WITH DIAGONAL OPTIMIZATION) ===')
const movements = []
for (let i = 1; i < optimalSolution.path.length; i++) {
  const prev = optimalSolution.path[i - 1]
  const curr = optimalSolution.path[i]
  const dx = curr.x - prev.x
  const dy = curr.y - prev.y
  
  // Use diagonal movement when possible (faster due to glitch)
  if (dx !== 0 && dy !== 0) {
    // Diagonal movement
    const horizontal = dx > 0 ? 'RIGHT' : 'LEFT'
    const vertical = dy > 0 ? 'DOWN' : 'UP'
    movements.push(`${vertical}+${horizontal}`) // Simultaneous keys
  } else if (dx > 0) {
    movements.push('RIGHT')
  } else if (dx < 0) {
    movements.push('LEFT')
  } else if (dy > 0) {
    movements.push('DOWN')
  } else if (dy < 0) {
    movements.push('UP')
  }
}

console.log('Total Moves:', movements.length)
console.log('Sequence:', movements.join(', '))

// Export as JSON for use in the game
const exportData = {
  path: optimalSolution.path,
  movements: movements,
  score: optimalSolution.score,
  time: optimalSolution.estimatedTime,
  coins: optimalSolution.coinsCollected,
  distance: optimalSolution.distance
}

console.log('\n=== EXPORT FOR GAME ===')
console.log(JSON.stringify(exportData, null, 2))
