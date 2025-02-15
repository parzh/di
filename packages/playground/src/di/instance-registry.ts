import { ConstructorOf } from './constructor-of.type.js'
import { MaybePromise } from './maybe-promise.type.js'

interface InstanceCreator<Instance extends object = object, Dependencies extends readonly object[] = never> {
  (...deps: Dependencies): MaybePromise<Instance>
}

export class InstanceRegistry {
  protected readonly instanceCreators = new Map<ConstructorOf<object, never>, InstanceCreator>()
  protected readonly instances = new Map<ConstructorOf<object, never>, object>()

  setInstanceCreator<
    Instance extends object,
    Dependencies extends readonly object[],
  >(
    constructor: ConstructorOf<Instance, Dependencies>,
    createInstance: InstanceCreator<Instance, Dependencies>,
  ): void {
    this.instanceCreators.set(constructor, createInstance)
  }

  hasInstanceCreator(constructor: ConstructorOf<object, never>): boolean {
    return this.instanceCreators.has(constructor)
  }

  addInstanceCreator<
    Instance extends object,
    Dependencies extends readonly object[],
  >(
    constructor: ConstructorOf<Instance, Dependencies>,
    createInstance: InstanceCreator<Instance, Dependencies>,
  ): void {
    if (this.hasInstanceCreator(constructor)) {
      throw new Error(`Cannot add instance creator: instance creator for "${constructor.name}" already added`)
    }

    this.setInstanceCreator(constructor, createInstance)
  }

  hasInstance(constructor: ConstructorOf<object, never>): boolean {
    return this.instances.has(constructor)
  }

  async prepareInstance<
    Dependencies extends readonly object[],
  >(
    constructor: ConstructorOf<object, Dependencies>,
    dependencies: Dependencies,
  ): Promise<void> {
    if (this.hasInstance(constructor)) {
      throw new Error(`Cannot prepare instance: instance for "${constructor.name}" already prepared`)
    }

    const createInstance = this.instanceCreators.get(constructor)

    if (!createInstance) {
      throw new Error(`Cannot prepare instance: instance creator for "${constructor.name}" was not added`)
    }

    const instance = await createInstance(...dependencies as never)

    this.instances.set(constructor, instance)
  }

  getInstance<Instance extends object>(constructor: ConstructorOf<Instance, never>): Instance {
    if (!this.hasInstance(constructor)) {
      throw new Error(`Cannot get instance: instance for "${constructor.name}" was not prepared`)
    }

    const instance = this.instances.get(constructor)!

    return instance as Instance
  }
}
