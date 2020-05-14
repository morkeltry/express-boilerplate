const fetch = require('node-fetch');
const { createProxyMiddleware } = require('http-proxy-middleware');

// const proxy = require('express-http-proxy');
const { modifyResponse } = require ('node-http-proxy-json');
const generateRandomToken = require('../doodle-generate-random');

const target='http://doodle.com';
const domainDoodle = 'doodle.com';
const domainProxy = 'localhost';


const requestsLog=[];
let byStatusCode=[];
let eventually;
const outputCollectedLogs = ()=> {
  console.log(requestsLog);

  console.log(`400s: ${byStatusCode.filter((e,i)=>(i>=400 && i<500))}`);
  console.log(`500s: ${byStatusCode.filter((e,i)=>i>=500)}`);
}

let fuse=0;
const contentIsHtml = ()=> !fuse++;

const logByStatusCode = (code, data)=> {
  if (!byStatusCode[code])
    byStatusCode[code]=[];
  byStatusCode[code].push(data);
}

const splitSetCookies = setCookiesString => {
  const expiresRegex = /xpires\s?=[a-zA-Z]{1,3},\s?/gi
  setCookiesString = setCookiesString.replace(expiresRegex, 'xpires = ');
  return setCookiesString.split(/,\s*/);
}

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

const handleOk = (proxyReq, proxyRes, res, status)=> {
  let fileLength=0;
  const contentType = res.headers.get('content-type')
  console.log(res.headers.get('set-cookie'));
  let cookies = splitSetCookies(
    res.headers.get('set-cookie')
      .replace(new RegExp(`.${domainDoodle}`, 'g'), domainProxy)
      .replace(new RegExp(domainDoodle, 'g'), domainProxy)
  );

  console.log('OK!!!-------------------------------------');
    // console.log(proxyReq);
    // // console.log(proxyRes);
    // console.log(res);
    // console.log(res.headers);
    // console.log(res.headers.date);
  console.log('Received cookies! ',cookies);
  console.log('\n\n____________________________________');
  console.log(proxyReq.method);
  console.log('\n\n____________________________________');
    requestsLog.push([
      res.url,
      res.headers.get('content-encoding') || contentType ,
      cookies.map (cookie=> cookie.slice(0, 20))

    ]); 
  console.log(':) -------------------------------------');

  proxyRes.header ('Content-Type', contentType);
  proxyRes.header ('Set-Cookie', cookies);
  proxyRes.writeHead(200, {});

  res.body
    .on('data', chunk=>{
      // console.log('chunk',chunk.length);
      fileLength += chunk.length;
      proxyRes.write(chunk);
    })
    // .pipe(proxyRes)
    .on('end', ()=>{
      requestsLog.push(fileLength);
      logByStatusCode(status, res.url);
      proxyRes.end();
    })


}

const handleError = (proxyReq, proxyRes, res, status)=> {
  // console.log(proxyReq);
  // console.log(proxyRes);
  console.log(res);
  logByStatusCode(status, res.url);

  // set headers, eg Cloudflare

  proxyRes.writeHead(200)
  proxyRes.end();
}

const handleRedir = (proxyReq, proxyRes, res, status)=> {
  // console.log(proxyReq, proxyRes, res);
  console.log('Thassa redirect, yo!');
  logByStatusCode(status, res.url);
}




// NB fetch's auto redirect seems to work for now - moght need to change some headers, tho.
const proxyFromScratch = async (proxyReq, proxyRes, next)=> {
  let options = {
    // method : 'POST',
    // redirect : 'manual',
  }
  // console.log('req.url:',proxyReq.url);
  // console.log(Object.keys(proxyReq));
  // console.log('req:',trimreq(proxyReq));

  options.headers = { ...options.headers,
    'Accept-Encoding': 'identity', 'x-no-compression':true ,
  };
  if (proxyReq.method==='POST')
    options = { ...options,
      method: 'POST',
      body : (proxyReq.url==='')
              ? '{"accessToken":null,"anonymous":true}'
              : ''
    };

  console.log('options',options);

  console.log('\n\nWILL FETCH:');
  console.log('proxyReq.url',proxyReq.url);
  console.log('proxyReq.method',proxyReq.method);


  await fetch (target+proxyReq.originalUrl, options)
    .then(res=> {
      console.log('proxyReq.url',proxyReq.url);
      console.log('options.method',options.method);

      let status = [res.status.toString()[0], res.status]
      console.log(status);
      switch (status[0]) {
        case '3' : handleRedir(proxyReq, proxyRes, res, status[1]);
          break;
        case '2' : handleOk(proxyReq, proxyRes, res, status[1]);
          break;
        case '4' : switch (status[1]) {
            case 400 : handleError(proxyReq, proxyRes, res, status[1]);
              break;
            case 403 : handleError(proxyReq, proxyRes, res, status[1]);
              break;
            case 404 : handleError(proxyReq, proxyRes, res, status[1]);
              break;
            default : handleError(proxyReq, proxyRes, res, status[1]);
          }
          break;
        case '5' : handleError(proxyReq, proxyRes, res, status[1]);
          break;
        default : handleError(proxyReq, proxyRes, res, status[1]);
      }

    })
    .catch(e=> {console.log(e);} )

    clearTimeout(eventually);
    eventually = setTimeout (outputCollectedLogs, 5000);


  return next();
}

module.exports = proxyFromScratch;
