const express = require("express");

module.exports = (req, res, next) => {
    res.json({ result: true });
};