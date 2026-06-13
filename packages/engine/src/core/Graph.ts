import { NodeId } from '../types/node'

/**
 * The core Data-Oriented Graph structure.
 * Replaces the traditional Object-Oriented TreeNode/InnerNode tree with flat Int32Array buffers.
 * Provides high-performance ID-based node logic and relationships.
 */
export class Graph {
  /** The current maximum number of nodes the graph can hold without resizing. */
  public maxNodes: number
  
  /** Int32Array Buffer mapping a node ID to its parent's node ID. */
  public parent: Int32Array
  /** Int32Array Buffer mapping a node ID to its first child's node ID. */
  public firstChild: Int32Array
  /** Int32Array Buffer mapping a node ID to its next sibling's node ID. */
  public nextSibling: Int32Array
  /** Int32Array Buffer mapping a node ID to its previous sibling's node ID. */
  public prevSibling: Int32Array

  // ID Pooling for maximum performance
  public activeNodeCount: number = 0
  private nextNodeIndex: number = 0
  private availableIds: number[] = []

  /**
   * Optional callback triggered when the graph dynamically resizes itself.
   * Useful for informing Component/Trait arrays to resize.
   */
  public onResize: ((newCapacity: number) => void) | null = null

  /**
   * Optional callback triggered when a node is destroyed.
   * Useful for informing Component/Trait arrays to clean up the node's data.
   */
  public onDestroyNode: ((nodeId: NodeId) => void) | null = null

  public onCreateNode: ((nodeId: NodeId) => void) | null = null
  public onAddChild: ((parentId: NodeId, childId: NodeId) => void) | null = null
  public onRemoveChild: ((parentId: NodeId, childId: NodeId) => void) | null = null

  constructor(maxNodes: number = 10000) {
    this.maxNodes = maxNodes
    this.parent = new Int32Array(maxNodes).fill(-1)
    this.firstChild = new Int32Array(maxNodes).fill(-1)
    this.nextSibling = new Int32Array(maxNodes).fill(-1)
    this.prevSibling = new Int32Array(maxNodes).fill(-1)
  }

  /**
   * Checks if a NodeId is currently valid.
   */
  public isValid(nodeId: NodeId): boolean {
    return nodeId >= 0 && nodeId < this.nextNodeIndex && !this.availableIds.includes(nodeId)
  }

  /**
   * Allocates a new node ID, preferring recycled IDs first.
   * If capacity is reached, it dynamically resizes the graph.
   */
  public createNode(): NodeId {
    let index: number

    if (this.availableIds.length > 0) {
      index = this.availableIds.pop()!
    } else {
      index = this.nextNodeIndex++
      if (index >= this.maxNodes) {
        this.resize(this.maxNodes * 2)
      }
    }

    this.activeNodeCount++

    // Reset graph links
    this.parent[index] = -1
    this.firstChild[index] = -1
    this.nextSibling[index] = -1
    this.prevSibling[index] = -1

    if (this.onCreateNode) {
      this.onCreateNode(index)
    }
    
    return index
  }

  /**
   * Resizes internal structural arrays to a new capacity.
   */
  private resize(newCapacity: number): void {
    const newParent = new Int32Array(newCapacity).fill(-1)
    newParent.set(this.parent)
    this.parent = newParent

    const newFirstChild = new Int32Array(newCapacity).fill(-1)
    newFirstChild.set(this.firstChild)
    this.firstChild = newFirstChild

    const newNextSibling = new Int32Array(newCapacity).fill(-1)
    newNextSibling.set(this.nextSibling)
    this.nextSibling = newNextSibling

    const newPrevSibling = new Int32Array(newCapacity).fill(-1)
    newPrevSibling.set(this.prevSibling)
    this.prevSibling = newPrevSibling

    this.maxNodes = newCapacity

    if (this.onResize) {
      this.onResize(newCapacity)
    }
  }

  /**
   * Links a child to a parent using First-Child / Next-Sibling logic.
   */
  public addChild(parentId: NodeId, childId: NodeId): void {
    this.parent[childId] = parentId

    const first = this.firstChild[parentId]
    if (first === -1) {
      this.firstChild[parentId] = childId
    } else {
      let current = first
      while (this.nextSibling[current] !== -1) {
        current = this.nextSibling[current]
      }
      this.nextSibling[current] = childId
      this.prevSibling[childId] = current
    }

    if (this.onAddChild) {
      this.onAddChild(parentId, childId)
    }
  }

  /**
   * Unlinks a child from a parent node.
   */
  public removeChild(parentId: NodeId, childId: NodeId): void {
    const prev = this.prevSibling[childId]
    const next = this.nextSibling[childId]

    if (prev !== -1) {
      this.nextSibling[prev] = next
    } else {
      this.firstChild[parentId] = next
    }

    if (next !== -1) {
      this.prevSibling[next] = prev
    }
    
    this.parent[childId] = -1
    this.nextSibling[childId] = -1
    this.prevSibling[childId] = -1

    if (this.onRemoveChild) {
      this.onRemoveChild(parentId, childId)
    }
  }

  /**
   * Recursively destroys a node and all its children, recycling their IDs.
   */
  public destroyNode(id: NodeId): void {
    if (id === -1) return

    if (this.onDestroyNode) {
      this.onDestroyNode(id)
    }

    // Remove from parent
    const p = this.parent[id]
    if (p !== -1) {
      this.removeChild(p, id)
    }

    // Recursively destroy children
    let child = this.firstChild[id]
    while (child !== -1) {
      const next = this.nextSibling[child]
      this.destroyNode(child)
      child = next
    }

    this.firstChild[id] = -1
    this.nextSibling[id] = -1
    this.prevSibling[id] = -1

    this.availableIds.push(id)
  }

  /**
   * Cascades down the graph hierarchy, executing a callback for each node (Pre-order).
   * Useful for calculating World Transforms from parents to children.
   */
  public cascade(nodeId: NodeId, callback: (node: NodeId) => void): void {
    if (nodeId === -1 || !this.isValid(nodeId)) return

    callback(nodeId)

    let child = this.firstChild[nodeId]
    while (child !== -1) {
      this.cascade(child, callback)
      child = this.nextSibling[child]
    }
  }
}
