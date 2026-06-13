import type { Engine } from './Engine'
import { NodeId, getNodeIdIndex } from '../types/node'
import { EngineError } from '../errors/EngineError'

export type TraitDataSchema = Record<string, any>

export type TraitArrays<T extends TraitDataSchema> = {
  [K in keyof T]: T[K] extends number ? Float32Array : T[K] extends boolean ? Uint8Array : Array<T[K]>
}

export type TraitInitializer = (engine: Engine, nodeId: NodeId) => void

export interface TraitConfig {
  requires?: TraitDefinition<any>[]
  autoAdd?: TraitDefinition<any>[]
}

let nextTraitId = 0

/**
 * A Stateless Trait Definition.
 * Defines the schema and dependencies of a data component globally.
 * 
 * @example
 * ```ts
 * const myDef: TraitDefinition<{ x: number }> = defineTrait({ x: 0 })
 * ```
 */
export interface TraitDefinition<T extends TraitDataSchema> {
  id: number
  schema: T
  requires: TraitDefinition<any>[]
  autoAdd: TraitDefinition<any>[]
  /** Factory function to attach the trait to a node during creation */
  (initial?: Partial<T>): TraitInitializer
}

/**
 * A Stateful Trait Instance bound to a specific Engine.
 * Manages the memory arrays and sparse set for tracking active nodes.
 * 
 * @example
 * ```ts
 * const velocityTrait = engine.get(Velocity)
 * velocityTrait.data.x[nodeId] = 5
 * ```
 */
export type TraitInstance<T extends TraitDataSchema> = {
  data: TraitArrays<T>
  def: TraitDefinition<T>

  /** Dense array of active Node IDs for ultra-fast iteration */
  activeNodes: Int32Array
  activeNodeCount: number
  /** Sparse array mapping a generic NodeIndex to its index in the _activeNodes array (O(1) lookups) */
  sparse: Int32Array
  
  resize: (newCapacity: number) => void
  addNode: (nodeId: NodeId, initial?: Partial<T>) => void
  removeNode: (nodeId: NodeId) => void

  /** 
   * Checks if a given Node possesses this Trait in O(1) time.
   * This is the recommended, high-performance method for checking traits inside hot inner-loops (like collision systems).
   * Ensure you cache the TraitInstance outside the loop, rather than calling `engine.get()` repeatedly.
   * For one-off checks outside of systems, the `hasTrait` helper is often more readable.
   */
  hasNode: (nodeId: NodeId) => boolean
}

/**
 * Defines a Data-Oriented Trait globally. 
 * This does not allocate memory. Memory is allocated lazily by the Engine when used.
 * 
 * @example <caption>Data Trait</caption>
 * ```ts
 * export const Velocity = defineTrait({ x: 0, y: 0 })
 * ```
 * 
 * @example <caption>Marker Trait (Zero Data)</caption>
 * ```ts
 * export const Enemy = defineTrait({})
 * ```
 * 
 * @example <caption>With Dependencies</caption>
 * ```ts
 * export const Physics = defineTrait({ mass: 1 }, { autoAdd: [Transform, Velocity] })
 * ```
 * 
 * @param schema The schema defining the data layout of the trait.
 * @param config Optional configuration for requires and autoAdd.
 * @returns A globally unique TraitDefinition.
 */
export function defineTrait<T extends TraitDataSchema>(
  schema: T,
  config?: TraitConfig
): TraitDefinition<T> {
  const id = nextTraitId++
  
  const def = function (initial?: Partial<T>): TraitInitializer {
    return (engine: Engine, nodeId: NodeId) => {
      for (let i = 0; i < def.autoAdd.length; i++) {
        const dep = def.autoAdd[i]
        if (!engine.get(dep).hasNode(nodeId)) {
          dep()(engine, nodeId)
        }
      }

      const traitInstance = engine.get(def)
      traitInstance.addNode(nodeId, initial)
    }
  } as TraitDefinition<T>

  def.id = id
  def.schema = schema
  def.requires = config?.requires || []
  def.autoAdd = config?.autoAdd || []

  return def
}

/**
 * Internal factory to instantiate a Trait's memory arrays for a specific Engine.
 * @internal
 */
