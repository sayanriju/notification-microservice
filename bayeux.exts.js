const config = require("./config.js")[process.env.NODE_ENV || "development"]

module.exports = {

  restrictNotifySubscription: {
    incoming(message, cb) {
      // Subscription restriction:
      if (message.channel !== "/meta/subscribe") return cb(message) // allow pass through!
      const subscription = message.subscription
      if (subscription !== "/notify") return cb(message)  // allow pass through!
      const msgAuthKey = (message.ext && message.ext.authKey) || message.authKey
      if (msgAuthKey !== config.fayeServerAuthKey) {
        message.error = "403::Unauthorized Subscription Attempt"  // eslint-disable-line no-param-reassign
      }
      return cb(message)
    },
    outgoing(message, cb) {
      if (message.ext) {
        delete message.ext.authKey  // eslint-disable-line no-param-reassign
        delete message.authKey // eslint-disable-line no-param-reassign
      }
      cb(message)
    }
  },

  restrictPublish: {
    incoming(message, cb) {
      if (!message.channel.match(/^\/meta\//)) {
        const msgAuthKey = (message.ext && message.ext.authKey) || message.authKey
        if (msgAuthKey !== config.fayeServerAuthKey) {
          message.error = "403::Unauthorized Publish Attempt"  // eslint-disable-line no-param-reassign
        }
      }
      cb(message)
    },
    outgoing(message, cb) {
      if (message.ext) {
        delete message.ext.authKey  // eslint-disable-line no-param-reassign
        delete message.authKey // eslint-disable-line no-param-reassign
      }
      cb(message)
    }
  },

  serverAddAuthKey: {
    outgoing(message, callback) {
      if (message.channel !== '/meta/subscribe') return callback(message);
    // Add ext field if it's not present
      if (!message.ext) message.ext = {}  // eslint-disable-line no-param-reassign
    // Set the auth token
      message.ext.authKey = config.authKey  // eslint-disable-line no-param-reassign
    // Carry on and send the message to the server
      return callback(message);
    }
  }

}