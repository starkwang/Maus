var rpcWorker = require('../src/worker');
var fib = x => x > 1 ? fib(x - 1) + fib(x - 2) : x;
rpcWorker.create({
    add: (x, y) => x + y,
    fib: fib,
    divide: (x,y) => x/y,
    divide2: (x,y) => dfsa.v/fasd.v,
    do: (v, f1, f2) => {
        console.log(v, f1, f2);
        console.log(f1(v));
        console.log(f2(f1(v)));
        return f2(f1(v));
    }
}, 'http://localhost:8124');
// rpcWorker.registerParkserver('http://localhost:8500', 'common', {
//     add: (x, y) => x + y,
//     divide: (x,y) => x/y,
//     fib: fib,
//     do: (v, f) => f(v)

// })
