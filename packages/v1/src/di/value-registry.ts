import { MaybePromise } from './maybe-promise.type.js'

// We reasonably limit token types because we want to stringify them without heavy heuristics
type Token = string | number | symbol | { readonly name: string }

function read(token: Token): string {
  return token instanceof Object ? token.name : token.toString()
}

interface Creator<O, Dependencies extends readonly unknown[]> {
  (...deps: Dependencies): MaybePromise<O>
}

export class ValueRegistry {
  protected readonly creators = new Map<Token, Creator<unknown, never>>()
  protected readonly values = new Map<Token, unknown>()

  hasCreator(token: Token): boolean {
    return this.creators.has(token)
  }

  addCreator<Value, Dependencies extends readonly unknown[]>(
    token: Token,
    creator: Creator<Value, Dependencies>,
  ): void {
    if (this.hasCreator(token)) {
      throw new Error(`Cannot add creator: creator for "${read(token)}" already added`)
    }

    this.creators.set(token, creator)
  }

  replaceCreator(
    token: Token,
    creator: Creator<unknown, never>,
  ): void {
    if (!this.hasCreator(token)) {
      throw new Error(`Cannot replace creator: creator for "${read(token)}" was not added`)
    }

    this.creators.set(token, creator)
  }

  has(token: Token): boolean {
    return this.values.has(token)
  }

  async prepare<Dependencies extends readonly unknown[]>(
    token: Token,
    dependencies: Dependencies,
  ): Promise<void> {
    if (this.has(token)) {
      throw new Error(`Cannot prepare value: "${read(token)}" is already prepared`)
    }

    const create = this.creators.get(token)

    if (!create) {
      throw new Error(`Cannot prepare value: creator for "${read(token)}" was not added`)
    }

    const value = await create(...dependencies as never)

    this.values.set(token, value)
  }

  get<Value>(token: Token): Value {
    if (!this.has(token)) {
      throw new Error(`Cannot get value: "${read(token)}" was not prepared`)
    }

    const value = this.values.get(token)!

    return value as Value
  }
}
