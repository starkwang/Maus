var net = require('net');
var server = net.createServer(function(c) { // 'connection' 监听器
    console.log('服务器已连接');
    c.on('end', function() {
        console.log('服务器已断开');
    });
    c.on('data',function(data){
        console.log('data ',data.toString());
    })
    c.write('hello\r\n');
    c.write('hello\r\n');
    c.write('hello\r\n');
    c.pipe(c);
});
server.listen(8124, function() { // 'listening' 监听器
    console.log('服务器已绑定');
});



var net = require('net');
var client = net.connect({ port: 8124 }, function() { //'connect' 监听器
    console.log('client connected');
    client.write('worlfsafsadd!\r\n');
});
client.on('data', function(data) {
    console.log(data.toString());
    client.end();
});
client.on('end', function() {
    console.log('客户端断开连接');
});
