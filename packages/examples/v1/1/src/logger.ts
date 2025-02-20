import { Instance } from 'v1/di/main.js'

@Instance()
export class Logger {
  info(message: string): void {
    console.log(message)
  }
}
