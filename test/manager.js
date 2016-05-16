var rpcManager = require('../src/manager');
var express = require('express');
var app = express();

app.use('/js', express.static('./test'));
app.use('/', express.static('./test'));
app.listen(3000);

var a = new rpcManager(8124);


a.do(workers => {
    workers.fib(50, result => console.log(result));
})
