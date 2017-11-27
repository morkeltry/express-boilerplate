const searchResults = (input, cb)=> cb (null, [ {dataType : 'result', params: input} ])

const getResults = {
  get : (req, res) => {
    const { params } = req.params;
  console.log(params, 'params');
    searchResults (params, (err, results) => {
      if (err) {console.log('ERROR: ', err)}
      else {
        res.type('application/json');
        res.status(200);
        res.send(results);
        // res.render(results);
      }
    });
  }
}

module.exports = getResults;
