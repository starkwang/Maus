'use strict';

var uuid = require('node-uuid');
var io = require('socket.io-client');

var rpcWorker = {
    __socket: undefined,
    create: function create(funcs, path) {
        var _this = this;

        this.__funcs = funcs;
        var socket = io(path);
        socket.on('connect', function () {
            console.log('服务器已连接');
            _this.__socket = socket;
        });
        socket.on('disconnect', function () {
            console.log('服务器已断开');
        });
        socket.on('data', function (data) {
            console.log('recieve data:', data);
            _this.__handleData(data);
        });
    },
    __handleData: function __handleData(data) {
        var _this2 = this;

        switch (data.message) {
            case 'init':
                var body = [];
                for (var funcName in this.__funcs) {
                    if (typeof this.__funcs[funcName] == 'function') {
                        body.push(funcName);
                    }
                }
                this.__send(data.id, 'init', body);
                break;
            case 'function call':
                var funcName = data.body.funcName;
                var params = data.body.params;
                var result = this.__funcs[funcName].apply(this.__funcs, params);
                if (typeof result.then == 'function') {

                    result.then(function (r) {
                        _this2.__send(data.id, 'function call', {
                            result: r
                        });
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
    __send: function __send(id, message, body) {
        this.__socket.emit('data', {
            id: id,
            message: message,
            body: body
        });
    }
};

var fib = function fib(x) {
    return x > 1 ? fib(x - 1) + fib(x - 2) : x;
};

rpcWorker.create({
    add: function add(x, y) {
        return x + y;
    },
    promise: function promise() {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                return resolve('promise');
            }, 1000);
        });
    },
    fib: fib
}, 'http://192.168.1.100:8124');
