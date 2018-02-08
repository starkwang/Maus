# Maus 

A Tiny RPC Framework running in NodeJS or Browser


[![0.2.1](https://badge.fury.io/js/maus.svg)](https://badge.fury.io/js/maus)

------

# Install
```
npm install maus --save
```

------
# QuickStart

### worker.js

```js
var rpcWorker = require('maus').worker;
rpcWorker.create({
    add: (x, y) => x + y,
    divide: (x, y) => x / y,
    newRegExp: (reg, config) => new RegExp(reg, config),
    promiseAsync: () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(new Date()), 1000)
        })
    },
    calculate: (x, f) => f(x)
}, 'http://localhost:8124');
```
```
node worker.js
```
__Or you can webpack it and run it in browser!!!__

### manager.js

```js
var rpcManager = require('maus').manager;

var myManager = new rpcManager(8124);

myManager.do(workers => {
	var callback = result => console.log(result);
	
	workers.add(1, 1, callback); // return a number: 2
	workers.divide(100, 0, callback); // return a number: Infinity
	workers.newRegExp("abc", "ig", callback); // return a reg: /abc/ig
	workers.promiseAsync(callback); // return a Date
	
	//To write a recursion, you should use '__this' as the function itself 
	var fib = x => x > 1 ? __this(x - 1) + __this(x - 2) : x;
	workers.calculate(10, fib, callback);
})

```

```
node manager.js
```
------
# Usage
### 1、Worker
##### Worker.create(methodObject, path)

- methodObject: 

The methodObject contains some methods for RPC. Methods must return a value or a Promise. 

Support return type:
`Number`, `NaN`, `Infinity`, `Error`, `Undefined`, `String`, `Array`, `Boolean`, `Date`, `RegExp`, `Object`

Please use `Async` as suffix for some async method, like `httpGetAsync`、`readFileAsync`、`somePromiseAsync`:

```js
{
	add: (x, y) => x + y,
	date: () => new Date(),
	promiseAsync: () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve('promise'), 1000)
        })
    }
}
```

- path

The path of `Manager`


##### Worker.registerParkserver(path, workerType, methodObject)
- path

The path of `Parkserver`

- workerType

The type of worker, default value is `"default"`

- methodObject

Same as `methodObject` in  `Worker.create(methodObject, path)`.

```js
rpcWorker.registerParkserver('http://localhost:8500', 'common', {
    add: (x, y) => x + y,
    fib: fib,
    do: (v, f) => f(v)
})
```

### 2、Manager

##### Manager(port)
- port

The port that Manager listens to

```js
var myManager = new Manager(8124);
```

##### Manager.do(callback)
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

##### Manager.connectParkserver(path)
- path

The path of Parkserver

```js
Manager.connectParkserver('http://localhost:8500');
```

##### Manager.getWorker(config)

This method should be called after `Manager.connectParkserver `.

`config` has 3 attributes:

- `amount` _[number]_ optional: 

The amount of workers that you want to get. if this is not defined, the Manager will get all the available workers.

- `workerType` _[string]_ optional: 

The type of workers that you want to get. The default value is `"default"`.

- `address` _[string]_ required: The address of Manager

```js
Manager.connectParkserver('http://localhost:8500');
Manager.getWorker({
    amount: 2,
    workerType: 'common',
    address: 'http://localhost:8124'
}).do(workers => {
	//Do Something...
});
```
##### Manager.end
Release connected workers. Those workers will be reassigned by Parkserver.




### 3、Parkserver

Parkerver is an optional part of Maus. It will monitor working status of workers, assign suitable workers to Manager. You can use it to handle multiple Managers if needed.

Manager can get workers it wants through parkserver. If the Manager is died, the workers that assigned to it will be recollected by parkserver, and can be reassigned to other Managers.

##### Parkserver(port)
- port

The port that Parkserver listens to

```js
var parkserver = require('maus').parkserver;
var myParkserver = new parkserver(8500);
```
