import { Instance, Singleton } from '@/di/main.js'
import { Server } from './server.js'
import { Config } from './config.js'
import { Logger } from './logger.js'

@Instance()
export class App {
  constructor(
    @Singleton(Config)
    protected readonly config: Config,

    @Singleton(Server)
    protected readonly server: Server,

    @Singleton(Logger)
    protected readonly logger: Logger,
  ) { }

  run(): void {
    if (this.config.TLS) {
      this.server.establishTLS()
    } else {
      this.logger.info('TLS is disabled')
    }

    this.server.listen(this.config.PORT)
  }
}
