var net = require('net');
// var client = net.connect({ port: 8124 }, function() { //'connect' 监听器
//     console.log('client connected');
//     client.write('add [1,2]');
//     setTimeout(() => {
//         client.write('add [3,4]');
//     }, 500);
//     setTimeout(() => {
//         client.write('add [5,6]');
//     }, 500);
//     client.write('add [7,8]');
// });
// client.on('data', function(data) {
//     console.log(data.toString());
// });
// client.on('end', function() {
//     console.log('客户端断开连接');
// });


rpcClient = {
    create: function(port, callback) {
        
        var client = net.connect({ port: port }, () => client.write('init'))
        client.on('data', (data) => {
            var funcNames = JSON.parse(data.toString());
            var rpc = new rpcStatic(port);
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


function rpcStatic(port){
    this.__callServer = function(funcName, params, callback) {
        var client = net.connect({ port: port }, () => {
            client.write(funcName + ' ' + JSON.stringify(params));
            client.on('data', data => {
                callback(data.toString())
            });
        })
    }
}


rpcClient.create(8124, function(rpc) {
    rpc.add(1,2,result => console.log(result));

    rpc.add(1,2,result => console.log(result));

    rpc.add(1,2,result => console.log(result));
})
