var uuid = require('node-uuid');
var io = require('socket.io-client');

var rpcWorker = {
    __socket: undefined, //socket to manager
    __parkserverSocket: undefined, //socket to parkserver
    create: function(funcs, path) {
        this.__funcs = funcs;
        var socket = io(path);
        socket.on('connect', () => {
            console.log('服务器已连接');
            this.__socket = socket;
        });
        socket.on('disconnect', () => {
            console.log('服务器已断开');
            //如果有parkserver的话，通知parkserver自己目前可用，关闭当前的socket
            if (this.__parkserverSocket) {
                this.__parkserverSocket.emit('data', {
                    message: 'manager lost'
                });
                this.__socket.close();
                this.__socket = undefined;
            }
        });
        socket.on('data', data => {
            console.log('recieve data:', data);
            this.__handleData(data);
        })
    },
    registerParkserver: function(path, workerType, funcs) {
        this.__funcs = funcs;
        var socket = io(path);
        socket.on('connect', () => {
            this.__parkserverSocket = socket;
            socket.on('data', data => {
                console.log('recieve data:', data);
                this.__handleData(data);
            })
            socket.emit('data', {
                message: 'register',
                body: {
                    type: workerType,
                    funcs: this.__getFuncs()
                }
            })
        });
    },
    __getFuncs: function(funcs) {
        var body = [];
        for (var funcName in this.__funcs) {
            if (typeof(this.__funcs[funcName]) == 'function') {
                body.push(funcName);
            }
        }
        return body;
    },
    __handleData: function(data) {
        switch (data.message) {
            case 'init':
                var body = this.__getFuncs();
                this.__send(data.id, 'init', body);
                break;
            case 'function call':
                var funcName = data.body.funcName;
                //params表示方法：
                //type: common      -> 数字、字符串、数组、对象、或前者嵌套
                //      function    -> 函数字符串
                //value: 具体值
                var params = data.body.params
                    .map(item => {
                        if (item.type === 'common') {
                            return item.value;
                        }
                        if (item.type === 'function') {
                            eval("var __this = " + item.value);
                            return __this;
                        }
                    });
                var err, result;
                try{
                    result = this.__funcs[funcName].apply(this.__funcs, params);
                }catch(e){
                    err = e;
                }
                if(err){
                    this.__send(data.id, 'function call', {
                        result: null,
                        error: err
                    });
                    break;
                }
                if (typeof(result.then) == 'function') {
                    //promise
                    result.then(r => {
                        this.__send(data.id, 'function call', {
                            result: r,
                            error: null
                        })
                    }, err => {
                        if(err){
                            this.__send(data.id, 'function call', {
                                result: null,
                                error: err
                            })
                        }
                    });
                } else {
                    this.__send(data.id, 'function call', {
                        result: result,
                        error: null
                    });
                }
                break;
            case 'link manager':
                var address = data.body.address;
                this.create(this.__funcs, address);
                break;
            default:
                console.log('unexpected message: ', data.message, data);
        }
    },
    __send: function(id, message, body) {
        this.__socket.emit('data', {
            id: id,
            message: message,
            body: body
        });
    }
}

module.exports = rpcWorker;
