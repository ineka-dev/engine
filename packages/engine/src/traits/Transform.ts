import { defineTrait } from '../core/Trait'
import type { Engine } from '../core/Engine'
import type { NodeId } from '../types/node'

/**
 * Global Trait Definition for 2D transform data.
 * Contains both Local Space (Source of Truth) and World Space (Computed).
 * Uses `Float32Array` internally for Data-Oriented performance.
 */
export const Transform = defineTrait({
  // Local Coordinates (Source of Truth)
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  
  // World Coordinates (Read-Only Computed by transformPlugin)
  worldX: 0,
  worldY: 0,
  worldRotation: 0,
  worldScaleX: 1,
  worldScaleY: 1
})

/**
 * Sets a node's World Position.
 * Automatically calculates and assigns the exact Local Position required, based on the parent's World Transform.
 */
export function setWorldPosition(engine: Engine, nodeId: NodeId, worldX: number, worldY: number) {
  const transform = engine.get(Transform)
  if (!transform.hasNode(nodeId)) return

  const parentId = engine.graph.parent[nodeId]
  if (parentId === -1 || !transform.hasNode(parentId)) {
    transform.data.x[nodeId] = worldX
    transform.data.y[nodeId] = worldY
    return
  }

  // Inverse Parent Transform Calculation
  const px = transform.data.worldX[parentId]
  const py = transform.data.worldY[parentId]
  const pr = transform.data.worldRotation[parentId]
  const psx = transform.data.worldScaleX[parentId]
  const psy = transform.data.worldScaleY[parentId]

  // 1. Un-translate
  const dx = worldX - px
  const dy = worldY - py

  // 2. Un-rotate
  const cosR = Math.cos(pr)
  const sinR = Math.sin(pr)
  const lxScaled = dx * cosR + dy * sinR
  const lyScaled = -dx * sinR + dy * cosR

  // 3. Un-scale
  transform.data.x[nodeId] = lxScaled / (psx !== 0 ? psx : 1)
  transform.data.y[nodeId] = lyScaled / (psy !== 0 ? psy : 1)
}

/**
 * Sets a node's World Rotation.
 * Automatically calculates and assigns the exact Local Rotation required, based on the parent's World Transform.
 */
export function setWorldRotation(engine: Engine, nodeId: NodeId, worldRotation: number) {
  const transform = engine.get(Transform)
  if (!transform.hasNode(nodeId)) return

  const parentId = engine.graph.parent[nodeId]
  if (parentId === -1 || !transform.hasNode(parentId)) {
    transform.data.rotation[nodeId] = worldRotation
    return
  }

  transform.data.rotation[nodeId] = worldRotation - transform.data.worldRotation[parentId]
}
