"use strict";
const express = require('express');
const app = express();
const Promise = require("bluebird");
const bodyParser = require('body-parser');
const fs=Promise.promisifyAll(require('fs'));
const path = require('path');
const ejs = require('ejs');
const router = require('./api/router');
const PORT = 666;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set("views", path.join(__dirname, "public"));
app.set("view engine", "ejs");

app.use(router);

var server = app.listen(PORT,"0.0.0.0", function () {
    console.log('Start At Port', PORT);
});