module.exports = {
  development: {
    PORT: process.env.PORT || 3000,
    requireAuth: process.env.REQUIRE_AUTH || false,
    jwtSecret: process.env.JWT_SECRET || "top secret",
    targetIdPath: "id",
    redisUrl: process.env.REDIS_URL || null,
    fayeMountPath: process.env.FAYE_MOUNT_PATH || "/faye",
    fayeTimeout: process.env.FAYE_TIMEOUT || 45,
    fayeServerAuthKey: process.env.FAYE_Server_AUTH_KEY || "TOP SECRET"
  }
}