const Redis = require("redis")

const http = require("http")
// const url = require("url")
const Express = require("express")
const Faye = require("faye")

const jwt = require("jsonwebtoken")
const shortid = require("shortid")

const config = require("./config.js")[process.env.NODE_ENV || "development"]
const bayeuxExts = require("./bayeux.exts")
// const routes = require("./routes")

const redis = Redis.createClient(config.redisUrl)
const app = Express()
const server = http.createServer(app)

const bayeux = new Faye.NodeAdapter({
  mount: config.fayeMountPath,
  timeout: config.fayeTimeout
})
bayeux.attach(server)
// Extension to restrict publish:
// bayeux.addExtension(bayeuxExts.restrictNotifySubscription)
bayeux.addExtension(bayeuxExts.restrictNotifactionsSubscription)
bayeux.addExtension(bayeuxExts.restrictPublish)


app.post("/notify", Express.json({ strict: false }), (req, res) => {
  const getDevicesPipe = redis.pipeline()
  const saveNotifsPipe = redis.pipeline()
  const userNotifsPipe = redis.pipeline()
  const deviceIds = []

  const when = Date.now()
  const notifId = shortid()
  const targets = [...new Set(req.body.targets)] // prune duplicates
  const notifs = targets.map(forWhom => ({
    forWhom,
    when,
    notifId,
    what: req.body.content,
    type: req.body.type
  }))
  // 1. Publish a live update to the corrs. notif channel of forWhom using Faye
  // (Note: We need to ensure using Faye extension that only this server-side client can publish to these channels)
  const serverClient = bayeux.getClient()
  serverClient.addExtension(bayeuxExts.serverAddAuthKey)
  notifs.forEach((notif) => {
    serverClient.publish(`/notifications/${notif.forWhom}`, notif)
    // 2. Get deviceId(s) of each `forWhom` from Redis Sets target:<targetId>:devices
    getDevicesPipe.smembers(`target:${notif.forWhom}:devices`)
    // 3. Refernce this notif to the user's unread messages (redis sorted set)
    userNotifsPipe.zadd(`unread:user:${notif.forWhom}`, when, notifId)   
  })
  
  // 3. Send a Push Notification to those deviceId(s)
})

app.post("/register", Express.json({ strict: false }), (req, res) => {
  const { token, deviceId } = req.body
  let targetId
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    targetId = config.targetIdPath.split(".").reduce((prev, curr) => (prev ? prev[curr] : null), decoded)
  } catch (e) {
    return res.status(403).json({ error: true, reason: "Invalid Token" })
  }
  // Redis SADD target:<targetId>:devices <deviceId>
})

app.post("/deregister", Express.json({ strict: false }), (req, res) => {
  const { token, deviceId } = req.body
  let targetId
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    targetId = config.targetIdPath.split(".").reduce((prev, curr) => (prev ? prev[curr] : null), decoded)
  } catch (e) {
    return res.status(403).json({ error: true, reason: "Invalid Token" })
  }
  // Redis SREM target:<targetId>:devices <deviceId>
})



bayeux.getClient()
  .subscribe("/heartbeat/*")
  .withChannel((channel, data) => {

  })


server.listen(config.PORT)
