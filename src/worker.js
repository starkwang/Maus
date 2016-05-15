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
                            eval("var tmp = " + item.value);
                            return tmp;
                        }
                    });
                var result = this.__funcs[funcName].apply(this.__funcs, params);
                if (typeof(result.then) == 'function') {
                    //promise
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
