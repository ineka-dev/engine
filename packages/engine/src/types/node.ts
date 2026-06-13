/**
 * A type alias for Node IDs.
 * Represented as a 32-bit packed integer containing a 20-bit index and a 12-bit generation.
 * This guarantees safety against the ABA problem when nodes are destroyed and recycled.
 */
export type NodeId = number

export function createNodeId(index: number): NodeId {
  return index
}

export function getNodeIdIndex(id: NodeId): number {
  return id
}
