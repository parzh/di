import { ConstructorOf, Context } from './context.js'
import { createDecorators } from './create-decorators.js'
import { ObjectRegistry } from './object-registry.js'

const objectRegistry = new ObjectRegistry()
const context = new Context(objectRegistry)

export const { Instance, InstanceReplacement, Singleton, bootstrap } = createDecorators(context)

// Since ESM does not allow exporting an object as a set of named exports,
// here is a compile-time test for the consistency of the above exports:
// if createDecorators(…) returns something new, it must be exported here as well

// 1. Pretend to have a function that requires all decorators
declare function takesDecorators(decorators: ReturnType<typeof createDecorators>): void

// 2. Import itself
declare const exports: typeof import('./main.js')

// 3. Don't actually run the function, but make sure it would work if it ran;
false && takesDecorators(exports) // if this line says 'Property […] is missing', then the corresponding export is missing above
