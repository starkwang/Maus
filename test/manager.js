var rpcManager = require('../src/manager');
var express = require('express');
var app = express();

app.use('/js', express.static('./'));
app.use('/', express.static('./'));
app.listen(3000);

rpcManager.create(workers => {
    console.log('task start!')
    var fib = x => x > 1 ? fib(x - 1) + fib(x - 2) : x;
    // var startTime = new Date().getTime();
    // var result = fib(45);
    // var endTime = new Date().getTime();
    // console.log('native run time:', endTime - startTime, 'result:', result);

    var fibWorkers = function(x) {
        return new Promise((resolve, reject) => {
            workers.fib(x, r => resolve(r))
        })
    }


    var startTime = new Date().getTime();
    Promise.all([fibWorkers(42),fibWorkers(41), fibWorkers(43), fibWorkers(42)]).then(arr => {
        var result = arr.reduce((a, b) => a + b);
        console.log('\n\n==========\nresult:' + result + '\n==========\n');

        var endTime = new Date().getTime();
        console.log('DCS run time:', endTime - startTime, 'result:', result);
    })
}, 8124)

setTimeout(() => {
    rpcManager.start()
}, 8000);
