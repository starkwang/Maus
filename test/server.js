var net = require('net');

var rpcServer = {
    create: function(funcs, port) {
        var server = net.createServer(c => { // 'connection' 监听器
            console.log('服务器已连接');
            c.on('end', function() {
                console.log('服务器已断开');
            });
            c.on('data', data => {
                console.log('data ', data.toString(), '\n');
                var data = JSON.parse(data.toString());
                switch (data.message) {
                    case 'init':
                        var body = [];
                        for (var funcName in funcs) {
                            body.push(funcName);
                        }
                        console.log(this);
                        this.__send(data.id, 'init', body, c);
                        break;
                    case 'function call':
                        var funcName = data.body.funcName;
                        var params = data.body.params;
                        var result = funcs[funcName].apply(funcs, params);
                        this.__send(data.id, 'function call', {
                            result: result
                        }, c);
                        break;
                    default:
                        console.log('unexpected message: ', data.message, data);
                }
            })
        });
        server.listen(port, function() { // 'listening' 监听器
            console.log('服务器已绑定');
        });
    },
    __send: function(id, message, body, c) {
        c.write(JSON.stringify({
            id: id,
            message: message,
            body: body
        }) + '\r\n');
    }
}

rpcServer.create({
    add: (x, y) => x + y
}, 8124);
