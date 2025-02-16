export interface ConstructorOf<Consumer extends object, Dependencies extends readonly object[]> {
  new(...dependencies: Dependencies): Consumer
}
