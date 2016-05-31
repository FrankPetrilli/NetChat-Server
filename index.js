var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var vorpal = require('vorpal')();

var port = 3000;

io.on('connection', function(client) {
    var str = 'Connection event: \n';
    str += '\tID: ' + client.id + '\n';
    str += '\tAddress: ' + client.conn.remoteAddress;
    client.emit('connected');
    vorpal.log(str);

    client.on('subscribe', function(data) {
        var str = 'Join event: \n';
        str += '\tID: ' + client.id + '\n';
        str += '\tChannel: ' + data.room;
        vorpal.log(str);
        client.join(data.room || 'default');
    });

    client.on('message', function(data) {
        vorpal.log(data);
        if (data.room) {
            io.sockets.in(data.room).emit('message', data);
        } else {
            console.error('no room or room doesn\'t exist');
        }
    });


});

/*var stdin = process.stdin;
stdin.setRawMode( true );
stdin.resume();
stdin.setEncoding( 'utf8' );
stdin.on('data', function(key) {
    if (key === '\u0003') { process.exit(0); }
    io.sockets.in('default').emit('message', { message: 'hello', username: 'server' });
    vorpal.log('emitted');
});*/

vorpal
.command('send <message...>', 'Send a message to users on the default channel')
.action(function(args, callback) {
    var message = [].concat(args.message).join(' ');
    io.sockets.in('default').emit('message', { message: message, username: 'Server'});
    vorpal.log('Sent message: ' + message);
    callback();
});
vorpal
.command('list users', 'List all connected users')
.action(function(args, callback) {
    vorpal.log(io.sockets.clients().connected);
    callback();
});
vorpal.command('quit', 'Shut down the server')
.action(function(args, callback) {
    server.close(callback);
});
vorpal.command('start', 'Power up the server')
.action(function(args, callback) {
    server.listen(port, callback);
});

vorpal
.delimiter('NetChat ::>')
.show();

app.use('/', require('express').static('static'));
server.listen(port, function() {
    vorpal.log(__dirname + ' listening on port ' + port);
    //vorpal.log(__dirname + ' listening on port ' + port);
});
