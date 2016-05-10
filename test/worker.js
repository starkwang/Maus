var rpcWorker = require('../src/worker');
var fib = x => x > 1 ? fib(x - 1) + fib(x - 2) : x;
rpcWorker.create({
    add: (x, y) => x + y,
    promise: () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve('promise'), 1000)
        })
    },
    fib: fib
}, 'http://192.168.1.100:8124');