const express= require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage , genreateLocationmessage } = require('./utils/messages')
const {addUser , removeUser , getUser, getUsersInRoom }= require('./utils/user')
const error =null

const app = express()
const server=http.createServer(app)
const io = socketio(server)

const PORT = process.env.PORT || 3000
const publicDirPath= path.join(__dirname,'../public')

let count =0

app.use(express.static(publicDirPath))

io.on('connection',(socket)=>{
  console.log('New web socket connection')
  
  socket.on('join', (option,callback)=>{
    
   const{error ,user} = addUser({id:socket.id , ...option})
            
   if(error){
     return callback(error)
    }
    socket.join(user.room)
    
    socket.emit('message', generateMessage('Admin','Welcome!'))
    socket.broadcast.to(user.room).emit('message',generateMessage(`${user.username} has joined`))
    io.to(user.room).emit('roomData',{
      room: user.room,
      users: getUsersInRoom(user.room)
    })    

    callback()
    
  })


  socket.on('sendmessage',(message,callback)=>{
    const filter = new Filter()
    const user = getUser(socket.id)

    if(filter.isProfane(message)){
      return callback('This kind of words are not allowed')
    }
    io.to(user.room).emit('message',generateMessage(user.username,message))
    callback()
  })

  socket.on('position',(lang,lat,callback)=>{
    const user = getUser(socket.id)
    io.to(user.room).emit('locationMeassage',genreateLocationmessage( user.username, `https://google.com/maps?q=${lat},${lang}`))

    callback()
  })

  socket.on('disconnect',()=>{
    const user = removeUser(socket.id)

    if(user){
      
      io.to(user.room).emit('message',generateMessage(`${user.username} left`))
      io.to(user.room).emit('roomData',{
        room:user.room,
        users:getUsersInRoom(user.room)
      })
    }

    
  })
})

server.listen(PORT,()=>{
    console.log('the server is up at '+PORT)
})