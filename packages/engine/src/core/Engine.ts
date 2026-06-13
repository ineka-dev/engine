import type { EngineOptions } from '../types/options'
import { EngineError } from '../errors/EngineError'
import { Graph } from './Graph'
import { Time } from './Time'
import type { TraitDefinition, TraitInstance, TraitDataSchema } from './Trait'
import { instantiateTrait } from './Trait'
import { getNodeIdIndex, NodeId } from '../types/node'
import { Query } from './Query'
import { EventEmitter } from './EventEmitter'
import { transformPlugin } from '../plugins/transform'

/**
 * A functional system that hooks into the engine's step cycle.
 * @example
 * ```ts
 * const gravitySystem: SystemFunction = (engine, delta) => {
 *   // Update physics...
 * }
 * ```
 
 * @param engine The engine instance running the system.
 * @param delta The time delta since the last step (in seconds).
 * */
export type SystemFunction = (engine: Engine, delta: number) => void

/**
 * A global interface for extending the Engine context.
 * Plugins can use TypeScript Module Augmentation to add strongly typed variables.
 * 
 * @example
 * ```ts
 * declare module '@ineka/engine' {
 *   interface EngineContext {
 *     score: number
 *   }
 * }
 * ```
 */
export interface EngineContext {
  [key: string]: unknown
}

/**
 * Events emitted by the Engine lifecycle.
 */
export interface EngineEvents {
  start: void
  beforeStep: void
  afterStep: void
  nodeCreated: number
  nodeDestroyed: number
  nodeAttached: { parent: number; child: number }
  nodeDetached: { parent: number; child: number }
  destroy: void
}

/**
 * Interface for Engine Plugins.
 */
export interface Plugin {
  id: string
  install: (engine: Engine) => void
}

/**
 * The starting point of an Ineka game application.
 * Manages the main game loop, logic systems, and the data-oriented graph.
 * 
 * @example
 * ```ts
 * const engine = new Engine({ container: '#game', framerate: 60 })
 * engine.use(pixiPlugin({ app }))
 * engine.run()
 * ```
 */
export class Engine extends EventEmitter<EngineEvents> {
  private _options: Required<EngineOptions>
  private _container: HTMLElement
  private _tickSystems: SystemFunction[] = []
  private _updateSystems: SystemFunction[] = []
  private _time: Time = new Time()

  private _frameId: number = 0
  public isRunning: boolean = false

  // State
  private _traitInstances: Map<number, TraitInstance<any>> = new Map()
  private _queries: Map<string, Query<any>> = new Map()
  private _plugins: Map<string, Plugin> = new Map()

  /** 
   * Engine context for plugins to store shared data. 
   * You can mutate this object directly to store global state.
   */
  public context: EngineContext = {}
  
  /** Unbounded bitset signatures per node (array of Uint32Array chunks to support infinite traits) */
  public signatures: Uint32Array[] = []

  public graph: Graph
  public rootNode: NodeId

  public get options(): Required<EngineOptions> { return this._options }
  public get container(): HTMLElement { return this._container }
  public get time(): Time { return this._time }

  constructor(options: EngineOptions) {
    super()
    this._options = {
      container: 'body',
      framerate: null,
      initialCapacity: 10000,
      ...options,
      hooks: {
        beforeStep: () => { },
        afterStep: () => { },
        ...options?.hooks
      }
    } as Required<EngineOptions>

    this._container = document.querySelector(this._options.container as string) as HTMLElement
    
    if (this._options.framerate) {
      this.time.targetFramerate = this._options.framerate
    }

    this.graph = new Graph(this._options.initialCapacity)

    // Wire up trait and query resizes when Graph dynamically grows
    this.graph.onResize = (newCapacity) => {
      this.signatures = this.signatures.map(arr => {
        const newArr = new Uint32Array(newCapacity).fill(0)
        newArr.set(arr)
        return newArr
      })

      for (const trait of this._traitInstances.values()) {
        trait.resize(newCapacity)
      }
      for (const query of this._queries.values()) {
        query.resize(newCapacity)
      }
    }

    // Clean up traits when a node is destroyed
    this.graph.onDestroyNode = (nodeId) => {
      this.emit('nodeDestroyed', nodeId)
      for (const trait of this._traitInstances.values()) {
        trait.removeNode(nodeId)
      }
    }

    this.graph.onCreateNode = (nodeId) => {
      this.emit('nodeCreated', nodeId)
    }

    this.graph.onAddChild = (parentId, childId) => {
      this.emit('nodeAttached', { parent: parentId, child: childId })
    }

    this.graph.onRemoveChild = (parentId, childId) => {
      this.emit('nodeDetached', { parent: parentId, child: childId })
    }

    this.rootNode = this.graph.createNode()
    this.init()
  }

  private init(): void {
    this.use(transformPlugin())
  }

