import { readFileSync } from 'fs'
import { Config } from './types'

const init = (): Config => {
  const configFile = process.env.APP_CONFIG || ''
  if (configFile === '') {
    process.exit(2)
  }
  return JSON.parse(String(readFileSync(configFile)))
}
const config: Config = init()

export default config
