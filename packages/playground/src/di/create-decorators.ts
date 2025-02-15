import { Context, ConstructorOf } from './context.js'
import { MaybePromise } from './maybe-promise.type.js'

type ConstructorUnknown = ConstructorOf<object, never>
type ConsumerConstructor = ConstructorOf<object, readonly object[]>

export interface Program {
  run(): MaybePromise<void>
}

type RegistrationDecoratorFactory = () => (constructor: ConstructorUnknown) => void
type InjectionDecoratorFactory = (Dependency: ConstructorUnknown) => ParameterDecorator

interface ContextDecorators {
  Instance: RegistrationDecoratorFactory
  Singleton: InjectionDecoratorFactory
  bootstrap(Program: ConstructorOf<Program, never>): Promise<void>
}

export const createDecorators = (context: Context): ContextDecorators => ({
  Instance: () => (constructor) => {
    context.register(constructor)
  },

  Singleton: (Dependency) => (Consumer, key, parameterIndex) => {
    if (key !== undefined) {
      throw new Error('Injection decorator must be used on constructor parameters')
    }

    context.inject(Consumer as ConsumerConstructor, parameterIndex, Dependency)
  },

  async bootstrap(programConstructor) {
    const program = await context.instantiate(programConstructor)

    await program.run()
  },
})
