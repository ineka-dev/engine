import type { EngineOptions } from '../types/options'
import { EngineError } from '../errors/EngineError'
import type { SystemNode } from './SystemNode'
import type { TreeNode } from './TreeNode'
import { Time } from './Time'

/**
 * The starting point of an Ineka game application.
 */
export class Engine {
  /**
   * Engine's options (merged with defaults in constructor).
   */
  private _options: EngineOptions
  /**
   * Engine DOM container element.
   */
  private _container: HTMLElement
  /**
   * Engine's attached systems.
   */
  private _systems: Map<string, SystemNode> = new Map()
  /**
   * Engine's time utility.
   */
  private _time: Time = new Time()
  /**
   * Root node of the engine's graph.
   */
  public rootNode: TreeNode | undefined

  /**
   * Get engine's options.
   * @readonly
   */
  public get options(): EngineOptions { return this._options }
  /**
   * Get engine's container element.
   * @readonly
   */
  public get container(): HTMLElement { return this._container }
  /**
   * Get engine's systems.
   * @readonly
   */
  public get systems(): Map<string, SystemNode> { return this._systems }
  /**
   * Get engine's time utility.
   * @readonly
   */
  public get time(): Time { return this._time }

  /**
   * Merge given options with defaults and calls the engine's `init` method.
   * @param {EngineOptions} options Engine's options
   */
  constructor(options: EngineOptions) {
    // Merge passed options with defaults
    this._options = {
      width: 1280,
      height: 720,
      resolution: 1,
      fullscreen: true,
      container: 'body',
      framerate: null,
      hooks: {
        beforeStep: () => { },
        afterStep: () => { },
      },
      ...options,
    }
    this._container = document.querySelector(this._options.container as string) as HTMLElement
    this.init()
  }

  /**
   * Inits the engine by registering default core systems.
   */
  private init(): void { }

  /**
   * Loads systems/rootNode and starts the update loops.
   */
  public run(): void {
    // Check if root node exists before loading.
    if (!this.rootNode) {
      throw new EngineError(this, 'ENGINE:FAILURE', 'No root node given to engine, cannot run.')
    }
    // Load systems.
    this.systems.forEach((system) => {
      system.load()
    })
    // Load rootNode.
    this.rootNode.load()
    // Start engine's steps.
    requestAnimationFrame(this.step.bind(this))
  }

  /**
   * Update loop function, uses notions from
   * [this article](https://gafferongames.com/post/fix_your_timestep/)
   * to fix the timestep for fixed update loops (useful for physics and user interactions).
   */
  protected step(now: number): void {
    // If the root node is gone, we can't continue. Log an error and stop the loop.
    if (!this.rootNode) {
      console.error(new EngineError(this, 'ENGINE:FAILURE', 'No root node present in the engine. Stopping the loop.'))
      return
    }

    // Call beforeStep hook, catching any errors that occur within it.
    try {
      this.options.hooks?.beforeStep?.()
    }
    catch (err) {
      console.error(new EngineError(this, 'HOOK:FAILURE', `Error in beforeStep hook: ${err instanceof Error ? err.message : err}`))
    }

    // Update delta and last frame time.
    this.time.update(now)

    // Run the fixed-timestep updates.
    this.time.fixTimestep(() => {
      // The rootNode is guaranteed to exist here because of the check at the top.
      for (const system of this.systems.values()) {
        system.fixedStep()
      }
      this.rootNode!.fixedStep()
    })

    // Run the variable-timestep updates.
    for (const system of this.systems.values()) {
      system.step(this.time.delta)
    }
    this.rootNode.step(this.time.delta)

    // Call afterStep hook, catching any errors that occur within it.
    try {
      this.options.hooks?.afterStep?.()
    }
    catch (err) {
      console.error(new EngineError(this, 'HOOK:FAILURE', `Error in afterStep hook: ${err instanceof Error ? err.message : err}`))
    }

    // Request the next animation frame to continue the loop.
    requestAnimationFrame(this.step.bind(this))
  }
}
