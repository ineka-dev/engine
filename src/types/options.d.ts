/**
 * Options available to the Engine class.
 */
export interface EngineOptions {
  /**
   * Width of the engine's canvas.
   * @default 1280
   */
  width?: number
  /**
   * Height of the engine's canvas.
   * @default 720
   */
  height?: number
  /**
   * Resolution used by the engine's canvas.
   * @default true
   */
  resolution?: number
  /**
   * If `true`, sets the width and height of the engine's canvas to follow the container's size.
   * @default true
   */
  fullscreen?: boolean
  /**
   * A DOMString to the container of the engine's canvas.
   * @default 'body'
   */
  container?: string
  /**
   * If set, gives a maximum framerate for the engine's fixed update loop.
   * @default null
   */
  framerate?: number | null

  /**
   * Hooks are functions that are called at specific points in the engine's runtime.
   */
  hooks?: {
    /**
     * Called before the engine's step loop.
     * @default () => { }
     */
    beforeStep: () => void
    /**
     * Called after the engine's step loop.
     * @default () => { }
     */
    afterStep: () => void
  }
}
