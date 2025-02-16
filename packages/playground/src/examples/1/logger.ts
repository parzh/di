import { Instance } from '@/di/main.js'

@Instance()
export class Logger {
  info(message: string): void {
    console.log(message)
  }
}
