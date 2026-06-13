/**
 * Specific error codes thrown by the engine to identify the source of the failure.
 */
export type EngineErrorCode =
  /** Thrown when a node-related operation fails or reaches limits (e.g. max nodes). */
  | 'NODE:FAILURE'
  /** Thrown when an engine-level internal initialization or operation fails. */
  | 'ENGINE:FAILURE'
  /** Thrown when a functional system fails during its execution. */
  | 'SYSTEM:FAILURE'
  /** Thrown when a user-provided engine lifecycle hook throws an exception. */
  | 'HOOK:FAILURE'
