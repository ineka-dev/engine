import type { Engine, SystemFunction } from '@ineka/engine'

declare module '@ineka/engine' {
  interface EngineContext {
    gamepad?: {
      down: Set<number>
      pressed: Set<number>
      released: Set<number>
      axes: number[]
    }
  }
}

export const BUTTONS = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  SELECT: 8,
  START: 9,
  L3: 10,
  R3: 11,
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15
} as const

export type ButtonName = keyof typeof BUTTONS

export const AXES = {
  LEFT_X: 0,
  LEFT_Y: 1,
  RIGHT_X: 2,
  RIGHT_Y: 3
} as const

export type AxisName = keyof typeof AXES

/**
 * A System that processes global gamepad events.
 * Exposes global state to engine.context.gamepad.
 */
export function gamepadSystem(): SystemFunction {
  return (engine, delta) => {
    if (!engine.context.gamepad) {
      engine.context.gamepad = {
        down: new Set(),
        pressed: new Set(),
        released: new Set(),
        axes: [0, 0, 0, 0]
      }
    }

    if (typeof navigator === 'undefined' || !navigator.getGamepads) return

    const gamepads = navigator.getGamepads()
    const gp = gamepads[0]

    const pad = engine.context.gamepad as {
      down: Set<number>
      pressed: Set<number>
      released: Set<number>
      axes: number[]
    }

    const previousDown = new Set(pad.down)
    
    pad.down.clear()
    pad.pressed.clear()
    pad.released.clear()

    if (gp) {
      // Process buttons
      for (let i = 0; i < gp.buttons.length; i++) {
        if (gp.buttons[i].pressed) {
          pad.down.add(i)
        }
      }

      // Process axes
      for (let i = 0; i < gp.axes.length && i < 4; i++) {
        pad.axes[i] = gp.axes[i]
      }
    } else {
      pad.axes = [0, 0, 0, 0]
    }

    pad.down.forEach(btn => {
      if (!previousDown.has(btn)) {
        pad.pressed.add(btn)
      }
    })

    previousDown.forEach(btn => {
      if (!pad.down.has(btn)) {
        pad.released.add(btn)
      }
    })
  }
}

// Helpers

/**
 * Checks if a gamepad button is currently held down.
 * 
 * @example
 * ```ts
 * if (isPadDown(engine, 'A')) { ... }
 * ```
 */
export const isPadDown = (engine: Engine, button: ButtonName) => {
  const pad = engine.context.gamepad as any
  return pad?.down.has(BUTTONS[button]) ?? false
}

/**
 * Checks if a gamepad button was pressed this exact frame.
 * 
 * @example
 * ```ts
 * if (isPadPressed(engine, 'START')) { ... }
 * ```
 */
export const isPadPressed = (engine: Engine, button: ButtonName) => {
  const pad = engine.context.gamepad as any
  return pad?.pressed.has(BUTTONS[button]) ?? false
}

/**
 * Checks if a gamepad button was released this exact frame.
 */
export const isPadReleased = (engine: Engine, button: ButtonName) => {
  const pad = engine.context.gamepad as any
  return pad?.released.has(BUTTONS[button]) ?? false
}

/**
 * Gets the current float value (-1 to 1) of a gamepad axis.
 * 
 * @example
 * ```ts
 * const speed = getAxis(engine, 'LEFT_X')
 * ```
 */
export const getAxis = (engine: Engine, axis: AxisName) => {
  const pad = engine.context.gamepad as any
  return pad?.axes[AXES[axis]] ?? 0
}
