import { Logger } from './logger.js'

export class Server {
  constructor(protected readonly logger: Logger) { }

  listen(port: number): void {
    this.logger.info(`Server is listening on port ${port} (probably)`)
  }
}
