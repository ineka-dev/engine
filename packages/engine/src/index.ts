/**
 *  ___  ________   _______   ___  __    ________
 * |\  \|\   ___  \|\  ___ \ |\  \|\  \ |\   __  \
 * \ \  \ \  \\ \  \ \   __/|\ \  \/  /|\ \  \|\  \
 *  \ \  \ \  \\ \  \ \  \_|/_\ \   ___  \ \   __  \
 *   \ \  \ \  \\ \  \ \  \_|\ \ \  \\ \  \ \  \ \  \
 *    \ \__\ \__\\ \__\ \_______\ \__\\ \__\ \__\ \__\
 *     \|__|\|__| \|__|\|_______|\|__| \|__|\|__|\|__|
 */

/*! Ineka | MIT License | github.com/ineka-dev/engine */

// Core:
export { Engine, type SystemFunction, type EngineContext, type Plugin, type EngineEvents } from './core/Engine'
export { EventEmitter } from './core/EventEmitter'
export { defineTrait } from './core/Trait'
export type { TraitDefinition, TraitInstance, TraitInitializer, TraitDataSchema } from './core/Trait'
export * from './core/Trait'
export * from './core/Query'
export * from './core/Time'
export { Graph } from './core/Graph'

// API:
export * from './api/trait'
export * from './api/graph'
export * from './api/system'
// Plugins:
export * from './plugins/transform'

// Built-in Traits:
export { Transform, setWorldPosition, setWorldRotation } from './traits/Transform'
export { Velocity } from './traits/Velocity'

// Errors:
export { EngineError } from './errors/EngineError'

// Types:
export type { EngineOptions } from './types/options'
export type { EngineErrorCode } from './types/errors'
export * from './types/node'
