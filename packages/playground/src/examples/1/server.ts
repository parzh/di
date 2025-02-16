import { Instance, Singleton } from '@/di/main.js'
import { Logger } from './logger.js'

@Instance()
export class Server {
  constructor(
    @Singleton(Logger)
    protected readonly logger: Logger,
  ) { }

  listen(port: number): void {
    this.logger.info(`Server is listening on port ${port} (probably)`)
  }
}
