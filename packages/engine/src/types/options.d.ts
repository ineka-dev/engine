/**
 * Options available to configure the Engine at initialization.
 * Missing properties will automatically fall back to their internal defaults.
 */
export interface EngineOptions {
  /**
   * A DOMString selector to the HTML element that will act as the container of the engine's canvas.
   * @default 'body'
   */
  container?: string
  /**
   * If set, provides a fixed maximum framerate constraint for the engine's fixed update loop.
   * If `null`, it will run as fast as the system allows (usually tied to requestAnimationFrame).
   * @default null
   */
  framerate?: number | null

  /**
   * Initial maximum number of nodes the graph can hold.
   * If exceeded, the engine dynamically resizes all internal buffers.
   * @default 10000
   */
  initialCapacity?: number

  /**
   * Lifecycle hooks that are called at specific points in the engine's runtime step.
   * Useful for external logic integration before and after systems run.
   */
  hooks?: {
    /**
     * Called at the very beginning of the engine's step loop.
     * @default () => { }
     */
    beforeStep?: () => void
    /**
     * Called at the very end of the engine's step loop, after all variable logic is processed.
     * @default () => { }
     */
    afterStep?: () => void
  }
}
