import { Instance, Singleton } from '@/di/main.js'
import { Server } from './server.js'
import { Config } from './config.js'

@Instance()
export class App {
  constructor(
    @Singleton(Config)
    protected readonly config: Config,

    @Singleton(Server)
    protected readonly server: Server,
  ) { }

  run(): void {
    this.server.listen(this.config.PORT)
  }
}
