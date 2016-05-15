var rpcWorker = require('../src/worker');
var fib = x => x > 1 ? fib(x - 1) + fib(x - 2) : x;
rpcWorker.create({
    add: (x, y) => x + y,
    fib: fib,
    do: (v, f) => f(v)
}, 'http://localhost:8124');
