import { Engine, createNode, Transform } from '@ineka/engine'
import { Collider } from '../traits/Collider'
import { Wall } from '../traits/Tag'

export function createWalls(engine: Engine, width: number, height: number) {
  const wallThickness = 100

  // Top wall
  createNode(engine, [
    Transform({ x: width / 2, y: -wallThickness / 2 }),
    Collider({ width, height: wallThickness }),
    Wall()
  ])

  // Left wall
  createNode(engine, [
    Transform({ x: -wallThickness / 2, y: height / 2 }),
    Collider({ width: wallThickness, height }),
    Wall()
  ])

  // Right wall
  createNode(engine, [
    Transform({ x: width + wallThickness / 2, y: height / 2 }),
    Collider({ width: wallThickness, height }),
    Wall()
  ])

  // Bottom wall (death zone)
  createNode(engine, [
    Transform({ x: width / 2, y: height + wallThickness / 2 }),
    Collider({ width, height: wallThickness }),
    Wall()
  ])
}
