import { SystemFunction, Transform, destroyNode } from '@ineka/engine'
import { play } from '@ineka/howler'
import { Velocity } from '@ineka/engine'
import { Collider } from '../traits/Collider'
import { Ball, Brick, Paddle, Wall } from '../traits/Tag'

function AABB(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
  return x1 - w1 / 2 < x2 + w2 / 2 &&
         x1 + w1 / 2 > x2 - w2 / 2 &&
         y1 - h1 / 2 < y2 + h2 / 2 &&
         y1 + h1 / 2 > y2 - h2 / 2
}

export function collisionSystem(): SystemFunction {
  return (engine, delta) => {
    const balls = engine.query(Transform, Velocity, Collider, Ball)
    const colliders = engine.query(Transform, Collider)

    for (let i = 0; i < balls.activeNodeCount; i++) {
      const ballId = balls.activeNodes[i]

      const ballTransform = balls.traits[0]
      const ballVelocity = balls.traits[1]
      const ballCollider = balls.traits[2]

      let bouncedX = false
      let bouncedY = false

      for (let j = 0; j < colliders.activeNodeCount; j++) {
        const otherId = colliders.activeNodes[j]
        if (ballId === otherId) continue // don't collide with self

        const otherTransform = colliders.traits[0]
        const otherCollider = colliders.traits[1]

        // Skip if node was destroyed this frame by a previous collision
        if (!otherTransform.hasNode(otherId)) continue

        const isColliding = AABB(
          ballTransform.data.x[ballId], ballTransform.data.y[ballId], ballCollider.data.width[ballId], ballCollider.data.height[ballId],
          otherTransform.data.x[otherId], otherTransform.data.y[otherId], otherCollider.data.width[otherId], otherCollider.data.height[otherId]
        )

        if (isColliding) {
          // Determine collision side based on minimum penetration depth
          const dx = ballTransform.data.x[ballId] - otherTransform.data.x[otherId]
          const dy = ballTransform.data.y[ballId] - otherTransform.data.y[otherId]
          const width = (ballCollider.data.width[ballId] + otherCollider.data.width[otherId]) / 2
          const height = (ballCollider.data.height[ballId] + otherCollider.data.height[otherId]) / 2
          
          const overlapX = width - Math.abs(dx)
          const overlapY = height - Math.abs(dy)

          let collisionSide = ''
          if (overlapX < overlapY) {
            collisionSide = dx > 0 ? 'right' : 'left'
          } else {
            collisionSide = dy > 0 ? 'bottom' : 'top'
          }

          // Resolve penetration and bounce
          if (collisionSide === 'left') {
            if (!bouncedX) { ballVelocity.data.x[ballId] *= -1; bouncedX = true; }
            ballTransform.data.x[ballId] = otherTransform.data.x[otherId] - width
          } else if (collisionSide === 'right') {
            if (!bouncedX) { ballVelocity.data.x[ballId] *= -1; bouncedX = true; }
            ballTransform.data.x[ballId] = otherTransform.data.x[otherId] + width
          } else if (collisionSide === 'top') {
            if (!bouncedY) { ballVelocity.data.y[ballId] *= -1; bouncedY = true; }
            ballTransform.data.y[ballId] = otherTransform.data.y[otherId] - height
          } else if (collisionSide === 'bottom') {
            if (!bouncedY) { ballVelocity.data.y[ballId] *= -1; bouncedY = true; }
            ballTransform.data.y[ballId] = otherTransform.data.y[otherId] + height
          }

          // Handle Object Reactions
          if (engine.get(Brick).hasNode(otherId)) {
            // Destroy the brick node!
            destroyNode(engine, otherId)
            play(engine, ballId)
          } else if (engine.get(Wall).hasNode(otherId)) {
            // If it hits the bottom wall, game over (reset ball)
            if (otherTransform.data.y[otherId] > 600) { // Screen height is ~720
              ballTransform.data.x[ballId] = 640
              ballTransform.data.y[ballId] = 360
              ballVelocity.data.x[ballId] = 300
              ballVelocity.data.y[ballId] = -300
            } else {
              play(engine, ballId)
            }
          } else if (engine.get(Paddle).hasNode(otherId)) {
            // Paddle hit
            play(engine, ballId)
          }
        }
      }
    }
  }
}
