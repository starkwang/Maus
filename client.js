var net = require('net');
rpcClient = {
    create: function(port, path, callback) {
        var start = new Date().getTime();
        var client = net.connect(port, path, () => {
            var end = new Date().getTime();
            console.log('tcp time:', end - start);
            client.write('init')
        })
        client.on('data', (data) => {
            var funcNames = JSON.parse(data.toString());
            var rpc = new rpcStatic(port, path);
            funcNames.forEach(funcName => {
                rpc[funcName] = new Function(`
                    var params = Array.prototype.slice.call(arguments,0,arguments.length-1);
                    this.__callServer('${funcName}',params,arguments[arguments.length-1]);
                    `)
            })
            client.end();
            callback(rpc);
        });
    },
}


function rpcStatic(port, path) {
    this.__callServer = function(funcName, params, callback) {
        var start = new Date().getTime();
        var client = net.connect(port, path, () => {
            var end = new Date().getTime();
            console.log('tcp time:', end - start);
            client.write(funcName + ' ' + JSON.stringify(params));
            client.on('data', data => {
                client.end();
                callback(JSON.parse(data.toString()));
            });
        })
    }
}

rpcClient.create(8124, 'localhost', function(rpc) {

    rpc.add(1, 2, result => console.log(result));

    rpc.fib(40, 23, result => console.log(result));

    rpc.add(1, 2, result => console.log(result));

    rpc.make(1, result => console.log(result));
})

