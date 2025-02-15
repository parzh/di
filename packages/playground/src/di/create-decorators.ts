import { Context, ConstructorOf } from './context.js'
import { MaybePromise } from './maybe-promise.type.js'

type ConstructorUnknown = ConstructorOf<object, never>
type ConsumerConstructor = ConstructorOf<object, readonly object[]>

export interface Program {
  run(): MaybePromise<void>
}

export function createDecorators(context: Context) {
  return {
    Instance: () => (constructor: ConstructorUnknown) => {
      context.register(constructor)
    },

    Singleton: (Dependency: ConstructorUnknown): ParameterDecorator => (Consumer, methodName, parameterIndex) => {
      if (methodName !== undefined) {
        throw new Error('@Singleton(…) decorator must be used on constructor parameters')
      }

      context.inject(Consumer as ConsumerConstructor, parameterIndex, Dependency)
    },

    bootstrap: async (programConstructor: ConstructorOf<Program, never>): Promise<void> => {
      const program = await context.instantiate(programConstructor)

      await program.run()
    },
  }
}
