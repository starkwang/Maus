var uuid = require('node-uuid');
var server = require('http').createServer();
var io = require('socket.io')(server);
var ioc = require('socket.io-client');

function jsonRpcData(message, body) {
    this.id = uuid.v4();
    this.message = message;
    this.body = body;
}

function rpcManager(port) {
    this.__workerList = {};
    this.__callbackStore = {};
    this.__functionCallQueue = [];
    this.__doQueue = [];
    this.__port = port;
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
            console.log("disconnect");
            delete this.__workerList[workerID];
            //检查__callbackStore中有没有这个worker负责的callback
            for (var id in this.__callbackStore) {
                var callback = this.__callbackStore[id];
                if (callback.workerID === workerID) {
                    this.__functionCall(callback.rpcData.body.funcName, callback.rpcData.body.params, callback.callback);
                }
            }
        });
        this.__init(workerID);
    })

    this.do = function(callback) {
        if (this.__initComplete) {
            callback(this.__workers);
        } else {
            this.__doQueue.push(callback);
        }
        return this;
    };
    this.connectParkserver = function(path) {
        var socket = ioc(path);
        socket.on('connect', () => {
            console.log('connect parkserver');
            this.__parkserverSocket = socket;
            if (this.__waitingForConnectParkserver) {
                this.getWorker(this.__waitingForConnectParkserver);
            }
        });
    };

    this.getWorker = function(config) {
        var amount = config.amount || 'default';
        var workerType = config.workerType || 'default';
        var address = config.address;
        if (this.__parkserverSocket) {
            console.log('get worker: ', workerType, 'amount: ', amount);
            this.__parkserverSocket.emit('data', {
                message: 'get worker',
                body: {
                    amount: amount,
                    workerType: workerType,
                    address: address
                }
            })
        } else {
            console.log('not connect');
            this.__waitingForConnectParkserver = {
                amount: amount,
                workerType: workerType,
                address: address
            };
        }
        return this;
    };
    this.end = function(){
        io.close();
        server.listen(this.__port);
    };
    this.__deferDo = function() {
        this.__doQueue.forEach(callback => {
            callback(this.__workers);
        })
    }
    this.__init = function(workerID) {
        var data = new jsonRpcData('init');
        this.__send(data, workerID);
    };
    this.__handleData = function(data, workerID) {
        switch (data.message) {
            case 'init':
                var workers = {
                    __send: this.__send.bind(this),
                    __functionCall: this.__functionCall.bind(this)
                };
                var funcNames = data.body;
                funcNames.forEach(funcName => {
                    //params表示方法：
                    //type: common      -> 数字、字符串、数组、对象、或前者嵌套
                    //      function    -> 函数字符串
                    //value: 具体值
                    workers[funcName] = new Function(`
                        console.log("call ${funcName}");
                        var params = Array.prototype.slice.call(arguments,0,arguments.length-1)
                            .map(item => {
                                if(typeof item === 'function'){
                                    return {
                                        type: 'function',
                                        funcName: item.funcName || 'tmp',
                                        value: item.toString()
                                    }
                                }else{
                                    return {
                                        type: 'common',
                                        value: item
                                    }
                                }
                            });
                        var callback = arguments[arguments.length-1];
                        this.__functionCall('${funcName}',params,callback);
                    `)
                })
                this.__workers = workers;
                if (!this.__initComplete) {
                    this.__initComplete = true;
                    this.__deferDo();
                }
                this.__digest(workerID);
                break;
            case 'function call':
                var result = data.body.result;
                var id = data.id;
                this.__callbackStore[id].callback(result);
                this.__clearCallback(id);
                //检查队列中是否有等待的任务
                this.__digest(workerID);
                break;
        }
    };
    this.__send = function(data, workerID) {
        this.__workerList[workerID].socket.emit('data', data);
    };
    this.__digest = function(workerID) {
        if (this.__functionCallQueue.length > 0) {
            var t = this.__functionCallQueue.shift();
            var task = t.rpcData;
            var callback = t.callback;
            var funcName = task.body.funcName
            if (funcName.slice(funcName.length - 5, funcName.length) == 'Async') {
                this.__registerCallback(task.id, callback, workerID, task);
                this.__send(task, workerID);
                this.__workerList[workerID].isBusy = false;
            } else {
                this.__registerCallback(task.id, callback, workerID, task);
                this.__send(task, workerID);
            }
        } else {
            this.__workerList[workerID].isBusy = false;
        }
    };
    this.__functionCall = function(funcName, params, callback) {
        var data = new jsonRpcData('function call', {
            funcName: funcName,
            params: params
        });
        if (funcName.slice(funcName.length - 5, funcName.length) == 'Async') {
            //Promise
            for (var workerID in this.__workerList) {
                if (!this.__workerList[workerID].isBusy) {
                    this.__registerCallback(data.id, callback, workerID, data);
                    this.__send(data, workerID);
                    return;
                }
            }
        } else {
            for (var workerID in this.__workerList) {
                if (!this.__workerList[workerID].isBusy) {
                    this.__registerCallback(data.id, callback, workerID, data);
                    this.__send(data, workerID);
                    this.__workerList[workerID].isBusy = true;
                    return;
                }
            }
        }
        //所有worker都繁忙
        this.__functionCallQueue.push({
            rpcData: data,
            callback: callback
        });
    };
    this.__registerCallback = function(id, callback, workerID, rpcData) {
        this.__callbackStore[id] = {
            callback: callback,
            workerID: workerID,
            rpcData: rpcData
        };
    };
    this.__clearCallback = function(id) {
        delete this.__callbackStore[id];
    }
    console.log('Maus Manager listen at ', port);
    server.listen(this.__port);
}

module.exports = rpcManager;
