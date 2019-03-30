const redis = require("redis");
const express = require("express");

/**
 * Redis
 * Host: 127.0.0.1
 * Port: 6379
 * Rate Limit: 1000
 * ResetTime: 1 hour = 3600000 ms
 */
const REDIS_HOST = "127.0.0.1";
const REDIS_PORT = 6379;
const REQUEST_LIMIT = 1000;
const DURATION = 3600000;
const client = redis.createClient({ REDIS_HOST, REDIS_PORT });

client.on("connect", () => {
    console.log("Redis client connected");
});

client.on("error", (err) => {
    console.log("" + err);
});

module.exports = async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const data = await getDatabyIp(ip);
    const resetTime = new Date(data.resetTime).toString();

    /**
     * IP 請求數超過1000
     * 剩餘請求數量
     * Rate Limit 歸零的時間
     */
    if (data.count > REQUEST_LIMIT) {
        res.setHeader("X-RateLimit-Remaining", 0);
        res.setHeader("X-RateLimit-Reset", resetTime);
        res.status(429).send("Too Many Request");
        return;
    }

    // IP 請求數+1
    data.count++;

    // 更新 Redis Server 中對應 IP 的資料
    setDatabyIp(ip, data);

    // 剩餘請求數
    let remainingCount = REQUEST_LIMIT - data.count;
    res.setHeader("X-RateLimit-Remaining", remainingCount);
    res.setHeader("X-RateLimit-Reset", resetTime);

    next();
};

/**
 * 取得 Redis Server 中對應 IP 的資料
 */
function getDatabyIp(ip) {
    let RateLimitData = {};

    return new Promise((resolve, reject) => {
        client.hgetall(ip, (err, result) => {
            if (err) {
                reject(err);
                return;
            }

            RateLimitData[ip] = {
                ip,
                count: result ? parseInt(result.count) : 0,
                resetTime: result ? parseInt(result.resetTime) : (new Date().valueOf() + DURATION)
            };

            resolve(RateLimitData[ip]);
        });
    });
}

/**
 * 設定 Redis Server 中對應 IP 的資料
 */
function setDatabyIp(ip, data) {
    return new Promise((resolve, reject) => {
        const resetTime = data.resetTime;

        /**
         * Key: ip
         * value: ip, count, resetTime
         */
        client.hset(ip, "ip", data.ip);
        client.hset(ip, "count", data.count.toString());
        client.hset(ip, "resetTime", resetTime.toString());

        // 最小單位為"秒"
        client.expireat(ip, Math.floor(resetTime / 1000));

        resolve();
    });
}

