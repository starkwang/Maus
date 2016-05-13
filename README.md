#Maus 
[![npm version](https://badge.fury.io/js/maus.svg)](https://badge.fury.io/js/maus)

A Simple JSON-RPC Framework running in NodeJS or Browser, based on websocket.

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
    }
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

rpcManager.create(workers => {
    console.log('task start!')
    workers.promiseAsync(result => console.log('result for promise:', result));
    workers.add(1, 1, result => console.log('result for add(1,1):', result));
}, 8124)

//task start after 5s
setTimeout(() => {
    rpcManager.start()
}, 5000);

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

#####Manager.create(callback, port)

- callback

The callback function will be executed after `Manager.start()`. It will gets a `workers static` as arguments, which contains all the methods in `Worker`

```js
Manager.create(workers => {
    console.log('task start!')
    workers.promiseAsync(result => console.log(result));
    workers.add(1, 1, result => console.log(result));
}, 8124)
```

- port

The port that Manager listens to

#####Manager.start()

- Start the callback in Manager