import { Plugin, Engine } from '../core/Engine'
import { defineSystem } from '../api/system'
import { Transform } from '../traits/Transform'
import { NodeId, getNodeIdIndex } from '../types/node'

export function transformPlugin(): Plugin {
  return {
    id: 'transform',
    install(engine: Engine) {
      const transformSystem = defineSystem(
        [Transform],
        (engine: Engine, delta: number, nodeId: number, transform) => {
          // Note: The global cascade actually handles all nodes including parents that don't match the query.
          // Because transform cascades top-down recursively, defineSystem is just used here as a hook 
          // to grab the trait instance and run the cascade over the whole graph ONCE per step.
        }
      )

      // Replace defineSystem usage for Transform since cascade logic requires arbitrary node access anyway
      const customTransformSystem = (engine: Engine) => {
        const transform = engine.get(Transform)
        engine.graph.cascade(engine.rootNode, (nodeId: NodeId) => {
          if (!transform.hasNode(nodeId)) return
          const index = getNodeIdIndex(nodeId)
          const parentId = engine.graph.parent[index]

          if (parentId === -1 || !transform.hasNode(parentId)) {
            transform.data.worldX[index] = transform.data.x[index]
            transform.data.worldY[index] = transform.data.y[index]
            transform.data.worldRotation[index] = transform.data.rotation[index]
            transform.data.worldScaleX[index] = transform.data.scaleX[index]
            transform.data.worldScaleY[index] = transform.data.scaleY[index]
          } else {
            const pIdx = getNodeIdIndex(parentId)

            const px = transform.data.worldX[pIdx]
            const py = transform.data.worldY[pIdx]
            const pr = transform.data.worldRotation[pIdx]
            const psx = transform.data.worldScaleX[pIdx]
            const psy = transform.data.worldScaleY[pIdx]

            const lx = transform.data.x[index] * psx
            const ly = transform.data.y[index] * psy

            const cosR = Math.cos(pr)
            const sinR = Math.sin(pr)

            transform.data.worldX[index] = px + (lx * cosR - ly * sinR)
            transform.data.worldY[index] = py + (lx * sinR + ly * cosR)
            transform.data.worldRotation[index] = pr + transform.data.rotation[index]
            transform.data.worldScaleX[index] = psx * transform.data.scaleX[index]
            transform.data.worldScaleY[index] = psy * transform.data.scaleY[index]
          }
        })
      }

      engine.addSystem('step', customTransformSystem)
    }
  }
}
