import { ConstructorOf } from './constructor-of.type.js'
import { MaybePromise } from './maybe-promise.type.js'

interface ObjectCreator<O extends object = object, Dependencies extends readonly object[] = never> {
  (...deps: Dependencies): MaybePromise<O>
}

export class ObjectRegistry {
  protected readonly objectCreators = new Map<ConstructorOf<object, never>, ObjectCreator>()
  protected readonly objects = new Map<ConstructorOf<object, never>, object>()

  setObjectCreator<
    O extends object,
    Dependencies extends readonly object[],
  >(
    constructor: ConstructorOf<O, Dependencies>,
    createObject: ObjectCreator<O, Dependencies>,
  ): void {
    this.objectCreators.set(constructor, createObject)
  }

  hasObjectCreator(constructor: ConstructorOf<object, never>): boolean {
    return this.objectCreators.has(constructor)
  }

  addObjectCreator<
    O extends object,
    Dependencies extends readonly object[],
  >(
    constructor: ConstructorOf<O, Dependencies>,
    createObject: ObjectCreator<O, Dependencies>,
  ): void {
    if (this.hasObjectCreator(constructor)) {
      throw new Error(`Cannot add object creator: object creator for "${constructor.name}" already added`)
    }

    this.setObjectCreator(constructor, createObject)
  }

  hasObject(constructor: ConstructorOf<object, never>): boolean {
    return this.objects.has(constructor)
  }

  async prepareObject<
    Dependencies extends readonly object[],
  >(
    constructor: ConstructorOf<object, Dependencies>,
    dependencies: Dependencies,
  ): Promise<void> {
    if (this.hasObject(constructor)) {
      throw new Error(`Cannot prepare object: object "${constructor.name}" already prepared`)
    }

    const createObject = this.objectCreators.get(constructor)

    if (!createObject) {
      throw new Error(`Cannot prepare object: object creator for "${constructor.name}" was not added`)
    }

    const object = await createObject(...dependencies as never)

    this.objects.set(constructor, object)
  }

  getObject<O extends object>(constructor: ConstructorOf<O, never>): O {
    if (!this.hasObject(constructor)) {
      throw new Error(`Cannot get object: object "${constructor.name}" was not prepared`)
    }

    const object = this.objects.get(constructor)!

    return object as O
  }
}
