const express  = require('express');
const Server = require('socket.io');
const http = require('http');
const siofu = require("socketio-file-upload");
const cors = require('cors');
const path = require('path');

const PORT = process.env.PORT || 4000;

var app = express();

var server = http.createServer(app);
server.listen(PORT, () => {
    console.log("posrt "+PORT);
});



app.use(cors());
app.use(siofu.router);
app.use(express.static(__dirname+'/client/public'));

const io = Server(server);


io.on('connection', (socket)=>{
    console.log("socker with user "+socket.id+" connected");
    app.get("/rinfo",(req, res)=>{
        res.json(io.sockets.adapter.rooms);
    })
    
    var uploader = new siofu();
    uploader.dir = path.join(__dirname,'/assets');
    uploader.listen(socket);
    uploader.on('error',function(event)
    {
        console.log("Error from uploader", event);
    });
    
    socket.on('join-message',({user, room})=>{
        socket.join(room);
        uploader.on('saved', (event)=>{
            // console.log(event.file);
            socket.to(room).emit('file-transfer',{user: user, fileName:event.file.name, filePath:event.file.pathName});
        })
        socket.emit('welcome-message', {user:{name:'*Admin'},room, message:'Welcome to chat'});
        socket.to(room).emit('message', {user : {name:'*Admin'}, room, message:'* '+user.name+' joined the this group *'});
    });
    socket.on('message',({user, room, message})=>{
        socket.to(room).emit('message', {user, room, message});
    });

    app.get('/file/:filename',(req, res)=>{

        // console.log(req.params.filename);
        const file =  path.join(__dirname,"/assets/"+req.params.filename);
        res.download(file, (err)=>{

            socket.to(socket.id).emit('file-status',{message:'Error'})
        });
        socket.to(socket.id).emit('file-status',{message:'Successfull'})
    });
})


