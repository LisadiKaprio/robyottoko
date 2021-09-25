const { passwordHash } = require("../fn")

function Auth(userRepo, tokenRepo) {
  const getTokenInfo = (token) => tokenRepo.getByToken(token)
  const getUserById = (id) => userRepo.get({ id, status: 'verified' })

  return {
    getUserByNameAndPass: (name, plainPass) => {
      const user = userRepo.get({ name, status: 'verified' })
      if (!user || user.pass !== passwordHash(plainPass, user.salt)) {
        return null
      }
      return user
    },
    getUserAuthToken: (user_id) => tokenRepo.generateAuthTokenForUserId(user_id).token,
    destroyToken: (token) => tokenRepo.delete(token),
    addAuthInfoMiddleware: () => (req, res, next) => {
      const token = req.cookies['x-token'] || null
      const tokenInfo = getTokenInfo(token)
      if (tokenInfo && ['auth'].includes(tokenInfo.type)) {
        req.token = tokenInfo.token

        const user = userRepo.getById(tokenInfo.user_id)
        user.groups = userRepo.getGroups(user.id)
        if (!user.groups.includes('admin')) {
          // delete user.tmi_identity_username
          // delete user.tmi_identity_client_id
          delete user.tmi_identity_password
          delete user.tmi_identity_client_secret
        }
        delete user.pass
        delete user.salt
        req.user = user
        req.userWidgetToken = tokenRepo.getWidgetTokenForUserId(tokenInfo.user_id).token
        req.userPubToken = tokenRepo.getPubTokenForUserId(tokenInfo.user_id).token
      } else {
        req.token = null
        req.user = null
      }
      next()
    },
    userFromWidgetToken: (token) => {
      const tokenInfo = getTokenInfo(token)
      if (tokenInfo && ['widget'].includes(tokenInfo.type)) {
        return getUserById(tokenInfo.user_id)
      }
      return null
    },
    userFromPubToken: (token) => {
      const tokenInfo = getTokenInfo(token)
      if (tokenInfo && ['pub'].includes(tokenInfo.type)) {
        return getUserById(tokenInfo.user_id)
      }
      return null
    },
    wsTokenFromProtocol: (protocol) => {
      let proto = Array.isArray(protocol) && protocol.length === 2
        ? protocol[1]
        : protocol
      if (Array.isArray(protocol) && protocol.length === 1) {
        proto = protocol[0]
      }
      const tokenInfo = getTokenInfo(proto)
      if (tokenInfo && ['auth', 'widget', 'pub'].includes(tokenInfo.type)) {
        return tokenInfo
      }
      return null
    },
  }
}

module.exports = Auth
