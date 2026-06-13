import type { Engine } from '../core/Engine'
import type { NodeId } from '../types/node'
import type { TraitInitializer } from '../core/Trait'

/**
 * Creates a new node in the engine's Data-Oriented Graph.
 * @example
 * ```ts
 * const player = createNode(engine, [
 *   Transform({ x: 0, y: 0 }),
 *   Velocity({ x: 5, y: 5 })
 * ])
 * ```
 
 * @param engine The engine instance.
 * @param traits Optional array of Trait initializers to compose the node.
 * @returns The typed integer ID of the new node.
 * */
export function createNode(engine: Engine, traits?: TraitInitializer[]): NodeId {
  const nodeId = engine.graph.createNode()
  if (traits) {
    for (let i = 0; i < traits.length; i++) {
      traits[i](engine, nodeId)
    }
  }
  return nodeId
}

/**
 * Attaches a child node to a parent node.
 * @example
 * ```ts
 * const parent = createNode(engine)
 * const child = createNode(engine)
 * addChild(engine, parent, child)
 * ```
 
 * @param engine The engine instance.
 * @param parentId The integer ID of the parent node.
 * @param childId The integer ID of the child node.
 * */
export function addChild(engine: Engine, parentId: NodeId, childId: NodeId): void {
  engine.graph.addChild(parentId, childId)
}

/**
 * Unlinks a child node from its parent.
 * @example
 * ```ts
 * removeChild(engine, parent, child)
 * ```
 
 * @param engine The engine instance.
 * @param parentId The integer ID of the parent node.
 * @param childId The integer ID of the child node to remove.
 * */
export function removeChild(engine: Engine, parentId: NodeId, childId: NodeId): void {
  engine.graph.removeChild(parentId, childId)
}

/**
 * Destroys a node and its children recursively, freeing their IDs for recycling.
 * @example
 * ```ts
 * destroyNode(engine, enemyId)
 * ```
 
 * @param engine The engine instance.
 * @param nodeId The integer ID of the node to destroy.
 * */
export function destroyNode(engine: Engine, nodeId: NodeId): void {
  engine.graph.destroyNode(nodeId)
}

/**
 * Retrieves all direct children IDs of a given node (Allocates an Array).
 * Consider using `forEachChild` for zero-allocation loops.
 * @example
 * ```ts
 * const children = getChildren(engine, parent)
 * console.log(`Parent has ${children.length} children`)
 * ```
 
 * @param engine The engine instance.
 * @param nodeId The integer ID of the parent node.
 * @returns An array of child node IDs.
 * */
export function getChildren(engine: Engine, nodeId: NodeId): NodeId[] {
  const children: NodeId[] = []
  let child = engine.graph.firstChild[nodeId]
  while (child !== -1) {
    children.push(child)
    child = engine.graph.nextSibling[child]
  }
  return children
}

/**
 * Zero-allocation iteration over a node's direct children.
 * Highly recommended for tight Data-Oriented game loops.
 * @example
 * ```ts
 * forEachChild(engine, parentId, (childId) => {
 *   // Fast, zero-allocation loop
 *   console.log(childId)
 * })
 * ```
 
 * @param engine The engine instance.
 * @param nodeId The parent node ID.
 * @param callback The function to execute for each child.
 * */
export function forEachChild(engine: Engine, nodeId: NodeId, callback: (child: NodeId) => void): void {
  let child = engine.graph.firstChild[nodeId]
  while (child !== -1) {
    callback(child)
    child = engine.graph.nextSibling[child]
  }
}
