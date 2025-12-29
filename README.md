# Endless Runner Game

An endless arcade game inspired by Crossy Road, built with Three.js and TypeScript.

## Features

- **Grid-based movement** with smooth animations
- **Procedurally generated obstacles** for infinite gameplay
- **Score system** with distance tracking and multipliers
- **Responsive controls** - keyboard (WASD/Arrows) and touch/swipe support
- **Low-poly 3D graphics** with isometric camera view
- **Web-first** - runs in any modern browser

## Tech Stack

- **Three.js** - 3D rendering and WebGL
- **TypeScript** - Type-safe game development
- **Vite** - Fast development and optimized builds
- **Howler.js** - Audio management (to be integrated)
- **Zustand** - State management (to be integrated)

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The game will open automatically at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
crossyroad/
├── src/
│   ├── core/           # Core game engine
│   │   └── Game.ts     # Main game loop and scene management
│   ├── entities/       # Game entities
│   │   └── Player.ts   # Player character with movement
│   ├── systems/        # Game systems
│   │   ├── GridManager.ts      # Grid generation and management
│   │   ├── ObstacleManager.ts  # Obstacle spawning and collision
│   │   ├── InputManager.ts     # Keyboard and touch input
│   │   └── ScoreManager.ts     # Score calculation
│   ├── ui/             # UI components (to be added)
│   ├── utils/          # Utility functions (to be added)
│   ├── styles/         # CSS styles
│   │   └── main.css
│   └── main.ts         # Application entry point
├── public/
│   └── assets/         # Game assets (audio, models, textures)
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── prd.md              # Product Requirements Document
└── README.md
```

## Controls

### Desktop
- **W / Arrow Up** - Move forward
- **A / Arrow Left** - Move left
- **D / Arrow Right** - Move right
- **S / Arrow Down** - Move backward
- **Space** - Quick forward
- **ESC** - Pause

### Mobile
- **Swipe Up** - Move forward
- **Swipe Left** - Move left
- **Swipe Right** - Move right
- **Swipe Down** - Move backward
- **Tap** - Move forward

## Current Implementation Status

### ✅ Completed (Phase 1 - Core Prototype)
- [x] Basic Three.js scene setup with isometric camera
- [x] Player character with grid-based movement
- [x] Smooth movement animations (200ms as per PRD)
- [x] Input system (keyboard + touch/swipe)
- [x] Grid generation with chunking system
- [x] Basic obstacle system with collision detection
- [x] Score manager with multiplier system
- [x] UI/HUD layout (score, distance, coins)
- [x] Main menu, death screen, pause menu

### 🚧 In Progress (Phase 2 - Full Gameplay)
- [ ] Road obstacles with moving vehicles
- [ ] River obstacles (logs, lily pads, turtles)
- [ ] Train tracks with warning system
- [ ] Difficulty scaling based on distance
- [ ] Coin collection system
- [ ] Power-ups (shield, magnet, speed boost)

### 📋 Todo (Phase 3 - Progression)
- [ ] Character unlock system
- [ ] Local storage save system
- [ ] Achievement system
- [ ] Daily challenges
- [ ] Sound effects and music integration
- [ ] Visual effects (particles, trails)

### 📋 Todo (Phase 4 - Polish)
- [ ] Character models and animations
- [ ] Biome variations (grassland, desert, snow, urban)
- [ ] Audio implementation with Howler.js
- [ ] Tutorial and onboarding
- [ ] Performance optimizations
- [ ] Cross-browser testing

## Performance Targets

- **Desktop**: 60 FPS on mid-range hardware
- **Mobile**: 30+ FPS on 2020+ devices
- **Bundle Size**: <15 MB total (compressed)
- **Load Time**: <5 seconds to playable

## Development Guidelines

Based on the PRD specifications:

1. **Grid System**: All movement is grid-based (1 unit = 1 grid space)
2. **Movement Speed**: 200ms animation per grid move
3. **Camera**: Fixed isometric view (45-degree angle)
4. **Difficulty Scaling**:
   - Vehicle speed: +5% per 50m
   - Obstacle density: +10% per 100m
   - Score multiplier: +0.1x per 50m (cap at 3x)

## License

ISC

## Acknowledgments

Built based on the comprehensive PRD in [prd.md](./prd.md)
