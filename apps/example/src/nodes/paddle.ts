import { Engine, createNode } from '@ineka/engine'
import { Transform } from '@ineka/engine'
import { Render } from '@ineka/pixi'
import { Graphics } from 'pixi.js'
import { Collider } from '../traits/Collider'
import { Paddle } from '../traits/Tag'

export function createPaddle(engine: Engine, screenWidth: number, screenHeight: number) {
  const g = new Graphics().rect(-50, -10, 100, 20).fill({ color: 0xffffff })
  
  return createNode(engine, [
    Transform({ x: screenWidth / 2, y: screenHeight - 50 }),
    Render({ container: g }),
    Collider({ width: 100, height: 20 }),
    Paddle()
  ])
}
