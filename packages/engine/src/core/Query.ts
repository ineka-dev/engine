import type { Engine } from './Engine'
import type { TraitDefinition, TraitInstance } from './Trait'
import { NodeId, getNodeIdIndex } from '../types/node'

type MapInstances<T extends any[]> = {
  [K in keyof T]: T[K] extends TraitDefinition<infer S> ? TraitInstance<S> : never
}

/**
 * A cached, reactive intersection of multiple traits.
 * The engine dynamically keeps this up-to-date in O(1) time.
 * 
 * @example
 * ```ts
 * const movingObjects = engine.query(Transform, Velocity)
 * for (let i = 0; i < movingObjects.activeNodeCount; i++) {
 *   const id = movingObjects.activeNodes[i]
 *   // Read raw values via the traits tuple
 *   const x = movingObjects.traits[0].data.x[id]
 * }
 * ```
 */
export class Query<T extends TraitDefinition<any>[]> {
  public engine: Engine
  public defs: T
  /** Tuple containing the raw instantiated Trait memory buffers in the exact order requested. */
  public traits: MapInstances<T>
  
  public activeNodes: NodeId[]
  /** @internal */
  public sparse: Int32Array
  /** The number of active nodes currently matching this query. */
  public activeNodeCount: number = 0

  private _traitIds: number[]
  private _masks: number[] = []

  constructor(engine: Engine, defs: T) {
    this.engine = engine
    this.defs = defs
    this._traitIds = defs.map(d => d.id)

    // Fetch instantiated memory arrays
    this.traits = defs.map(def => engine.get(def)) as unknown as MapInstances<T>
    
    // Compute the bitmask chunks for this query
    let maxChunk = 0
    for (let i = 0; i < this._traitIds.length; i++) {
      const chunk = Math.floor(this._traitIds[i] / 32)
      if (chunk > maxChunk) maxChunk = chunk
    }
    this._masks = new Array(maxChunk + 1).fill(0)
    for (let i = 0; i < this._traitIds.length; i++) {
      const id = this._traitIds[i]
      const chunk = Math.floor(id / 32)
      const bit = id % 32
      this._masks[chunk] |= (1 << bit)
    }
    
    const capacity = engine.graph.maxNodes
    this.activeNodes = new Array(capacity).fill(-1)
    this.sparse = new Int32Array(capacity).fill(-1)

    this._evaluateInitial()
  }

  private _evaluateInitial() {
    const traitsArray = this.traits as unknown as TraitInstance<any>[]
    if (traitsArray.length === 0) return

    let minTrait = traitsArray[0]
    for (let i = 1; i < traitsArray.length; i++) {
      if (traitsArray[i].activeNodeCount < minTrait.activeNodeCount) {
        minTrait = traitsArray[i]
      }
    }

    for (let i = 0; i < minTrait.activeNodeCount; i++) {
      const nodeId = minTrait.activeNodes[i]
      const index = getNodeIdIndex(nodeId)
      
      let hasAll = true
      for (let j = 0; j < this._masks.length; j++) {
        if ((this.engine.signatures[j][index] & this._masks[j]) !== this._masks[j]) {
          hasAll = false
          break
        }
      }
      if (hasAll) {
        this._addNodeUnchecked(nodeId)
      }
    }
  }

  private _addNodeUnchecked(nodeId: NodeId) {
    const activeIndex = this.activeNodeCount
    this.activeNodes[activeIndex] = nodeId
    const index = getNodeIdIndex(nodeId)
    this.sparse[index] = activeIndex
    this.activeNodeCount++
  }

  /** @internal */
  public onTraitAdded(nodeId: NodeId, traitId: number) {
    if (!this._traitIds.includes(traitId)) return
    
    const index = getNodeIdIndex(nodeId)
    if (this.sparse[index] !== -1) return // Already in query

    for (let i = 0; i < this._masks.length; i++) {
      if ((this.engine.signatures[i][index] & this._masks[i]) !== this._masks[i]) {
        return
      }
    }

    this._addNodeUnchecked(nodeId)
  }

  /** @internal */
  public onTraitRemoved(nodeId: NodeId, traitId: number) {
    if (!this._traitIds.includes(traitId)) return
    
    const index = getNodeIdIndex(nodeId)
    if (this.sparse[index] === -1) return // Not in query

    for (let i = 0; i < this._masks.length; i++) {
      if ((this.engine.signatures[i][index] & this._masks[i]) !== this._masks[i]) {
        const sparseIndex = this.sparse[index]
        const lastActiveIndex = this.activeNodeCount - 1
        const lastNodeId = this.activeNodes[lastActiveIndex]

        this.activeNodes[sparseIndex] = lastNodeId
        this.sparse[getNodeIdIndex(lastNodeId)] = sparseIndex

        this.sparse[index] = -1
        this.activeNodeCount--
        return
      }
    }
  }

  /** @internal */
  public resize(newCapacity: number) {
    const newActive = new Array(newCapacity).fill(-1)
    for (let i = 0; i < this.activeNodes.length; i++) {
      newActive[i] = this.activeNodes[i]
    }
    this.activeNodes = newActive

    const newSparse = new Int32Array(newCapacity).fill(-1)
    newSparse.set(this.sparse)
    this.sparse = newSparse
  }
}
