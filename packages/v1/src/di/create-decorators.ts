import { Context, ConstructorOf, ConstructorUnknown } from './context.js'
import { MaybePromise } from './maybe-promise.type.js'

type ConsumerConstructor = ConstructorOf<object, readonly object[]>

export interface Program {
  run(): MaybePromise<void>
}

interface ContextDecorators {
  Instance: () => (constructor: ConstructorUnknown) => void

  Replacement:
    <Instance extends object, Dependencies extends readonly object[]>
    (Original: ConstructorOf<Instance, Dependencies>) =>
      (Replacement: ConstructorOf<Instance, Dependencies>) => void

  Singleton: (Dependency: ConstructorUnknown) => ParameterDecorator

  bootstrap(Program: ConstructorOf<Program, never>): Promise<void>
}

export const createDecorators = (context: Context): ContextDecorators => ({
  Instance: () => (constructor) => {
    context.registerConstructor(constructor)
  },

  Replacement: (Original) => (Replacement) => {
    context.replace(Original, Replacement)
  },

  Singleton: (Dependency) => (Consumer, key, parameterIndex) => {
    if (key !== undefined) {
      throw new Error('Injection decorator must be used on constructor parameters')
    }

    context.inject(Consumer as ConsumerConstructor, parameterIndex, Dependency)
  },

  async bootstrap(Program) {
    const program = await context.instantiate(Program)

    await program.run()
  },
})
