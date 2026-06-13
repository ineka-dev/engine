import type { Engine } from '../core/Engine'
import type { TraitDefinition, TraitDataSchema } from '../core/Trait'

/**
 * Checks if a Node has a specific Trait.
 * 
 * @example
 * ```ts
 * if (hasTrait(engine, nodeId, Render)) { ... }
 * ```
 
 * @remarks This helper is purely syntactic sugar. It performs a Map lookup under the hood to get the TraitInstance.
 * For extremely high-performance scenarios (e.g. nested inner loops inside a System running at 60fps),
 * this introduces unnecessary overhead. In those hot paths, you should cache the `TraitInstance` outside the loop 
 * and call `.hasNode(nodeId)` directly.
 * */
export function hasTrait<T extends TraitDefinition<any>>(engine: Engine, nodeId: number, def: T): boolean {
  return engine.get(def).hasNode(nodeId)
}

/**
 * Adds a Trait to a Node dynamically.
 * Note: If the trait has required dependencies, this will throw an error if the node lacks them.
 * 
 * @example
 * ```ts
 * addTrait(engine, nodeId, Velocity, { x: 10, y: 0 })
 * ```
 */
export function addTrait<T extends TraitDataSchema>(engine: Engine, nodeId: number, def: TraitDefinition<T>, initial?: Partial<T>): void {
  engine.get(def).addNode(nodeId, initial)
}

/**
 * Removes a Trait from a Node dynamically.
 * This will also immediately and correctly update any O(1) cached ECS queries in the engine.
 * 
 * @example
 * ```ts
 * removeTrait(engine, nodeId, Collider)
 * ```
 */
export function removeTrait<T extends TraitDefinition<any>>(engine: Engine, nodeId: number, def: T): void {
  engine.get(def).removeNode(nodeId)
}
