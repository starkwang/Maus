var rpcManager = require('../src/manager');
var express = require('express');
var app = express();

app.use('/js', express.static('./test'));
app.use('/', express.static('./test'));
app.listen(3000);

var a = new rpcManager(8124);

setInterval(() => {
    a.do(workers => {
        workers.fib(40, r => console.log(r));
        workers.fib(39, r => console.log(r));
        workers.fib(38, r => console.log(r));
    })
}, 1000);
