export interface ConstructorOf<Consumer extends object, Dependencies extends readonly object[]> {
  new(...dependencies: Dependencies): Consumer
}

export type ConstructorUnknown = ConstructorOf<object, never>
