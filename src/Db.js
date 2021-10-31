import fs from 'fs'
import bsqlite from 'better-sqlite3'
import { logger } from './fn.ts'

import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

const log = logger(__filename)

class Db {
  constructor(dbConf) {
    this.conf = dbConf
    this.dbh = bsqlite(this.conf.file)
  }

  close() {
    this.dbh.close()
  }

  patch(verbose = true) {
    if (!this.get('sqlite_master', { type: 'table', name: 'db_patches' })) {
      this.run('CREATE TABLE db_patches ( id TEXT PRIMARY KEY);', [])
    }

    const files = fs.readdirSync(this.conf.patchesDir)
    const patches = (this.getMany('db_patches')).map(row => row.id)

    for (const f of files) {
      if (patches.includes(f)) {
        if (verbose) {
          log.info(`➡ skipping already applied db patch: ${f}`)
        }
        continue
      }
      const contents = fs.readFileSync(`${this.conf.patchesDir}/${f}`, 'utf-8')
      const all = contents.split(';').map(s => s.trim()).filter(s => !!s)
      try {
        this.dbh.transaction((all) => {
          for (const q of all) {
            if (verbose) {
              log.info(`Running: ${q}`)
            }
            this.run(q)
          }
          this.insert('db_patches', { id: f })
        })(all)

        log.info(`✓ applied db patch: ${f}`)
      } catch (e) {
        log.error(`✖ unable to apply patch: ${f} ${e}`)
        return
      }
    }
  }

  _buildWhere(where) {
    const wheres = []
    const values = []
    for (const k of Object.keys(where)) {
      if (where[k] === null) {
        wheres.push(k + ' IS NULL')
        continue
      }

      if (typeof where[k] === 'object') {
        let prop = '$nin'
        if (where[k][prop]) {
          if (where[k][prop].length > 0) {
            wheres.push(k + ' NOT IN (' + where[k][prop].map(_ => '?') + ')')
            values.push(...where[k][prop])
          }
          continue
        }
        prop = '$in'
        if (where[k][prop]) {
          if (where[k][prop].length > 0) {
            wheres.push(k + ' IN (' + where[k][prop].map(_ => '?') + ')')
            values.push(...where[k][prop])
          }
          continue
        }
        prop = '$gte'
        if (where[k][prop]) {
          wheres.push(k + ' >= ?')
          values.push(where[k][prop])
          continue
        }
        prop = '$lte'
        if (where[k][prop]) {
          wheres.push(k + ' <= ?')
          values.push(where[k][prop])
          continue
        }
        prop = '$gt'
        if (where[k][prop]) {
          wheres.push(k + ' > ?')
          values.push(where[k][prop])
          continue
        }
        prop = '$lt'
        if (where[k][prop]) {
          wheres.push(k + ' < ?')
          values.push(where[k][prop])
          continue
        }
        prop = '$ne'
        if (where[k][prop]) {
          wheres.push(k + ' != ?')
          values.push(where[k][prop])
          continue
        }

        // TODO: implement rest of mongo like query args ($eq, $lte, $in...)
        throw new Error('not implemented: ' + JSON.stringify(where[k]))
      }

      wheres.push(k + ' = ?')
      values.push(where[k])
    }

    return [
      wheres.length > 0 ? ' WHERE ' + wheres.join(' AND ') : '',
      values,
    ]
  }

  _buildOrderBy(orderBy) {
    const sorts = []
    for (const s of orderBy) {
      const k = Object.keys(s)[0]
      sorts.push(k + ' ' + (s[k] > 0 ? 'ASC' : 'DESC'))
    }
    return sorts.length > 0 ? ' ORDER BY ' + sorts.join(', ') : ''
  }

  _get(query, params = []) {
    return this.dbh.prepare(query).get(...params)
  }

  run(query, params = []) {
    return this.dbh.prepare(query).run(...params)
  }

  _getMany(query, params = []) {
    return this.dbh.prepare(query).all(...params)
  }

  get(table, where = {}, orderBy = []) {
    const [whereSql, values] = this._buildWhere(where)
    const orderBySql = this._buildOrderBy(orderBy)
    const sql = 'SELECT * FROM ' + table + whereSql + orderBySql
    return this._get(sql, values)
  }

  getMany(table, where = {}, orderBy = []) {
    const [whereSql, values] = this._buildWhere(where)
    const orderBySql = this._buildOrderBy(orderBy)
    const sql = 'SELECT * FROM ' + table + whereSql + orderBySql
    return this._getMany(sql, values)
  }

  delete(table, where = {}) {
    const [whereSql, values] = this._buildWhere(where)
    const sql = 'DELETE FROM ' + table + whereSql
    return this.run(sql, values)
  }

  exists(table, where) {
    return !!this.get(table, where)
  }

  upsert(table, data, check, idcol = null) {
    if (!this.exists(table, check)) {
      return this.insert(table, data)
    }
    this.update(table, data, check)
    if (idcol === null) {
      return 0 // dont care about id
    }

    return this.get(table, check)[idcol] // get id manually
  }

  insert(table, data) {
    const keys = Object.keys(data)
    const values = keys.map(k => data[k])
    const sql = 'INSERT INTO ' + table + ' (' + keys.join(',') + ') VALUES (' + keys.map(k => '?').join(',') + ')'
    return this.run(sql, values).lastInsertRowid
  }

  update(table, data, where = {}) {
    const keys = Object.keys(data)
    if (keys.length === 0) {
      return
    }
    const values = keys.map(k => data[k])
    const setSql = ' SET ' + keys.join(' = ?,') + ' = ?'
    const [whereSql, whereValues] = this._buildWhere(where)

    const sql = 'UPDATE ' + table + setSql + whereSql
    this.run(sql, [...values, ...whereValues])
  }
}

export default Db
