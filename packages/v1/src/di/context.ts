import { ObjectRegistry } from './object-registry.js'

class Logger {
  constructor(protected readonly id: number) { }

  log(...args: Parameters<typeof global.console['log']>): void {
    console.log(`[${this.id}]`, ...args)
  }
}

export interface ConstructorOf<Consumer extends object, Dependencies extends readonly object[]> {
  new(...dependencies: Dependencies): Consumer
}

type InjectionUnknown = ConstructorOf<object, never>

export class Context {
  static #instanceCount = 0
  protected static createId = () => this.#instanceCount += 1

  protected readonly id = Context.createId()
  protected readonly logger = new Logger(this.id)
  protected readonly consumerConstructorToInjectionsMap = new Map<ConstructorOf<object, never>, InjectionUnknown[]>()
  protected readonly replacements = new ObjectRegistry()

  constructor(protected readonly registry = new ObjectRegistry()) { }

  register(entityConstructor: ConstructorOf<object, never>): this {
    this.logger.log(`Registering "${entityConstructor.name}" …`)

    if (!this.registry.hasObjectCreator(entityConstructor)) {
      this.registry.addObjectCreator(entityConstructor, async (...dependencies) => new entityConstructor(...dependencies as never))
    }

    return this
  }

  protected getInjections(consumerConstructor: ConstructorOf<object, never>): InjectionUnknown[] {
    if (!this.consumerConstructorToInjectionsMap.has(consumerConstructor)) {
      this.consumerConstructorToInjectionsMap.set(consumerConstructor, [])
    }

    return this.consumerConstructorToInjectionsMap.get(consumerConstructor)!
  }

  inject<
    Dependencies extends readonly object[],
    ParameterIndex extends number,
    Dependency extends Dependencies[ParameterIndex],
  >(
    consumerConstructor: ConstructorOf<object, Dependencies>,
    parameterIndex: ParameterIndex,
    injection: ConstructorOf<Dependency, never>,
  ): this {
    const consumer = consumerConstructor.name
    const injected = injection.name

    this.logger.log(`Injecting "${injected}" into "${consumer}" at index ${parameterIndex} …`)

    const injections = this.getInjections(consumerConstructor)
    const existingInjection = injections[parameterIndex]

    if (existingInjection) {
      throw new Error(`Cannot inject "${injected}": consumer "${consumer}" already injects "${existingInjection.name}" at index ${parameterIndex}`)
    }

    injections[parameterIndex] = injection

    return this
  }

  replace<
    Instance extends object,
    Dependencies extends readonly object[],
  >(
    originalConstructor: ConstructorOf<Instance, Dependencies>,
    replacementConstructor: ConstructorOf<Instance, Dependencies>,
  ): this {
    this.logger.log(`Replacing "${originalConstructor.name}" with "${replacementConstructor.name}" …`)

    this.replacements.addObjectCreator(originalConstructor, async (...dependencies) => new replacementConstructor(...dependencies as Dependencies))

    const injections = this.getInjections(originalConstructor)
    this.consumerConstructorToInjectionsMap.set(replacementConstructor, injections)

    return this
  }

  protected async resolveDependencies<
    Consumer extends object,
    Dependencies extends readonly object[],
  >(
    consumerConstructor: ConstructorOf<Consumer, Dependencies>,
  ): Promise<Dependencies> {
    this.logger.log(`Resolving dependencies for "${consumerConstructor.name}" …`)

    const injections = this.getInjections(consumerConstructor)
    const dependencies: object[] = []

    // can't use Promise.all(…): need to resolve in order
    // can't use injections.map(…): need to iterate holes
    for (const [parameterIndex, injection] of injections.entries()) {
      if (!injection) {
        throw new Error(`Cannot resolve dependencies: consumer "${consumerConstructor.name}" has no injection at parameter at index ${parameterIndex}`)
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
    instanceConstructor: ConstructorOf<Instance, Dependencies>,
  ): Promise<Instance> {
    this.logger.log(`Resolving "${instanceConstructor.name}" …`)

    let registry = this.registry

    if (this.replacements.hasObjectCreator(instanceConstructor)) {
      this.logger.log(`Found a replacement for "${instanceConstructor.name}"`)

      registry = this.replacements
    }

    if (!registry.hasObject(instanceConstructor)) {
      const dependencies = await this.resolveDependencies(instanceConstructor)

      this.logger.log(`Preparing instance of "${instanceConstructor.name}" …`)

      await registry.prepareObject(instanceConstructor, dependencies)
    }

    const instance = registry.getObject<Instance>(instanceConstructor)

    return instance
  }

  instantiate<Consumer extends object>(consumerConstructor: ConstructorOf<Consumer, never>): Promise<Consumer> {
    return this.resolveInstance(consumerConstructor)
  }
}
