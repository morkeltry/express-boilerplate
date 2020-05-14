const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');;
const cookieParser = require('cookie-parser');

const router = require('./controllers/index');
// const helpers = require ('./views/helpers');
const proxy = require('./proxy')

const app = express();


app.set('port', process.env.PORT || 8000);

app.use(cookieParser());
app.use('/', proxy);

// app.use(router);

module.exports = app;
