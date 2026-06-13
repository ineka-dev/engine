export class Time {
  /**
   * Start of the engine's step.
   */
  private _now: number = performance.now()
  /**
   * Delta time between frame in seconds.
   */
  private _delta: number = 0
  /**
   * Accumulator used to store time between frames
   */
  private _accumulator: number = 0
  /**
   * Time of the last engine's step.
   */
  private _last: number = performance.now()
  /**
   * Target framerate of the engine.
   */
  private _targetFramerate: number = 60
  /**
   * Current framerate in frames per second.
   */
  private _fps: number = 0

  /**
   * Get engine's delta time in seconds.
   * This is the real time passed since the last variable-rate frame. Use this in `step` systems.
   * 
   * @example
   * ```ts
   * transform.data.x[id] += velocity.data.x[id] * engine.time.delta
   * ```
   */
  public get delta(): number { return this._delta }

  /**
   * Get the current engine's time for a step in seconds (this is the ideal time of a frame).
   * Use this in `fixed-step` systems for deterministic updates (like physics).
   * 
   * @example
   * ```ts
   * physics.velocity[id] += gravity * engine.time.timestep
   * ```
   */
  public get timestep(): number { return 1 / this._targetFramerate }

  /**
   * Get the current actual framerate in frames per second.
   */
  public get framerate(): number { return this._fps }

  /**
   * Get the target framerate used for fixed timestep calculations.
   */
  public get targetFramerate(): number { return this._targetFramerate }

  /**
   * Set the target framerate used for fixed timestep calculations.
   */
  public set targetFramerate(value: number) {
    this._targetFramerate = value
  }

  /**
   * Updates delta time and related variables, used by the engine's step loop.
   */
  public update(now?: number) {
    this._now = now ?? performance.now()
    this._delta = (this._now - this._last) / 1000
    this._last = this._now
    this._accumulator += this._delta
    this._fps = 1 / this._delta
  }

  /**
   * Fixes the timestep of a given function during the engine's step loop.
   * Used in engine's `step` method to make fixed steps.
   * @param callback
   */
  public fixTimestep(callback: () => void) {
    let updateStepsCount = 0
    while (this._accumulator >= this.timestep) {
      callback()
      this._accumulator -= this.timestep
      ++updateStepsCount
      // To prevent spiral of death
      if (updateStepsCount >= 240) {
        this._accumulator = 0
        break
      }
    }
  }
}
