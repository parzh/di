import { App } from './app.js'
import { context } from './context.js'

const app = await context.instantiate(App)

app.start()
