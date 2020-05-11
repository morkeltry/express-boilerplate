const fetch = require('node-fetch');
const { createProxyMiddleware } = require('http-proxy-middleware');

// const proxy = require('express-http-proxy');
const { modifyResponse } = require ('node-http-proxy-json');


const target='http://doodle.com';

const collectedHeaders=[];
let eventually;
const outputCollectedHeaders = ()=> {
  console.log(collectedHeaders);
}

let fuse=0;
const contentIsHtml = ()=> !fuse++;


function logReqRes(proxyReq, req, res) {
  console.log(proxyReq);
  console.log(req);
  console.log(res);
}
const trimreq = ({ headers, rawHeaders, url, method, statusCode, statusMessage, baseUrl, originalUrl, params, query, client })=>
  ({ headers, rawHeaders, url, method, statusCode, statusMessage, baseUrl, originalUrl, params, query });

const myProxy = createProxyMiddleware({
  target,
  changeOrigin : false,
  followRedirects : false,
  // onProxyReq : logReqRes,
  onProxyRes : logReqRes,
})

// const myProxy = proxy(target, {
//   changeOrigin: true,
//   logLevel: 'debug',
//   pathRewrite: (path, req) => path.replace('/api', '/_ajax'),
//   onProxyRes(proxyRes, req, res) {
//
//     delete proxyRes.headers['content-length'];
//
//     modifyResponse(res, proxyRes.headers['content-encoding'], function (body) {
//       if (body) {
//         // modify some information
//         body.version = 2;
//         body.props = {
//           "nestedProps": true
//         };
//       }
//       return body;
//     });
//   },
// });

const handleOk = (proxyReq, proxyRes, res)=> {
  let fileLength=0;
  console.log('OK!!!-------------------------------------');
    // console.log(proxyReq);
    // console.log(proxyRes);
    console.log(res);
    console.log(res.headers);
    console.log(res.headers.date);
    collectedHeaders.push([
      res.url,
      res.headers.get('content-encoding') || res.headers.get('content-type') ,

    ]);
  console.log(':) -------------------------------------');
  if (contentIsHtml())
    proxyRes.writeHead(200, {'Content-Type' : 'text/html;charset=UTF-8'})
  else
    proxyRes.writeHead(200);

  res.body
    .on('data', chunk=>{
      // console.log('chunk',chunk.length);
      fileLength += chunk.length;
      proxyRes.write(chunk);
    })
    // .pipe(proxyRes)
    .on('end', ()=>{
      collectedHeaders.push(fileLength)
      proxyRes.end();
    })


}

const handleError = (proxyReq, proxyRes, res)=> {
  // console.log(proxyReq);
  // console.log(proxyRes);
  console.log(res);
}

const handleRedir = (proxyReq, proxyRes, res)=> {
  console.log(proxyReq, proxyRes, res);
  console.log('Thassa redirect, yo!');
}




// NB fetch's auto redirect seems to work for now - moght need to change some headers, tho.
const proxyFromScratch = async (proxyReq, proxyRes, next)=> {
  const options = {
    // method : 'POST',
    // redirect : 'manual',
  }
  // console.log('req.url:',proxyReq.url);
  // console.log(Object.keys(proxyReq));
  // console.log('req:',trimreq(proxyReq));

  options.headers = { ...options.headers, 'Accept-Encoding': 'identity', 'x-no-compression':true }

  await fetch (target+proxyReq.originalUrl, options)
    .then(res=> {
      let status = [res.status.toString()[0], res.status]
      console.log(status);
      switch (status[0]) {
        case '3' : handleRedir(proxyReq, proxyRes, res);
          break;
        case '2' : handleOk(proxyReq, proxyRes, res);
          break;
        case '4' : switch (status[1]) {
            case 400 : handleError(proxyReq, proxyRes, res);
              break;
            case 403 : handleError(proxyReq, proxyRes, res);
              break;
            case 404 : handleError(proxyReq, proxyRes, res);
              break;
            default : handleError(proxyReq, proxyRes, res);
          }
          break;
        case '5' : handleError(proxyReq, proxyRes, res);
          break;
        default : handleError(proxyReq, proxyRes, res);
      }

    })
    .catch(e=> {console.log(e);} )

    clearTimeout(eventually);
    eventually = setTimeout (outputCollectedHeaders, 2000);


  return next();
}

module.exports = proxyFromScratch;
