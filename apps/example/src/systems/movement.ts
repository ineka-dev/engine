import { defineSystem, Transform, SystemFunction, Velocity } from '@ineka/engine'

export function movementSystem(): SystemFunction {
  return defineSystem(
    [Transform, Velocity],
    (engine, delta, nodeId, transform, velocity) => {
      transform.data.x[nodeId] += velocity.data.x[nodeId] * delta
      transform.data.y[nodeId] += velocity.data.y[nodeId] * delta
    }
  )
}
