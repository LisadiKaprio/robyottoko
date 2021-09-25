const Db = require("../Db")

const TABLE = 'user'

function Users(/** @type Db */ db) {
  return {
    all: () => db.getMany(TABLE),
    getById: (id) => db.get(TABLE, { id }),
    getByName: (name) => db.get(TABLE, { name }),
    save: (user) => db.upsert(TABLE, user, { id: user.id }),
    getGroups: (id) => {
      const rows = db._getMany(`
select g.name from user_group g inner join user_x_user_group x
where x.user_id = ?`, [id])
      return rows.map(r => r.name)
    },
    createUser: (user) => db.insert(TABLE, user),
  }
}

module.exports = Users
