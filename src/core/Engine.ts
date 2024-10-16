import type { EngineOptions } from '../types/options'
import { EngineError } from '../errors/EngineError'
import type { OuterNode } from './OuterNode'
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
  private _systems: Map<string, OuterNode> = new Map()
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
  public get systems(): Map<string, OuterNode> { return this._systems }
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
        beforeStep: async () => { },
        afterStep: async () => { },
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
    // Call beforeStep hook
    try {
      if (!this.options.hooks || !this.options.hooks.beforeStep) {
        throw new EngineError(this, 'ENGINE:FAILURE', 'No beforeStep hook given to engine.')
      }
      this.options.hooks.beforeStep()
    }
    catch (err) {
      console.error(err)
    }

    if (!this.rootNode) {
      throw new EngineError(this, 'ENGINE:FAILURE', 'No root node given to engine, cannot run.')
    }
    // Update delta and last frame time
    this.time.update(now)
    // Fix timestep of fixedStep methods
    this.time.fixTimestep(() => {
      if (!this.rootNode) {
        throw new EngineError(this, 'ENGINE:FAILURE', 'No root node given to engine, cannot run.')
      }
      this.systems.forEach((system) => {
        system.fixedStep()
      })
      this.rootNode.fixedStep()
    })
    // Do non fixed steps
    this.systems.forEach((system) => {
      system.step(this.time.delta)
    })
    this.rootNode.step(this.time.delta)
    // Call afterStep hook
    try {
      if (!this.options.hooks || !this.options.hooks.afterStep) {
        throw new EngineError(this, 'ENGINE:FAILURE', 'No afterStep hook given to engine.')
      }
      this.options.hooks.afterStep()
    }
    catch (err) {
      console.error(err)
    }

    // Request next step
    requestAnimationFrame(this.step.bind(this))
  }
}
