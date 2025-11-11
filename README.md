# 🧠 MazeScape: AI Maze Challenge 🧀

<div align="center">

![Game Banner](https://img.shields.io/badge/Game-MazeScape-green?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![Phaser](https://img.shields.io/badge/Phaser-3-blue?style=for-the-badge&logo=phaser)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

**A fast-paced AI vs. Human maze escape game — can you beat the algorithm?**

[Play Now](https://maze.adyanth.in) • [Features](#-features) • [Screenshots](#-screenshots) • [Contributing](#-contributing)

</div>

---

## 🎮 About

**MazeScape** is an open-source browser-based maze escape challenge where both AI and humans compete.  
The AI finds the **optimal escape path**, and on the `/record` page, a **human performs the same movements** — replicating the AI’s path to test human precision, reaction time, and efficiency.

Built using modern web technologies, MazeScape demonstrates how **AI consistently outperforms humans** in decision-making and execution speed, proving how automation can be both **cost-effective** and **highly scalable**.

### 🌟 Highlights

- 🤖 **AI Pathfinding**: The AI calculates the most efficient path through the maze.
- 🧍‍♂️ **Human Replay System**: Humans manually execute AI-found paths on `/record`.
- 🕒 **Time-Based Scoring**: Every second you take reduces your total score.
- 🧀 **Dynamic Mazes**: Collect cheese for bonus points in procedurally generated maps.
- 🏆 **Leaderboard**: Compare human and AI scores to see who escapes better.
- 🔍 **AI Review Mode**: Watch how perfectly the AI completed the maze.

---

## ✨ Features

### 🎯 Core Gameplay
- **Adaptive AI** – Tom (AI) uses optimized pathfinding algorithms to chase or escape.  
- **Scoring System** –  
  Final Score = 100 (base) + (Cheese × 10) - Time (seconds)  
- **Lose Condition** – If Tom catches you before reaching the exit, your score becomes:  
  Cheese Collected - Time Taken

### 🛠️ Technical Stack
- **Next.js 16** – Modern React framework with App Router  
- **Phaser 3** – Game engine for real-time maze rendering and physics  
- **TypeScript** – Strong typing and predictable behavior  
- **Tailwind CSS** – Clean and responsive design  
- **Local Storage** – Persistent leaderboard and user data  

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+  
- npm, yarn, or pnpm

### Installation
Clone the repository  
git clone https://github.com/adyanthm/mazescape.git  

Navigate to the project folder  
cd mazescape  

Install dependencies  
npm install  

Run the development server  
npm run dev  

Then open http://localhost:3000 in your browser.

---

## 🎮 How to Play

### Controls
- **WASD / Arrow Keys**: Move the player  
- **Mouse**: Navigate menus  

### Objective
1. Start from the **entry dock**  
2. **Collect cheese** scattered through the maze (+10 points each)  
3. **Reach the exit** before Tom (AI) catches you  
4. Every second reduces your score by 1 point  

### AI Comparison
After your run, visit the `/record` page to **watch how the AI completed the same maze**.  
You can see its path, timing, and performance versus your own.

---

## 🧠 Purpose

MazeScape isn’t just a game — it’s a **human vs. AI performance benchmark**.  
It showcases how AI’s optimized movement, reaction time, and decision-making give it an advantage, reinforcing the **efficiency and cost-effectiveness of intelligent automation**.

---

## 🛠️ Open Source Philosophy

### **Fully Open-Sourced. Fully Transparent.**
- Every part of MazeScape — from maze generation to AI logic — is open for review.  
- **No hidden algorithms**: All AI logic is public and inspectable.  
- Built for **education, research, and innovation**.  
- Hosted on **GitHub** for open collaboration and contributions.  

**→ Transparency builds trust.  
→ Collaboration drives innovation.**

---

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️, logic, and cheese 🧀**

[⬆ Back to Top](#-mazescape-ai-maze-challenge-)

</div>
