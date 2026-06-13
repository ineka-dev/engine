import { Engine, createNode, Transform, Velocity } from '@ineka/engine'
import { Render } from '@ineka/pixi'
import * as PIXI from 'pixi.js'
import { Collider } from '../traits/Collider'
import { Ball } from '../traits/Tag'

export function createBall(engine: Engine, x: number, y: number) {
  const graphics = new PIXI.Graphics()
  graphics.circle(0, 0, 8)
  graphics.fill(0xff0000)

  return createNode(engine, [
    Transform({ x, y }),
    Render({ container: graphics }),
    Velocity({ x: 300, y: -300 }),
    Collider({ width: 16, height: 16 }),
    Ball()
  ])
}
