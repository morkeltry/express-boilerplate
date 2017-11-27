const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
// const exphbs = require ('express-handlebars');

const router = require('./controllers/index');
// const helpers = require ('./views/helpers');

const app = express();

app.set('port', process.env.PORT || 3000);

app.set ('views', path.join (__dirname, 'views'));
// app.set ('view engine', 'hbs' );
// const layoutsDir = path.join (__dirname,'views','layouts');
// app.engine ('hbs', exphbs ({
//   extname : 'hbs',
//   layoutsDir : layoutsDir,
//   partialsDir :  path.join (__dirname,'views','partials'),
//   defaultLayout : 'main',
//   helpers : helpers
//   })
// );


app.use(favicon(path.join(__dirname, '..', 'public', 'images', 'favicon.ico')));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(router);

module.exports = app;
