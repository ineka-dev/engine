import type { Engine, Plugin } from '@ineka/engine'
import { defineTrait, getNodeIdIndex, NodeId } from '@ineka/engine'
import { Howl } from 'howler'

export interface HowlerPluginOptions {
  /** If you want spatial audio, provide a function to sync node transform to Howler 3D position */
  syncSpatial?: (nodeId: number, sound: Howl) => void
}

export const Audio = defineTrait({
  sound: null as Howl | null,
  soundId: -1, // The specific play instance ID
})

/**
 * A Plugin that provisions Howler rendering (e.g. spatial audio).
 * 
 * @example
 * ```ts
 * engine.use(howlerPlugin())
 * ```
 */
export function howlerPlugin(options: HowlerPluginOptions = {}): Plugin {
  return {
    id: 'howler',
    install(engine) {
      engine.addSystem('step', (engine, delta) => {
        if (options?.syncSpatial) {
          const audioInstance = engine.get(Audio)
          for (let i = 0; i < audioInstance.activeNodeCount; i++) {
            const nodeId = audioInstance.activeNodes[i]
            const s = audioInstance.data.sound[nodeId]
            if (s) {
              options.syncSpatial(nodeId, s)
            }
          }
        }
      })
    }
  }
}

/**
 * Kaplay-style Sound factory.
 * 
 * @example
 * ```ts
 * const enemy = createNode(engine, [
 *   sound('explosion.mp3')
 * ])
 * ```
 */
export function sound(src: string | string[], options?: ConstructorParameters<typeof Howl>[0]) {
  const h = new Howl({ src: Array.isArray(src) ? src : [src], ...options })
  return Audio({ sound: h })
}

/**
 * Plays the sound attached to a node, returning the specific play ID.
 * 
 * @example
 * ```ts
 * play(engine, enemyId)
 * ```
 */
export function play(engine: Engine, nodeId: NodeId) {
  const audioInstance = engine.get(Audio)
  const index = getNodeIdIndex(nodeId)
  const s = audioInstance.data.sound[index]
  if (s) {
    const id = s.play()
    audioInstance.data.soundId[index] = id
    return id
  }
  return null
}

/**
 * Stops the sound attached to a node.
 * 
 * @example
 * ```ts
 * stop(engine, engineSoundId)
 * ```
 */
export function stop(engine: Engine, nodeId: NodeId) {
  const audioInstance = engine.get(Audio)
  const index = getNodeIdIndex(nodeId)
  const s = audioInstance.data.sound[index]
  const id = audioInstance.data.soundId[index]
  if (s && id !== -1) {
    s.stop(id)
    audioInstance.data.soundId[index] = -1
  }
}