export function instantiateTrait<T extends TraitDataSchema>(
  engine: Engine,
  def: TraitDefinition<T>
): TraitInstance<T> {
  const capacity = engine.graph.maxNodes
  const instance = {
    def: def,

    activeNodes: new Int32Array(capacity).fill(-1),
    sparse: new Int32Array(capacity).fill(-1),
    activeNodeCount: 0,
    data: {} as TraitArrays<T>
  } as unknown as TraitInstance<T>

  const traitData = instance.data as unknown as Record<string, any>

  for (const key in def.schema) {
    const defaultVal = def.schema[key]
    if (typeof defaultVal === 'number') {
      traitData[key] = new Float32Array(capacity).fill(defaultVal)
    } else if (typeof defaultVal === 'boolean') {
      traitData[key] = new Uint8Array(capacity).fill(defaultVal ? 1 : 0)
    } else {
      const arr = new Array(capacity)
      arr.fill(defaultVal)
      traitData[key] = arr
    }
  }

  instance.resize = (newCapacity: number) => {
    const newActive = new Int32Array(newCapacity).fill(-1)
    newActive.set(instance.activeNodes)
    instance.activeNodes = newActive

    const newSparse = new Int32Array(newCapacity).fill(-1)
    newSparse.set(instance.sparse)
    instance.sparse = newSparse

    for (const key in def.schema) {
      const oldArray = traitData[key]
      const defaultVal = def.schema[key]
      
      let newArray: any
      if (typeof defaultVal === 'number') {
        newArray = new Float32Array(newCapacity).fill(defaultVal)
        newArray.set(oldArray)
      } else if (typeof defaultVal === 'boolean') {
        newArray = new Uint8Array(newCapacity).fill(defaultVal ? 1 : 0)
        newArray.set(oldArray)
      } else {
        newArray = new Array(newCapacity).fill(defaultVal)
        for (let i = 0; i < oldArray.length; i++) {
          newArray[i] = oldArray[i]
        }
      }
      
      traitData[key] = newArray
    }
  }

  instance.addNode = (nodeId: NodeId, initial?: Partial<T>) => {
    if (instance.hasNode(nodeId)) return

    for (let i = 0; i < def.requires.length; i++) {
      if (!engine.get(def.requires[i]).hasNode(nodeId)) {
        throw new EngineError(engine, 'NODE:FAILURE', `Missing required trait on Node ${nodeId}`)
      }
    }

    const index = instance.activeNodeCount
    instance.activeNodes[index] = nodeId
    
    const nodeIndex = getNodeIdIndex(nodeId)
    instance.sparse[nodeIndex] = index
    instance.activeNodeCount++

    for (const key in def.schema) {
      const val = initial && initial[key] !== undefined ? initial[key] : def.schema[key]
      if (typeof val === 'boolean') {
        traitData[key][nodeIndex] = val ? 1 : 0
      } else {
        traitData[key][nodeIndex] = val
      }
    }

    engine.notifyQueryAdd(nodeId, def.id)
  }

  instance.removeNode = (nodeId: NodeId) => {
    if (!instance.hasNode(nodeId)) return

    engine.notifyQueryRemove(nodeId, def.id)

    const nodeIndex = getNodeIdIndex(nodeId)
    const index = instance.sparse[nodeIndex]
    const lastIndex = instance.activeNodeCount - 1
    const lastNode = instance.activeNodes[lastIndex]

    instance.activeNodes[index] = lastNode
    
    const lastNodeIndex = getNodeIdIndex(lastNode)
    instance.sparse[lastNodeIndex] = index

    instance.sparse[nodeIndex] = -1
    instance.activeNodeCount--

    for (const key in def.schema) {
      const defaultVal = def.schema[key]
      if (typeof defaultVal !== 'number' && typeof defaultVal !== 'boolean') {
        traitData[key][nodeIndex] = defaultVal
      }
    }
  }

  instance.hasNode = (nodeId: NodeId) => {
    const nodeIndex = getNodeIdIndex(nodeId)
    return instance.sparse[nodeIndex] !== -1
  }

  return instance
}
