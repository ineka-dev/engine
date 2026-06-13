import type { Engine, Plugin } from '@ineka/engine'

declare module '@ineka/engine' {
  interface EngineContext {
    keyboard?: {
      down: Set<string>
      pressed: Set<string>
      released: Set<string>
    }
  }
}

export const KEYS = {
  W: 'KeyW',
  A: 'KeyA',
  S: 'KeyS',
  D: 'KeyD',
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  SPACE: 'Space',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SHIFT: 'ShiftLeft'
} as const

export type KeyName = keyof typeof KEYS

/**
 * A Plugin that processes global keyboard events.
 * Exposes global state to engine.context.keyboard.
 */
export function keyboardPlugin(): Plugin {
  return {
    id: 'keyboard',
    install(engine) {
      const isCurrentlyDown = new Set<string>()

      const onKeyDown = (e: KeyboardEvent) => isCurrentlyDown.add(e.code)
      const onKeyUp = (e: KeyboardEvent) => isCurrentlyDown.delete(e.code)

      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
      }

      engine.on('destroy', () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('keydown', onKeyDown)
          window.removeEventListener('keyup', onKeyUp)
        }
      })

      engine.context.keyboard = {
        down: new Set(),
        pressed: new Set(),
        released: new Set()
      }

      engine.addSystem('step', (engine, delta) => {
        const kb = engine.context.keyboard!
        const previousDown = new Set(kb.down)
        
        kb.down.clear()
        kb.pressed.clear()
        kb.released.clear()

        isCurrentlyDown.forEach(code => {
          kb.down.add(code)
          if (!previousDown.has(code)) {
            kb.pressed.add(code)
          }
        })

        previousDown.forEach(code => {
          if (!isCurrentlyDown.has(code)) {
            kb.released.add(code)
          }
        })
      })
    }
  }
}

// Helpers

/**
 * Checks if a keyboard key is currently held down.
 * 
 * @example
 * ```ts
 * if (isKeyDown(engine, 'SPACE')) { ... }
 * ```
 */
export const isKeyDown = (engine: Engine, key: KeyName) => {
  const kb = engine.context.keyboard as any
  return kb?.down.has(KEYS[key]) ?? false
}

/**
 * Checks if a keyboard key was pressed this exact frame.
 * 
 * @example
 * ```ts
 * if (isKeyPressed(engine, 'ENTER')) { ... }
 * ```
 */
export const isKeyPressed = (engine: Engine, key: KeyName) => {
  const kb = engine.context.keyboard as any
  return kb?.pressed.has(KEYS[key]) ?? false
}

/**
 * Checks if a keyboard key was released this exact frame.
 */
export const isKeyReleased = (engine: Engine, key: KeyName) => {
  const kb = engine.context.keyboard as any
  return kb?.released.has(KEYS[key]) ?? false
}
