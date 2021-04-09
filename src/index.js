const path = require('path')            // Load in path library
const http = require('http')            // Load in http library
const express = require('express')      // Load in Express library
const socketio = require('socket.io')   // Load in socket.io library
const Filter = require('bad-words')     // Load in bad-words library
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()                   // Generate express application
const server = http.createServer(app)   // Create a new web server
const io = socketio(server)             // Create instance of socket.io to work with server

// Set up public directory path
const port = process.env.PORT || 3000                           // Store the port
const publicDirectoryPath = path.join(__dirname, '../public')   // Store path to public directory

app.use(express.static(publicDirectoryPath))                    // Serve up public directory

let welcomeMessage = 'Welcome!'

io.on('connection', (socket) => {
    console.log('New Websocket connection')

    socket.on('join', (options, callback) => {
        const { error, user }= addUser({ id: socket.id, ...options })

        if(error) {
            return callback(error)
        }

        socket.join(user.room)
        
        socket.emit('message', generateMessage('Admin', 'Welcome!!!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} is fresh meat!`)) // send to all other sockets in this room except current socket
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        const user = getUser(socket.id)

        if (filter.isProfane(message)) {
            return callback('YOU NASTY BOY!!! PROFANITY IS NOT ALLOWED!!!')
        }
            io.to(user.room).emit('message', generateMessage(user.username, message))
            callback()
        
        
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin',`The herb ${user.username} has left the tier`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }  
    })

    socket.on('sendLocation', (position, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback()
    })

   
})
// Start the server
server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})

