# 🐭 MazeScape: Tom & Jerry Maze Chase 🧀

<div align="center">

![Game Banner](https://img.shields.io/badge/Game-Tom%20%26%20Jerry%20Chase-purple?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![Phaser](https://img.shields.io/badge/Phaser-3-blue?style=for-the-badge&logo=phaser)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

**A thrilling maze chase game where Jerry must collect cheese while escaping from Tom!**

[Play Now](#-quick-start) • [Features](#-features) • [Screenshots](#-screenshots) • [Contributing](#-contributing)

</div>

---

## 🎮 About

**MazeScape** is an exciting browser-based maze game featuring the iconic Tom & Jerry duo! Navigate through brick-walled mazes, collect delicious cheese, and race against time before Tom catches you. Built with modern web technologies for a smooth, responsive gaming experience.

### 🌟 Why This Game Rocks

- 🐱 **Classic Chase**: Experience the timeless Tom & Jerry dynamic in a maze setting
- 🧀 **Strategic Gameplay**: Balance speed vs. cheese collection for maximum score
- ⏱️ **Time Pressure**: Tom spawns after 5 seconds - can you escape in time?
- 🎨 **Beautiful Design**: Clean white & purple UI with custom textures
- 🏆 **Competitive**: Real-time leaderboard to compete with friends
- 🎯 **Custom Mazes**: Built-in maze builder to create your own challenges

---

## ✨ Features

### 🎯 Core Gameplay
- **Dynamic Maze System**: Navigate through brick-textured walls in a cream-colored maze
- **Smart AI**: Tom uses pathfinding to chase Jerry through the maze
- **Scoring System**: `100 base points + (10 × coins) - time in seconds`
- **Two Win Conditions**: 
  - Reach the finish dock for full score
  - Get caught by Tom and keep only coin points

### 🛠️ Technical Features
- **Next.js 16** with App Router
- **Phaser 3** game engine for smooth 60 FPS gameplay
- **TypeScript** for type-safe code
- **Responsive Design**: Adapts to any screen size
- **Local Leaderboard**: Persistent score tracking
- **Custom Maze Builder**: Create and save your own mazes

### 🎨 Visual Design
- Clean **black, white & purple** color scheme
- Custom **brick wall textures**
- **Tom & Jerry character sprites**
- **Cheese coin graphics**
- Beautiful **background imagery**
- Smooth **animations** and transitions

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mazescape.git

# Navigate to project directory
cd mazescape

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Run development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and start playing!

---

## 🎮 How to Play

### Controls
- **WASD** or **Arrow Keys**: Move Jerry
- **Mouse**: Navigate menus

### Objective
1. **Start at the bottom dock** (light purple)
2. **Collect cheese** scattered throughout the maze (+10 points each)
3. **Reach the top dock** (dark purple) before Tom catches you!
4. **Avoid Tom** who spawns after 5 seconds and chases you

### Scoring
```
Final Score = 100 (base) + (Coins × 10) - Time (seconds)
```

**Example:**
- Completed in 30 seconds with 3 coins: `100 + 30 - 30 = 100 points`
- Caught by Tom with 2 coins: `0 + 20 = 20 points`

---

## 📸 Screenshots

### Main Menu
Clean, minimalistic design with bold typography

### Gameplay
Navigate through brick mazes while Tom chases you!

### Leaderboard
Compete for the top spot with friends

---

## 🏗️ Project Structure

```
mazescape/
├── app/
│   ├── page.tsx           # Main game component
│   ├── makemaze/
│   │   └── page.tsx       # Maze builder
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── public/
│   ├── jerry.png          # Player character
│   ├── tom.png            # Monster character
│   ├── coin.png           # Cheese collectible
│   ├── brick.avif         # Wall texture
│   └── background.jpg     # Background image
└── README.md
```

---

## 🎨 Customization

### Create Your Own Maze

1. Navigate to `/makemaze` route
2. Set maze dimensions (5-30 tiles)
3. Click tiles to place:
   - **Walls (#)**: Brick obstacles
   - **Floor (.)**: Walkable paths
   - **Coins (G)**: Collectibles
   - **Docks (D)**: Start/finish points
4. Save and play your custom maze!

### Modify Game Settings

Edit `app/page.tsx` to customize:
- **Monster spawn time**: Change `gameState.gameTime >= 5`
- **Player speed**: Adjust `speed = 150`
- **Monster speed**: Modify `monsterSpeed = 100`
- **Scoring formula**: Update score calculation

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router |
| **Phaser 3** | 2D game engine |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **Local Storage** | Score persistence |

---

## 🤝 Contributing

We love contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Ideas for Contributions
- 🎵 Add background music and sound effects
- 🌍 Multiple maze levels with increasing difficulty
- 👥 Multiplayer mode
- 🏅 Achievement system
- 📱 Mobile touch controls
- 🎨 More character skins
- 🧩 Power-ups and special items

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Tom & Jerry** characters inspired by the classic cartoon
- **Phaser** community for excellent documentation
- **Next.js** team for the amazing framework
- All contributors who help improve this game!

---

## 📞 Contact

Have questions or suggestions? Feel free to:
- 🐛 [Open an issue](https://github.com/yourusername/mazescape/issues)
- 💬 [Start a discussion](https://github.com/yourusername/mazescape/discussions)
- ⭐ Star this repo if you enjoyed the game!

---

<div align="center">

**Made with ❤️ and lots of cheese 🧀**

[⬆ Back to Top](#-mazescape-tom--jerry-maze-chase-)

</div>
