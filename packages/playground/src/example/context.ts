import { Context } from '@/di/context.js'
import { App } from './app.js'
import { Config } from './config.js'
import { Logger } from './logger.js'
import { Server } from './server.js'

export const context = new Context()
  .register(Config)
  .register(Logger)
  .register(Server)
  .inject(Server, 0, Logger)
  .register(App)
  .inject(App, 0, Config)
  .inject(App, 1, Server)
