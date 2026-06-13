import { Engine } from '@ineka/engine'
import { pixiPlugin } from '@ineka/pixi'
import { keyboardPlugin } from '@ineka/keyboard'
import { howlerPlugin } from '@ineka/howler'
import * as PIXI from 'pixi.js'
import { defineSystem, Transform, Velocity } from '@ineka/engine'

import { createPaddle } from './nodes/paddle'
import { createBall } from './nodes/ball'
import { createBricksLevel } from './nodes/brick'
import { createWalls } from './nodes/walls'

import { movementSystem } from './systems/movement'
import { playerInputSystem } from './systems/playerInput'
import { collisionSystem } from './systems/collision'

async function main() {
  const width = 800
  const height = 600

  // Setup standard PixiJS Application
  const app = new PIXI.Application()
  await app.init({ width, height, backgroundColor: 0x1099bb })
  document.body.appendChild(app.canvas)

  // Setup Ineka Engine
  const engine = new Engine({
    container: 'body'
  })

  // 1. Provision the Engine with Core Plugins
  engine.use(pixiPlugin({ app }))
  engine.use(howlerPlugin())
  engine.use(keyboardPlugin())

  // 2. Add Game Logic Systems (run on fixed-rate logic ticks)
  engine.addSystem('fixed-step', playerInputSystem(width))
  engine.addSystem('fixed-step', movementSystem())
  engine.addSystem('fixed-step', collisionSystem())

  // 3. Create nodes (Level, Walls, Player, Ball)
  createWalls(engine, width, height)
  createBricksLevel(engine)
  createPaddle(engine, width / 2, height - 30)
  createBall(engine, width / 2, height - 60)

  // Start the engine loop
  engine.run()
}

main()
