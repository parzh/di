import { Server } from './server.js'
import { Config } from './config.js'

export class App {
  constructor(
    protected readonly config: Config,
    protected readonly server: Server,
  ) { }

  start(): void {
    this.server.listen(this.config.PORT)
  }
}
