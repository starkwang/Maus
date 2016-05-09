var net = require('net');
var server = net.createServer(function(c) { // 'connection' 监听器
    console.log('服务器已连接');
    c.on('end', function() {
        console.log('服务器已断开');
    });
    c.on('data',function(data){
        console.log('data ',data.toString(),'\n');
        var data = JSON.parse(data.toString());
        c.write(JSON.stringify({
            message: 'init',
            body:['add','multiply']
        })+'\r\n');
    })
});
server.listen(8124, function() { // 'listening' 监听器
    console.log('服务器已绑定');
});