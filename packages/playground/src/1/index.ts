import { bootstrap, InstanceReplacement } from 'v1/di/main.js'
import { App } from './app.js'
import { Config } from './config.js'

@InstanceReplacement(Config)
class ConfigDev extends Config {
  override TLS = false
}

await bootstrap(App)
