import type { Engine, SystemFunction, Plugin } from '@ineka/engine'
import { defineTrait, defineSystem, Transform, hasTrait } from '@ineka/engine'
import * as PIXI from 'pixi.js'

export interface PixiPluginOptions {
  app: PIXI.Application
}

/**
 * Global Trait Definition for rendering.
 */
export const Render = defineTrait({
  container: null as PIXI.Container | null
}, { requires: [Transform] })

/**
 * A Plugin that provisions PIXI rendering.
 * It automatically syncs Transform to the Render container.
 * 
 * @example
 * ```ts
 * engine.use(pixiPlugin({ app }))
 * ```
 */
export function pixiPlugin(options: PixiPluginOptions): Plugin {
  return {
    id: 'pixi',
    install(engine) {
      engine.on('nodeDestroyed', (nodeId) => {
        if (hasTrait(engine, nodeId, Render)) {
          const renderInstance = engine.get(Render)
          const container = renderInstance.data.container[nodeId]
          if (container) {
            container.destroy()
            renderInstance.data.container[nodeId] = null
          }
        }
      })

      engine.on('nodeAttached', ({ parent, child }) => {
        if (hasTrait(engine, parent, Render) && hasTrait(engine, child, Render)) {
          const renderInstance = engine.get(Render)
          const parentContainer = renderInstance.data.container[parent]
          const childContainer = renderInstance.data.container[child]
          if (parentContainer && childContainer) {
            parentContainer.addChild(childContainer)
          }
        }
      })

      engine.on('nodeDetached', ({ parent, child }) => {
        if (hasTrait(engine, parent, Render) && hasTrait(engine, child, Render)) {
          const renderInstance = engine.get(Render)
          const parentContainer = renderInstance.data.container[parent]
          const childContainer = renderInstance.data.container[child]
          if (parentContainer && childContainer) {
            parentContainer.removeChild(childContainer)
            options.app.stage.addChild(childContainer)
          }
        }
      })

      const syncSystem = defineSystem(
        [Render, Transform],
        (engine, delta, nodeId, render, transform) => {
          const container = render.data.container[nodeId]
          if (container) {
            if (!container.parent) {
              options.app.stage.addChild(container)
            }
            container.x = transform.data.x[nodeId]
            container.y = transform.data.y[nodeId]
            container.rotation = transform.data.rotation[nodeId]
            container.scale.x = transform.data.scaleX[nodeId]
            container.scale.y = transform.data.scaleY[nodeId]
          }
        }
      )

      // Syncs transforms and adds to stage every frame
      engine.addSystem('step', syncSystem)
    }
  }
}

/**
 * Kaplay-style Sprite factory.
 * 
 * @example
 * ```ts
 * const player = createNode(engine, [
 *   Transform({ x: 100 }),
 *   sprite(PIXI.Texture.from('hero.png'))
 * ])
 * ```
 */
export function sprite(texture: PIXI.Texture) {
  return Render({ container: new PIXI.Sprite(texture) })
}

/**
 * Kaplay-style Graphics factory.
 * 
 * @example
 * ```ts
 * const box = createNode(engine, [
 *   Transform({ x: 0 }),
 *   graphics(g => g.rect(0, 0, 100, 100).fill(0xff0000))
 * ])
 * ```
 */
export function graphics(draw: (g: PIXI.Graphics) => void) {
  const g = new PIXI.Graphics()
  draw(g)
  return Render({ container: g })
}
