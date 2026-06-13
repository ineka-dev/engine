import { defineTrait } from '../core/Trait'

/**
 * Global Trait Definition for 2D velocity data.
 * Uses `Float32Array` internally for Data-Oriented performance.
 */
export const Velocity = defineTrait({
  x: 0,
  y: 0
})
