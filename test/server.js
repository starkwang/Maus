var net = require('net');
var uuid = require('node-uuid');
var rpcServer = {
    __socketList: {},
    create: function(funcs, port) {
        this.__funcs = funcs;
        var server = net.createServer(c => { // 'connection' 监听器
            console.log('服务器已连接');
            var socketID = uuid.v4();
            this.__socketList[socketID] = c;
            c.on('end', function() {
                console.log('服务器已断开');
            });
            c.on('data', data => {
                console.log('\n\n=============')
                console.log('data: ' + data.toString());
                console.log('=============\n\n');
                var data = data.toString();
                var dataArr = data.split('\r\n');
                dataArr.pop();
                dataArr.forEach(data => this.__handleData(data, socketID));
            })
        });
        server.listen(port, function() { // 'listening' 监听器
            console.log('服务器已绑定');
        });
    },
    __handleData: function(data, socketID) {
        var data = JSON.parse(data.toString());
        switch (data.message) {
            case 'init':
                var body = [];
                for (var funcName in this.__funcs) {
                    if(typeof(this.__funcs[funcName]) == 'function'){
                        body.push(funcName);
                    }
                }
                this.__send(data.id, 'init', body, socketID);
                break;
            case 'function call':
                var funcName = data.body.funcName;
                var params = data.body.params;
                var result = this.__funcs[funcName].apply(this.__funcs, params);
                if (typeof(result.then) == 'function') {
                    //Promise
                    result.then(r => this.__send(data.id, 'function call', {
                        result: r
                    }, socketID));
                } else {
                    this.__send(data.id, 'function call', {
                        result: result
                    }, socketID);
                }
                break;
            default:
                console.log('unexpected message: ', data.message, data);
        }
    },
    __send: function(id, message, body, socketID) {
        this.__socketList[socketID].write(JSON.stringify({
            id: id,
            message: message,
            body: body
        }) + '\r\n');
    }
}

rpcServer.create({
    add: (x, y) => x + y,
    promise: () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve('promise'), 1000)
        })
    }
}, 8124);
