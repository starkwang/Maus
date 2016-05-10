var uuid = require('node-uuid');
var io = require('socket.io-client');

var rpcWorker = {
    __socket: undefined,
    create: function(funcs, path) {
        this.__funcs = funcs;
        var socket = io(path);
        socket.on('connect', () => {
            console.log('服务器已连接');
            this.__socket = socket;
        });
        socket.on('disconnect', () => {
            console.log('服务器已断开');
        });
        socket.on('data', data => {
            console.log('recieve data:', data);
            this.__handleData(data);
        })
    },
    __handleData: function(data) {
        switch (data.message) {
            case 'init':
                var body = [];
                for (var funcName in this.__funcs) {
                    if (typeof(this.__funcs[funcName]) == 'function') {
                        body.push(funcName);
                    }
                }
                this.__send(data.id, 'init', body);
                break;
            case 'function call':
                var funcName = data.body.funcName;
                var params = data.body.params;
                var result = this.__funcs[funcName].apply(this.__funcs, params);
                if (typeof(result.then) == 'function') {

                    result.then(r => {
                        this.__send(data.id, 'function call', {
                            result: r
                        })
                    });
                } else {
                    this.__send(data.id, 'function call', {
                        result: result
                    });
                }
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
