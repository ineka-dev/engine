import { Transform, Velocity, SystemFunction, defineSystem } from '@ineka/engine'
import { isKeyDown } from '@ineka/keyboard'
import { Paddle } from '../traits/Tag'

export const playerInputSystem = (screenWidth: number): SystemFunction => {
  const PADDLE_SPEED = 500
  const PADDLE_WIDTH = 100

  return defineSystem(
    [Transform, Paddle],
    (engine, delta, nodeId, transform) => {
      if (isKeyDown(engine, 'A') || isKeyDown(engine, 'LEFT')) {
        transform.data.x[nodeId] -= PADDLE_SPEED * delta
      }
      if (isKeyDown(engine, 'D') || isKeyDown(engine, 'RIGHT')) {
        transform.data.x[nodeId] += PADDLE_SPEED * delta
      }

      // Clamp to bounds
      if (transform.data.x[nodeId] < PADDLE_WIDTH / 2) transform.data.x[nodeId] = PADDLE_WIDTH / 2
      if (transform.data.x[nodeId] > screenWidth - PADDLE_WIDTH / 2) transform.data.x[nodeId] = screenWidth - PADDLE_WIDTH / 2
    }
  )
}
