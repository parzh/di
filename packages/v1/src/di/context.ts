import { ConstructorUnknown, ConstructorOf } from './constructor-of.type.js'
import { ValueRegistry } from './value-registry.js'

class Logger {
  constructor(protected readonly id: number) { }

  log(...args: Parameters<typeof global.console['log']>): void {
    console.log(`[${this.id}]`, ...args)
  }
}

type Injections = readonly ConstructorUnknown[]

export class Context {
  static #instanceCount = 0
  protected static createId = () => this.#instanceCount += 1

  protected readonly id = Context.createId()
  protected readonly logger = new Logger(this.id)
  protected readonly injections = new Map<ConstructorUnknown, Injections>()
  protected readonly replacements = new Map<ConstructorUnknown, ConstructorUnknown>()

  constructor(protected readonly registry = new ValueRegistry()) { }

  registerConstructor(Entity: ConstructorUnknown): this {
    this.logger.log(`Registering "${Entity.name}" …`)

    if (!this.registry.hasCreator(Entity)) {
      this.registry.addCreator(Entity, async (...dependencies) => new Entity(...dependencies as never))
    }

    return this
  }

  protected getInjections(Consumer: ConstructorUnknown): Injections {
    if (!this.injections.has(Consumer)) {
      this.injections.set(Consumer, [])
    }

    return this.injections.get(Consumer)!
  }

  inject<
    Dependencies extends readonly object[],
    ParameterIndex extends number,
    Dependency extends Dependencies[ParameterIndex],
  >(
    Consumer: ConstructorOf<object, Dependencies>,
    parameterIndex: ParameterIndex,
    injection: ConstructorOf<Dependency, never>,
  ): this {
    this.logger.log(`Injecting "${injection.name}" into "${Consumer.name}" at index ${parameterIndex} …`)

    const injections = this.getInjections(Consumer)
    const existingInjection = injections[parameterIndex]

    if (existingInjection) {
      throw new Error(`Cannot inject "${injection.name}": consumer "${Consumer.name}" already injects "${existingInjection.name}" at index ${parameterIndex}`)
    }

    injections[parameterIndex] = injection

    return this
  }

  replace<
    Instance extends object,
    Dependencies extends readonly object[],
  >(
    Instance: ConstructorOf<Instance, Dependencies>,
    Replacement: ConstructorOf<Instance, Dependencies>,
  ): this {
    this.logger.log(`Replacing "${Instance.name}" with "${Replacement.name}" …`)

    const ExistingReplacement = this.replacements.get(Instance)

    if (ExistingReplacement) {
      throw new Error(`Cannot replace "${Instance.name}": it is already replaced by "${ExistingReplacement.name}"`)
    }

    const injections = this.getInjections(Instance)

    this.replacements.set(Instance, Replacement)
    this.injections.set(Replacement, injections)

    return this
  }

  protected async resolveDependencies<
    Consumer extends object,
    Dependencies extends readonly object[],
  >(
    Consumer: ConstructorOf<Consumer, Dependencies>,
  ): Promise<Dependencies> {
    this.logger.log(`Resolving dependencies for "${Consumer.name}" …`)

    const injections = this.getInjections(Consumer)
    const dependencies: object[] = []

    // can't use Promise.all(…): need to resolve in order
    // can't use injections.map(…): need to iterate holes
    for (const [parameterIndex, injection] of injections.entries()) {
      if (!injection) {
        throw new Error(`Cannot resolve dependencies: consumer "${Consumer.name}" has no injection at parameter at index ${parameterIndex}`)
      }

      const dependency = await this.resolveInstance(injection)

      dependencies.push(dependency)
    }

    return dependencies as readonly object[] as Dependencies
  }

  protected async resolveInstance<
    Instance extends object,
    Dependencies extends readonly object[],
  >(
    Instance: ConstructorOf<Instance, Dependencies>,
  ): Promise<Instance> {
    this.logger.log(`Resolving "${Instance.name}" …`)

    const Replacement = this.replacements.get(Instance)

    if (Replacement) {
      this.logger.log(`Found a replacement for "${Instance.name}": "${Replacement.name}"`)

      Instance = Replacement as ConstructorOf<Instance, Dependencies>
    }

    if (!this.registry.has(Instance)) {
      const dependencies = await this.resolveDependencies(Instance)

      this.logger.log(`Preparing instance of "${Instance.name}" …`)

      await this.registry.prepare(Instance, dependencies)
    }

    const instance = this.registry.get<Instance>(Instance)

    return instance
  }

  resolve<Consumer extends object>(Consumer: ConstructorOf<Consumer, never>): Promise<Consumer> {
    return this.resolveInstance(Consumer)
  }
}
