var rpcManager = require('../src/manager');
var express = require('express');
var app = express();

// app.use('/js', express.static('./test'));
// app.use('/', express.static('./test'));
// app.listen(3000);
var a = new rpcManager(8124);
a.do(workers => {
    // workers.add(1, 1, r => console.log(r))
    // workers.add(1, 1, r => console.log(r))
    // workers.add(1, 1, r => console.log(r))
    // workers.add(1, 1, r => console.log(r))
    workers.divide(10,0, (r, e) => console.log(r, e));
    workers.divide(10, (r, e) => console.log(r, e));
})