  /**
   * Installs a plugin into the engine.
   * 
   * @example
   * ```ts
   * engine.use(howlerPlugin())
   * ```
   */
  public use(plugin: Plugin): this {
    if (this._plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already installed.`)
      return this
    }
    this._plugins.set(plugin.id, plugin)
    plugin.install(this)
    return this
  }

  /**
   * Attaches a system to a specific phase of the engine loop.
   * 'step' runs every variable-rate frame update.
   * 'fixed-step' runs on the fixed-rate logic tick.
   * 
   * @example
   * ```ts
   * engine.addSystem('fixed-step', movementSystem())
   * ```
   */
  public addSystem(phase: 'step' | 'fixed-step', system: SystemFunction): void {
    if (phase === 'step') {
      this._updateSystems.push(system)
    } else if (phase === 'fixed-step') {
      this._tickSystems.push(system)
    }
  }

  /**
   * Lazily gets or instantiates the memory arrays for a Trait Definition.
   * You usually don't need to call this unless you are writing low-level hot loops.
   * 
   * @example
   * ```ts
   * const velocityTrait = engine.get(Velocity)
   * ```
   */
  public get<T extends TraitDataSchema>(def: TraitDefinition<T>): TraitInstance<T> {
    if (!this._traitInstances.has(def.id)) {
      this._traitInstances.set(def.id, instantiateTrait(this, def))
    }
    return this._traitInstances.get(def.id) as TraitInstance<T>
  }

  private ensureSignatureCapacity(traitId: number): void {
    const chunksNeeded = Math.floor(traitId / 32) + 1
    while (this.signatures.length < chunksNeeded) {
      this.signatures.push(new Uint32Array(this.graph.maxNodes).fill(0))
    }
  }

  /** @internal */
  public notifyQueryAdd(nodeId: NodeId, traitId: number): void {
    this.ensureSignatureCapacity(traitId)
    const chunk = Math.floor(traitId / 32)
    const bit = traitId % 32
    const index = getNodeIdIndex(nodeId)
    this.signatures[chunk][index] |= (1 << bit)

    for (const query of this._queries.values()) {
      query.onTraitAdded(nodeId, traitId)
    }
  }

  /** @internal */
  public notifyQueryRemove(nodeId: NodeId, traitId: number): void {
    this.ensureSignatureCapacity(traitId)
    const chunk = Math.floor(traitId / 32)
    const bit = traitId % 32
    const index = getNodeIdIndex(nodeId)
    this.signatures[chunk][index] &= ~(1 << bit)

    for (const query of this._queries.values()) {
      query.onTraitRemoved(nodeId, traitId)
    }
  }

  /**
   * Queries the engine for an O(1) cached intersection of multiple traits.
   * Lazily initialized, then reactive.
   * 
   * @example
   * ```ts
   * const enemies = engine.query(Transform, Enemy)
   * for (let i = 0; i < enemies.activeNodeCount; i++) {
   *   const enemyId = enemies.activeNodes[i]
   *   // ...
   * }
   * ```
   */
  public query<T extends TraitDefinition<any>[]>(...defs: T): Query<T> {
    let key = ''
    for (let i = 0; i < defs.length; i++) {
      key += defs[i].id + '_'
    }
    
    if (!this._queries.has(key)) {
      this._queries.set(key, new Query(this, defs))
    }
    
    return this._queries.get(key) as Query<T>
  }

  /**
   * Starts the main engine loop.
   */
  public run(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.emit('start', undefined)
    this._frameId = requestAnimationFrame(this.step.bind(this))
  }

  /**
   * Stops the main engine loop.
   */
  public stop(): void {
    this.isRunning = false
    cancelAnimationFrame(this._frameId)
  }

  /**
   * Completely destroys the engine, freeing all memory and destroying all nodes.
   */
  public destroy(): void {
    this.stop()
    this.emit('destroy', undefined)
    
    // Destroy all nodes (cascades recursively to all children)
    this.graph.destroyNode(this.rootNode)
    
    // Clear all event listeners
    this.clear()
  }

  protected step(now: number): void {
    if (!this.isRunning) return
    
    try {
      this.options.hooks?.beforeStep?.()
    } catch (err) {
      console.error(new EngineError(this, 'HOOK:FAILURE', `Error in beforeStep hook: ${err instanceof Error ? err.message : err}`))
    }
    this.emit('beforeStep', undefined)

    this.time.update(now)

    this.time.fixTimestep(() => {
      for (let i = 0; i < this._tickSystems.length; i++) {
        this._tickSystems[i](this, this.time.timestep)
      }
    })

    for (let i = 0; i < this._updateSystems.length; i++) {
      this._updateSystems[i](this, this.time.delta)
    }

    try {
      this.options.hooks?.afterStep?.()
    } catch (err) {
      console.error(new EngineError(this, 'HOOK:FAILURE', `Error in afterStep hook: ${err instanceof Error ? err.message : err}`))
    }
    this.emit('afterStep', undefined)

    if (this.isRunning) {
      this._frameId = requestAnimationFrame(this.step.bind(this))
    }
  }
}

