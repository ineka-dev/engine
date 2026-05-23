import { EngineError } from '../errors/EngineError'
import type { Engine } from './Engine'
import { TreeNode } from './TreeNode'

/**
 * An inner node is a node of the tree that has child nodes.
 *
 * In most cases those nodes will be used as entity nodes and
 * will be composed of component nodes.
 * But those can be used for any other purpose (utility, scene
 * orchestrating, etc.).
 */
export class InnerNode extends TreeNode {
  /**
   * Node's children nodes.
   */
  protected _children: TreeNode[]

  /**
   * Setup children and calls onCreate method.
   */
  constructor(parent: TreeNode | Engine) {
    super(parent)
    this._children = []
    this.onCreate()
  }

  /**
   * Adds a child node to this node children and loads it.
   * @param {TreeNode} node Node to add as child.
   * @returns {number} New children array length.
   * @sealed
   */
  public add(node: TreeNode): number {
    this._children.push(node)
    // Load the added node if added after loading.
    if (this._isLoaded)
      node.load()
    return this._children.length
  }

  /**
   * Removes a child node from this node children.
   * @param {TreeNode} node Node to remove of children.
   * @returns {TreeNode} Removed node instance.
   * @sealed
   */
  public remove(node: TreeNode): TreeNode {
    const index = this._children.findIndex(n => n.id === node.id)
    if (index === -1) {
      throw new EngineError(this._engine, 'NODE:FAILURE', 'The node you tried to remove is not a child of this node.')
    }

    const removedNode = this._children[index]
    removedNode.unload()

    // Swap-and-pop for fast removal avoiding array reallocation
    const last = this._children.pop()
    if (last !== undefined && last !== removedNode) {
      this._children[index] = last
    }

    return removedNode
  }

  /**
   * Called at parent nodes loading or directly by
   * the engine's loading if this node is the `rootNode`.
   *
   * Calls the `onLoad` method and children's `load` methods.
   * @sealed
   */
  public load(): void {
    this.onLoad()
    for (let i = 0, len = this._children.length; i !== len; ++i) {
      this._children[i].load()
    }
    this._isLoaded = true
  }

  /**
   * Called at parent nodes step or directly by
   * the engine's step if this node is the `rootNode`.
   *
   * Calls the `onStep` method and children's `step` methods.
   * @sealed
   */
  public step(delta: number): void {
    this.onStep(delta)
    for (let i = 0, len = this._children.length; i !== len; ++i) {
      this._children[i].step(delta)
    }
  }

  /**
   * Called at parent nodes fixedStep or directly by
   * the engine's step if this node is the `rootNode`.
   *
   * Calls the `onFixedStep` and children's `fixedStep` methods.
   * @sealed
   */
  public fixedStep(): void {
    this.onFixedStep()
    for (let i = 0, len = this._children.length; i !== len; ++i) {
      this._children[i].fixedStep()
    }
  }

  /**
   * Called at parent nodes unload or directly by
   * the engine's unload if this node is the `rootNode`.
   *
   * Calls the `onUnload` method and children's `unload` methods.
   * @sealed
   */
  public unload(): void {
    this.onUnload()
    for (let i = 0, len = this._children.length; i !== len; ++i) {
      this._children[i].unload()
    }
    this._isLoaded = false
  }

  /**
   * Called by the node's constructor at instantiation,
   * this function is to be implemented when needed.
   * @virtual
   */
  protected onCreate(): void { }

  /**
   * Called by the parent node when loaded,
   * this function is to be implemented when needed.
   *
   * If this node is the engine's root node, this
   * function will be called by the engine instead.
   * @virtual
   */
  protected onLoad(): void { }

  /**
   * Called by the parent node at each step of the loop,
   * this function is to be implemented when needed.
   * @virtual
   */
  // eslint-disable-next-line unused-imports/no-unused-vars
  protected onStep(delta: number): void { }

  /**
   * Called by the parent node at each fixed step of the loop,
   * this function is to be implemented when needed.
   * @virtual
   */
  protected onFixedStep(): void { }

  /**
   * Called by the parent node at unload,
   * this function is to be implemented when needed.
   *
   * If this node is the engine's root node, this
   * function will be called by the engine instead.
   * @virtual
   */
  protected onUnload(): void { }
}
