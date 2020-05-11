const { exec } = require("child_process");
const app = require('./app');

const port = app.get('port');

app.listen(port, () => {
  console.log('App running on port', port);
})
  .on('error', e=> {
    if (e.code==='EADDRINUSE') {
      console.log(e.message);
      exec(`netstat -tulp |grep ${port} |grep node`, (error, stdout, stderr) => {
        console.log(stdout.split('\n'));
        stdout = stdout.match(/(\d+)(?:\/node)/)[1];
        console.log('Maybe try:');
        console.log(`  kill -9 ${stdout}`);

        process.exit();
      });
    } else
    console.log(e);console.log(e.code);console.log(e.message);
  })


process.on('SIGHUP', () => { console.log("Bye bye!"); process.exit(); })
