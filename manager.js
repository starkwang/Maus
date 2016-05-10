var uuid = require('node-uuid');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use('/js', express.static('./'));
app.use('/', express.static('./'));

function jsonRpcData(message, body) {
    this.id = uuid.v4();
    this.message = message;
    this.body = body;
}

var rpcManager = {
    __workerList: {},
    __callbackStore: {},
    __functionCallQueue: [],
    create: function(callback, port) {
        this.__rpcStaticCallback = callback;
        io.on('connection', worker => {
            console.log('worker connected');
            var workerID = uuid.v4();
            this.__workerList[workerID] = {
                isBusy: false,
                socket: worker
            };
            worker.on('data', data => {
                console.log('recieve data:', data);
                this.__handleData(data, workerID);
            });
            worker.on('disconnect', () => {
                delete this.__workerList[workerID];
            })
            this.__init(workerID);
        })
        server.listen(port);
    },
    __init: function(workerID) {
        var data = new jsonRpcData('init');
        this.__send(data, workerID);
    },
    __handleData: function(data, workerID) {
        switch (data.message) {
            case 'init':
                var rpc = {
                    __send: this.__send.bind(this),
                    __functionCall: this.__functionCall.bind(this)
                };
                var funcNames = data.body;
                funcNames.forEach(funcName => {
                    rpc[funcName] = new Function(`
                        console.log("call ${funcName}");
                        var params = Array.prototype.slice.call(arguments,0,arguments.length-1);
                        this.__functionCall('${funcName}',params,arguments[arguments.length-1])
                    `)
                })
                this.__rpc = rpc;
                if (this.__waitingForInit) {
                    this.start();
                }
                break;
            case 'function call':
                var result = data.body.result;
                var id = data.id;
                this.__callbackStore[id](result);
                this.__clearCallback(id);

                //检查队列中是否有等待的任务
                if (this.__functionCallQueue.length > 0) {
                    this.__send(this.__functionCallQueue.shift(),workerID);
                }else{
                    this.__workerList[workerID].isBusy = false;
                }
                break;
        }
    },
    start: function(callback) {
        if (this.__rpc != undefined) {
            this.__rpcStaticCallback(this.__rpc);
            this.__waitingForInit = false;
        } else {
            this.__waitingForInit = true;
        }
    },
    __send: function(data, workerID) {
        this.__workerList[workerID].socket.emit('data', data);
    },
    __functionCall: function(funcName, params, callback) {
        var data = new jsonRpcData('function call', {
            funcName: funcName,
            params: params
        });
        this.__registerCallback(data.id, callback);

        for (var workerID in this.__workerList) {
            if (!this.__workerList[workerID].isBusy) {
                this.__send(data, workerID);
                this.__workerList[workerID].isBusy = true;
                return;
            }
        }
        //所有worker都繁忙
        this.__functionCallQueue.push(data);
    },
    __registerCallback: function(id, callback) {
        this.__callbackStore[id] = callback;
    },
    __clearCallback: function(id) {
        delete this.__callbackStore[id];
    }
}

rpcManager.create(workers => {
    // workers.promise(result => console.log('result for promise: ', result));
    // workers.add(1, 2, result => console.log(result));
    // workers.add(3, 4, result => console.log(result));
    // workers.add(5, 6, result => console.log(result));
    // workers.add(7, 8, result => console.log(result));
    // workers.add(9, 10, result => console.log(result));
    // workers.add(11, 12, result => console.log(result));
    // workers.add(13, 14, result => console.log(result));
    // workers.fib(40, result => console.log(result));

    var add = function(x, y) {
        return Promise.all([x, y]).then(arr => {
            return new Promise((resolve, reject) => {
                workers.add(arr[0], arr[1], r => resolve(r));
            })
        })
    }

    var fib = function(x) {
        if (x < 2) {
            return x;
        } else {
            return add(fib(x - 1), fib(x - 2));
        }
    }

    fib(10).then(r => console.log('\n\n\n==========\nresult: ' + r + '\n==========\n\n'));
}, 8124)

setTimeout(() => {
    rpcManager.start()
}, 8000);
