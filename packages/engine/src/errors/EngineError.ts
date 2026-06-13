import type { Engine } from '../core/Engine'
import type { EngineErrorCode } from '../types/errors'

/**
 * This class extends the native `Error` class to work with the engine.
 *
 * It also dispatches a custom event named `ineka:error` on the
 * engine container element to make it easier to display errors or
 * create debugging tools.
 *
 * The syntax for all custom events dispatched by Ineka uses the prefix `ineka:`
 * to prevent collisions with any other library.
 */
export class EngineError extends Error {
  /**
   * Engine that is throwing the error.
   */
  protected engine: Engine

  /**
   * Custom code for the error.
   */
  protected code: string | number

  constructor(engine: Engine, code: EngineErrorCode, message: string) {
    super(`${message} (code: ${code})`)
    this.engine = engine
    this.code = code
    this.name = 'EngineError'

    // Dispatch a custom error event to the engine container.
    // This makes custom error display and debugging tools easier to make.
    const errorEvent = new CustomEvent('ineka:error', { detail: this })
    this.engine.container.dispatchEvent(errorEvent)
  }
}
