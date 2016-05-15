#Maus 

A Simple JSON-RPC Framework running in NodeJS or Browser, based on websocket.


[![0.2.1](https://badge.fury.io/js/maus.svg)](https://badge.fury.io/js/maus)

------

#Install
```
npm install maus --save
```

------
#QuickStart

###worker.js

```js
var rpcWorker = require('maus').worker;
rpcWorker.create({
    add: (x, y) => x + y,
    promiseAsync: () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve('promise'), 1000)
        })
    },
    calculate: (x, f) => f(x)
}, 'http://localhost:8124');
```
```
node worker.js
```
__Or you can webpack it and run it in browser!!!__

------
###manager.js

```js
var rpcManager = require('maus').manager;

var myManager = new rpcManager(8124);

myManager.do(workers => {
	var log = result => console.log(result);
	
	workers.add(1, 1, log);
	workers.promiseAsync(log);
	//To write a recursion, you should use '__this' as the function itself 
	var fib = x => x > 1 ? __this(x - 1) + __this(x - 2) : x;
	workers.calculate(10, fib, log);
})

```

```
node manager.js
```
------
#Usage
###1、Worker
#####Worker.create(methodObject, path)

- methodObject: 

The methodObject contains some methods for RPC. Methods must return a value or a Promise. Please use `Async` as suffix for some async method, like `httpGetAsync`、`readFileAsync`、`somePromiseAsync`:

```js
{
	add: (x, y) => x + y,
	promiseAsync: () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve('promise'), 1000)
        })
    }
}
```

- path

The path of `Manager`


###2、Manager

#####Manager(port)
- port

The port that Manager listens to

```js
var myManager = new Manager(8124);
```

#####Manager.do(callback)
- callback

The callback function will be executed after init. It will gets a `workers static` as arguments, which contains all the methods in `Worker`

```js
Manager.do(workers => {
    console.log('task start!')
    workers.promiseAsync(result => console.log(result));
    workers.add(1, 1, result => console.log(result));
});
```

The params of methods in `Worker` can be a `Number`, `Object`, `String`, `Array`, or even `Function`. Please use `__this` as the function itself in any recursion algorithm, such as:

```js
var fib = x => x > 1 ? __this(x - 1) + __this(x - 2) : x;
```