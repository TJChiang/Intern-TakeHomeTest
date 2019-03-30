const redis = require("redis");
const express = require("express");

const REDIS_HOST = "127.0.0.1";
const REDIS_PORT = 6379;
const REQUEST_LIMIT = 1000;
const DURATION = 3600000;   // millisecond
const client = redis.createClient({ REDIS_HOST, REDIS_PORT });

let RateLimitData = {
    ip,
    count,
    resetTime
};

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

    // ip request >= 1000
    if (data.count >= REQUEST_LIMIT) {
        res.setHeader("X-RateLimit-Remaining", 0);
        res.setHeader("X-RateLimit-Reset", resetTime);
        res.status(429).send("Too Many Request");
        return;
    }

    data.count++;

    setDatabyIp(ip, data);

    let remainingCount = REQUEST_LIMIT - data.count;
    res.setHeader("X-RateLimit-Remaining", remainingCount);
    res.setHeader("X-RateLimit-Reset", resetTime);

    next();
};

function getDatabyIp(ip) {
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

function setDatabyIp(ip, data) {
    return new Promise((resolve, reject) => {
        const resetTime = data.resetTime;

        client.hset(ip, "ip", data.ip);
        client.hset(ip, "count", data.count);
        client.hset(ip, "resetTime", resetTime);

        client.expireat(ip, Math.floor(resetTime / 1000));

        resolve();
    });
}

