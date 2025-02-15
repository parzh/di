import { ConstructorOf } from './constructor-of.type.js'
import { ObjectRegistry } from './object-registry.js'

type InjectionUnknown = ConstructorOf<object, never>

export class Context {
  protected readonly consumerConstructorToInjectionsMap = new Map<ConstructorOf<object, never>, InjectionUnknown[]>()

  constructor(protected readonly registry = new ObjectRegistry()) { }

  register(entityConstructor: ConstructorOf<object, never>): this {
    if (this.registry.hasObjectCreator(entityConstructor)) {
      throw new Error(`Cannot register entity: "${entityConstructor.name}" is already registered`)
    }

    this.registry.addObjectCreator(entityConstructor, async (...dependencies) => new entityConstructor(...dependencies as never))
    this.consumerConstructorToInjectionsMap.set(entityConstructor, [])

    return this
  }

  protected getExistingInjections(consumerConstructor: ConstructorOf<object, never>): InjectionUnknown[] {
    if (!this.consumerConstructorToInjectionsMap.has(consumerConstructor)) {
      throw new Error(`Cannot get injections: "${consumerConstructor.name}" is not registered as a consumer`)
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
    const injections = this.getExistingInjections(consumerConstructor)
    const existingInjection = injections[parameterIndex]

    if (existingInjection) {
      const consumer = consumerConstructor.name
      const injected = injection.name
      const existing = existingInjection.name

      throw new Error(`Cannot inject "${injected}": consumer "${consumer}" already injects "${existing}" at index ${parameterIndex}`)
    }

    injections[parameterIndex] = injection

    return this
  }

  protected async resolveDependencies<
    Consumer extends object,
    Dependencies extends readonly object[],
  >(
    consumerConstructor: ConstructorOf<Consumer, Dependencies>,
  ): Promise<Dependencies> {
    const injections = this.getExistingInjections(consumerConstructor)
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
    if (!this.registry.hasObject(instanceConstructor)) {
      const dependencies = await this.resolveDependencies(instanceConstructor)

      await this.registry.prepareObject(instanceConstructor, dependencies)
    }

    const instance = this.registry.getObject<Instance>(instanceConstructor)

    return instance
  }

  instantiate<Consumer extends object>(consumerConstructor: ConstructorOf<Consumer, never>): Promise<Consumer> {
    return this.resolveInstance(consumerConstructor)
  }
}
