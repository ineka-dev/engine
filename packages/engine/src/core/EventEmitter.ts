/**
 * A lightweight, strongly-typed Event Emitter.
 */
export class EventEmitter<Events extends Record<string, any>> {
  private _listeners: { [K in keyof Events]?: Array<((payload: Events[K]) => void) | null> } = {}
  private _emitDepth: number = 0

  /**
   * Subscribes to an event.
   * 
   * @example
   * ```ts
   * engine.on('nodeCreated', (nodeId) => console.log('Spawned', nodeId))
   * ```
   */
  public on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): void {
    if (!this._listeners[event]) {
      this._listeners[event] = []
    }
    this._listeners[event]!.push(listener)
  }

  /**
   * Unsubscribes from an event.
   * 
   * @example
   * ```ts
   * engine.off('nodeCreated', myListener)
   * ```
   */
  public off<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): void {
    const listeners = this._listeners[event]
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        if (this._emitDepth > 0) {
          listeners[index] = null
        } else {
          listeners.splice(index, 1)
        }
      }
    }
  }

  /**
   * Emits an event, calling all registered listeners.
   */
  public emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const listeners = this._listeners[event]
    if (!listeners) return

    this._emitDepth++
    let hasNulls = false

    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      if (listener) {
        listener(payload)
      } else {
        hasNulls = true
      }
    }

    this._emitDepth--

    // Clean up any listeners that were removed during the emit
    if (this._emitDepth === 0 && hasNulls) {
      this._listeners[event] = listeners.filter(l => l !== null) as Array<(payload: Events[K]) => void>
    }
  }

  /**
   * Clears all listeners.
   */
  public clear(): void {
    this._listeners = {}
  }
}
