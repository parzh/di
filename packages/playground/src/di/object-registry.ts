import { MaybePromise } from './maybe-promise.type.js'

// We reasonably limit token types because we want to stringify them without heavy heuristics
type Token = string | number | symbol | { readonly name: string }

function read(token: Token): string {
  return token instanceof Object ? token.name : token.toString()
}

interface ObjectCreator<O extends object, Dependencies extends readonly unknown[]> {
  (...deps: Dependencies): MaybePromise<O>
}

export class ObjectRegistry {
  protected readonly objectCreators = new Map<Token, ObjectCreator<object, never>>()
  protected readonly objects = new Map<Token, object>()

  hasObjectCreator(token: Token): boolean {
    return this.objectCreators.has(token)
  }

  addObjectCreator<O extends object, Dependencies extends readonly object[]>(
    token: Token,
    createObject: ObjectCreator<O, Dependencies>,
  ): void {
    if (this.hasObjectCreator(token)) {
      throw new Error(`Cannot add object creator: object creator for "${read(token)}" already added`)
    }

    this.objectCreators.set(token, createObject)
  }

  hasObject(token: Token): boolean {
    return this.objects.has(token)
  }

  async prepareObject<Dependencies extends readonly object[]>(
    token: Token,
    dependencies: Dependencies,
  ): Promise<void> {
    if (this.hasObject(token)) {
      throw new Error(`Cannot prepare object: object "${read(token)}" already prepared`)
    }

    const createObject = this.objectCreators.get(token)

    if (!createObject) {
      throw new Error(`Cannot prepare object: object creator for "${read(token)}" was not added`)
    }

    const object = await createObject(...dependencies as never)

    this.objects.set(token, object)
  }

  getObject<O extends object>(token: Token): O {
    if (!this.hasObject(token)) {
      throw new Error(`Cannot get object: object "${read(token)}" was not prepared`)
    }

    const object = this.objects.get(token)!

    return object as O
  }
}
