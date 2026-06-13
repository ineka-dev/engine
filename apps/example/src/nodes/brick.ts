import { Engine, createNode } from '@ineka/engine'
import { Transform } from '@ineka/engine'
import { Render } from '@ineka/pixi'
import { Graphics } from 'pixi.js'
import { Collider } from '../traits/Collider'
import { Brick } from '../traits/Tag'

export function createBrick(engine: Engine, x: number, y: number, w: number, h: number) {
  const g = new Graphics().rect(-w / 2, -h / 2, w, h).fill({ color: 0x00ff00 })
  
  return createNode(engine, [
    Transform({ x, y }),
    Render({ container: g }),
    Collider({ width: w, height: h }),
    Brick()
  ])
}

export function createBricksLevel(engine: Engine) {
  const rows = 5
  const cols = 10
  const brickWidth = 60
  const brickHeight = 20
  const padding = 10
  const offsetX = 80
  const offsetY = 50

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * (brickWidth + padding)
      const y = offsetY + r * (brickHeight + padding)
      createBrick(engine, x, y, brickWidth, brickHeight)
    }
  }
}
