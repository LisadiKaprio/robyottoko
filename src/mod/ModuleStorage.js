const Db = require('../Db.js')
const { logger } = require('../fn.js')

const log = logger(__filename)

const TABLE = 'module'

class ModuleStorage {
  constructor(
    /** @type Db */ db,
    userId,
  ) {
    this.db = db
    this.userId = userId
  }
  load (key, def) {
    try {
      const where = { user_id: this.userId, key }
      const row = this.db.get(TABLE, where)
      const data = row ? JSON.parse('' + row.data) : null
      return data ? Object.assign({}, def, data) : def
    } catch (e) {
      log.error(e)
      return def
    }
  }
  save (key, rawData) {
    const where = { user_id: this.userId, key }
    const data = JSON.stringify(rawData)
    const dbData = Object.assign({}, where, {data})
    this.db.upsert(TABLE, dbData, where)
  }
}

module.exports = ModuleStorage
