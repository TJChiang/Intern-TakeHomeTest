const express = require("express");
const bodyParser = require("body-parser");
const Home = require("./controllers/home");
const middlewareRateLimit = require("./middlewares/Rate-Limit");

const app = express();

/**
 * Express 設置
 */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**
 * Middleware
 */
app.use(middlewareRateLimit);

/**
 * HTTP Route
 */
app.get("/", Home);

app.listen(8080, () => {
    console.log("Server is started up at port: 8080");
});