import type { Engine } from './Engine'

/**
 * Global node ID counter.
 */
let nextNodeId = 0

/**
 * Basic TreeNode interface for engine's graph.
 */
export abstract class TreeNode {
  /**
   * Node's ID.
   */
  protected _id: string

  /**
   * Node's parent node, if root node, the parent node is replaced by the engine instance.
   */
  protected _parent: TreeNode | Engine

  /**
   * Engine instance of the node's graph.
   */
  protected _engine: Engine

  /**
   * Get wether the node is loaded.
   */
  protected _isLoaded: boolean

  /**
   * Get the node's ID.
   */
  public get id(): string { return this._id }

  /**
   * Get parent node.
   */
  public get parent(): TreeNode | Engine { return this._parent }

  /**
   * Get engine instance.
   */
  public get engine(): Engine { return this._engine }

  /**
   * Generates node's id.
   */
  constructor(parent: TreeNode | Engine) {
    this._parent = parent
    if (parent instanceof TreeNode) {
      this._engine = parent._engine
    }
    else {
      this._engine = parent
    }
    this._id = (nextNodeId++).toString(36)
    this._isLoaded = false
  }

  /**
   * Adds a child node to the node children.
   *
   * This method needs to be implemented to throw an
   * error if the node cannot have children (outer nodes).
   *
   * @param {TreeNode} node Node to add as child.
   * @returns {number} New children array length.
   */
  public abstract add(node: TreeNode): number

  /**
   * Removes a child node from the node children.
   *
   * This method needs to be implemented to throw an
   * error if the node cannot have children (outer nodes).
   *
   * @param {TreeNode} node Node to remove of children.
   * @returns {TreeNode} Removed node instance.
   */
  public abstract remove(node: TreeNode): TreeNode

  /**
   * To execute on instance creation (in the node's constructor).
   *
   * This method is not called in the abstract
   * TreeNode class constructor because it needs to
   * be called after all members are initialized.
   *
   * We do not need a `create` method as this is an
   * internal behavior of nodes.
   */
  protected abstract onCreate(): void

  /**
   * Called at node loading in the scene graph.
   *
   * It calls the node's `onLoad` method.
   * In the case of an inner node, this method
   * will call the children's `load` methods too.
   */
  public abstract load(): void

  /**
   * To execute at node loading/initialization in the graph.
   */
  protected abstract onLoad(): void

  /**
   * Called at each step of the loop by the parent
   * node load method or the engine's `step` method directly.
   *
   * It calls the node's `onStep` method.
   * In the case of an inner node, this method
   * will call the children's `step` methods too.
   */
  public abstract step(delta: number): void

  /**
   * To execute at each step of the loop.
   */
  protected abstract onStep(delta: number): void

  /**
   * Called at each fixed step of the loop by the parent
   * node load method or the engine's `step` method directly.
   *
   * It calls the node's `onFixedStep` method.
   * In the case of an inner node, this method
   * will call the children's `fixedStep` methods too.
   */
  public abstract fixedStep(): void

  /**
   * To execute at each fixed step of the loop.
   */
  protected abstract onFixedStep(): void

  /**
   * Called at node unloading in the scene graph.
   *
   * It calls the node's `onUnload` method.
   * In the case of an inner node, this method
   * will call the children's `unload` methods too.
   */
  public abstract unload(): void

  /**
   * To execute at node unloading in the graph.
   */
  protected abstract onUnload(): void
}
