var rpcWorker = require('../src/worker');
var fib = x => x > 1 ? fib(x - 1) + fib(x - 2) : x;
rpcWorker.create({
    add: (x, y) => x + y,
    fib: fib
}, 'http://localhost:8124');


rpcWorker.create({
    add: (x, y) => x + y,
    fib: fib
}, 'http://localhost:8125');