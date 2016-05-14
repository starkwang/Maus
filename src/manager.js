var uuid = require('node-uuid');
var server = require('http').createServer();
var io = require('socket.io')(server);

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
            delete this.__workerList[workerID];
        });
        this.__init(workerID);
    })
    
    this.do = function(callback) {
        if(this.__initComplete){
            callback(this.__workers);
        }else{
            this.__doQueue.push(callback);
        }

    };
    this.__deferDo = function(){
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
                    workers[funcName] = new Function(`
                        console.log("call ${funcName}");
                        var params = Array.prototype.slice.call(arguments,0,arguments.length-1);
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
                this.__callbackStore[id](result);
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
            var task = this.__functionCallQueue.shift();
            var funcName = task.body.funcName
            if (funcName.slice(funcName.length - 5, funcName.length) == 'Async') {
                this.__send(task, workerID);
                this.__workerList[workerID].isBusy = false;
            } else {
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
        this.__registerCallback(data.id, callback);
        if (funcName.slice(funcName.length - 5, funcName.length) == 'Async') {
            //Promise
            for (var workerID in this.__workerList) {
                if (!this.__workerList[workerID].isBusy) {
                    this.__send(data, workerID);
                    return;
                }
            }

        } else {
            for (var workerID in this.__workerList) {
                if (!this.__workerList[workerID].isBusy) {
                    this.__send(data, workerID);
                    this.__workerList[workerID].isBusy = true;
                    return;
                }
            }
        }
        //所有worker都繁忙
        this.__functionCallQueue.push(data);

    };
    this.__registerCallback = function(id, callback) {
        this.__callbackStore[id] = callback;
    };
    this.__clearCallback = function(id) {
        delete this.__callbackStore[id];
    }
    console.log('Maus Manager listen at ', port);
    server.listen(this.__port);
    
}

module.exports = rpcManager;
