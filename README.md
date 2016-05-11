#Maus

A Simple JSON-RPC Framework Based on Websocket


#Install
```
npm install maus --save
```

#QuickStart

###worker.js

```js
var rpcWorker = require('maus').worker;
rpcWorker.create({
    add: (x, y) => x + y,
    promise: () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve('promise'), 1000)
        })
    }
}, 'http://localhost:8124');
```
```
node worker.js
```

###manager.js

```js
var rpcManager = require('maus').manager;

rpcManager.create(workers => {
    console.log('task start!')
    workers.promise(result => console.log(result));
    workers.add(1, 1, result => console.log(result));
}, 8124)

//task start after 5s
setTimeout(() => {
    rpcManager.start()
}, 5000);

```