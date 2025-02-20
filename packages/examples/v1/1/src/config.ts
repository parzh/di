import { Instance } from 'v1/di/main.js'

@Instance()
export class Config {
  PORT = 3000
  TLS = true
}
