const express = require("express");
const bodyParser = require("body-parser");

const Home = require("./controllers/home");
const RateLimit = require("./middlewares/Rate-Limit");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(RateLimit);
app.get("/", Home);

app.listen(8080, () => {
    console.log("Server is started up at port: 8080");
});