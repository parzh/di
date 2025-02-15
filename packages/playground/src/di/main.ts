import { ConstructorOf, Context } from './context.js'
import { createDecorators } from './create-decorators.js'
import { ObjectRegistry } from './object-registry.js'

const objectRegistry = new ObjectRegistry()
const context = new Context(objectRegistry)

export const { Instance, Singleton, bootstrap } = createDecorators(context)
