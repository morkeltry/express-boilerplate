const home = (req, res) =>
 { res.type('text/html'); res.status(200); res.send('<p>Hello World!</p>');
  // res.render('home', { params : {} });
}

module.exports = home;
