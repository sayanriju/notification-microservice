const Redis = require("redis")

const http = require("http")
const url = require("url")
const Faye = require("faye")

const config = require("./config.js")

const redis = Redis.createClient(config.redisUrl)

const server = http.createServer((req, res) => {
  const { query } = url.parse(req.url, true)

})

/** Realtime stuff */
const bayeux = new Faye.NodeAdapter({ mount: config.fayeMountPath, timeout: 
config.fayeTimeout })
bayeux.attach(server)

bayeux.getClient()
  .subscribe("/location/*")
  .withChannel((channel, data) => {
    
  })

bayeux.getClient()
  .subscribe("/heartbeat/*")
  .withChannel((channel, data) => {

  })


server.listen(config.PORT)
