import type { Engine } from './Engine';
import { TreeNode } from './TreeNode';

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
  protected children: TreeNode[];

  /**
   * Setup children and calls onCreate method.
   */
  constructor(parent: TreeNode | Engine) {
    super(parent);
    this.children = [];
    this.onCreate();
  }

  /**
   * Adds a child node to this node children and loads it.
   * @param {TreeNode} node Node to add as child.
   * @returns {number} New children array length.
   * @sealed
   */
  public add(node: TreeNode): number {
    this.children.push(node);
    // Load the added node if added after loading.
    if (this.isLoaded) node.load();
    return this.children.length;
  }

  /**
   * Removes a child node from this node children.
   * @param {TreeNode} node Node to remove of children.
   * @returns {TreeNode} Removed node instance.
   * @sealed
   */
  public remove(node: TreeNode): TreeNode {
    let removedNode;
    this.children = this.children.filter((n: TreeNode) => {
      // Unloads and filters the given node out.
      if (n.id === node.id) {
        removedNode = n;
        n.unload();
        return false;
      }
      return true;
    });
    return removedNode;
  }

  /**
   * Called at parent nodes loading or directly by
   * the engine's loading if this node is the `rootNode`.
   *
   * Calls the `onLoad` method and children's `load` methods.
   * @sealed
   */
  public load(): void {
    this.onLoad();
    for (let i = 0, len = this.children.length; i !== len; ++i) {
      this.children[i].load();
    }
    this.isLoaded = true;
  }

  /**
   * Called at parent nodes step or directly by
   * the engine's step if this node is the `rootNode`.
   *
   * Calls the `onStep` method and children's `step` methods.
   * @sealed
   */
  public step(): void {
    this.onStep();
    for (let i = 0, len = this.children.length; i !== len; ++i) {
      this.children[i].step();
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
    this.onFixedStep();
    for (let i = 0, len = this.children.length; i !== len; ++i) {
      this.children[i].fixedStep();
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
    this.onUnload();
    for (let i = 0, len = this.children.length; i !== len; ++i) {
      this.children[i].unload();
    }
    this.isLoaded = false;
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
  protected onStep(): void { }

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
