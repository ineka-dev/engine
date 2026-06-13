import type { Engine, SystemFunction } from '../core/Engine'
import type { TraitDefinition, TraitInstance } from '../core/Trait'
import { NodeId } from '../types/node'

type ExtractInstance<T> = {
  [K in keyof T]: T[K] extends TraitDefinition<infer S> ? TraitInstance<S> : never
}

/**
 * A higher-order function that provides a clean Developer Experience 
 * over the high-performance Data-Oriented ECS arrays.
 * 
 * Automatically runs a query for the provided traits and executes the callback for each matching node.
 * It provides direct, zero-cost access to the raw Flat Array memory underneath (`transform.data.x[nodeId]`).
 * 
 * @example
 * ```ts
 * export const movementSystem = defineSystem(
 *   [Transform, Velocity],
 *   (engine, delta, nodeId, transform, velocity) => {
 *     transform.data.x[nodeId] += velocity.data.x[nodeId] * delta
 *     transform.data.y[nodeId] += velocity.data.y[nodeId] * delta
 *   }
 * )
 * ```
 */
export function defineSystem<T extends TraitDefinition<any>[]>(
  defs: [...T],
  callback: (engine: Engine, delta: number, nodeId: NodeId, ...traits: ExtractInstance<T>) => void
): SystemFunction {
  let isInitialized = false
  let instances: any[] = []

  return (engine, delta) => {
    const q = engine.query(...defs)
    if (q.activeNodeCount === 0) return

    if (!isInitialized) {
      instances = defs.map(def => engine.get(def))
      isInitialized = true
    }

    for (let i = 0; i < q.activeNodeCount; i++) {
      const id = q.activeNodes[i]
      callback(engine, delta, id, ...(instances as any))
    }
  }
}
