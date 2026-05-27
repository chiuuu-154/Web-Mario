# Assignment 02 - Web Super Mario 

## Game Links
- **Firebase Hosting URL:** https://web-mario-ae9be.web.app

---

## Game Features & Scoring Checklist

### 1. Complete Game Process (5%)
- Smooth scene transitions: `StartMenu` -> `LevelSelect` -> `GameView`.
- Proper end-game flow: Implemented both **Level Clear** (touching the flagpole) and **Game Over** (losing all lives or falling into the abyss) mechanisms, routing back to the Level Select scene seamlessly.

### 2. Basic-Rules (50%)
- **Movement:** Box2D physics-based linear velocity control for walking, running, and jumping with appropriate gravity and inertia.
- **Interactions:** Mario can collect coins, hit question blocks, and consume mushrooms to grow big.
- **Enemy:** Goomba and piranha. 
- **Combat:** Mario can stomp on Goombas to defeat them.
- **Damage System:** Taking damage shrinks Mario back to normal size. Taking damage while small or falling off the map results in a life lost.

### 3. Animations (10%)
- **Mario Animations:** Idle, Run, Jump, Grow, Shrink.
- **Enemy Animations:** Goomba's walking, squashed and piranha's movement.

### 4. Sound Effects (10%)
- **BGM:** Unique background music for different scenes with auto-stop mechanisms upon level completion or death.
- **SFX:** Implemented classic sound effects perfectly synced with actions: Jump, Coin Collect, Stomp Enemy, Power-up (Mushroom), Power-down (Pipe/Damage), Flagpole Slide, and Level Clear.

### 5. UI (10%)
- **Interactive UI Panels:** Designed a pixel-art style Level Select screen and a Leaderboard panel.

---

## ⭐ Bonus Features (10%)

**1. Firebase Cloud Integration (Auth & Realtime Database)**
- **Cloud Save & Leaderboard:** Player's coins and highest scores are automatically synchronized to Firebase upon Level Clear or Game Over (Arcade style).
- **Realtime Top 10 Ranking:** Built a global leaderboard that fetches data.