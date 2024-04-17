require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const route = require('./router/route');

const PORT = process.env.PORT || 5000;
const app = express();

const {
    addUser,
    findUser,
    getRoomUsers,
    removeUser,
} = require('./service/users');

app.use(cors({ origin: '*' }));
app.use(route);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    socket.on('join', ({ name, room }) => {
        socket.join(room);

        const { user, isExist } = addUser({ name, room });

        const serviceMessage = isExist
            ? `${user.name} is back again`
            : `${user.name} has joined`;

        socket.emit('message', {
            data: { user: { name: 'Admin' }, message: serviceMessage },
        });

        socket.broadcast.to(user.room).emit('message', {
            data: {
                user: { name: 'Admin' },
                message: serviceMessage,
            },
        });

        io.to(user.room).emit('room', {
            data: { users: getRoomUsers(user.room) },
        });
    });

    socket.on('sendMessage', ({ message, params }) => {
        const user = findUser(params);

        if (user) {
            io.to(user.room).emit('message', { data: { user, message } });
        }
    });

    socket.on('leftRoom', ({ params }) => {
        const user = removeUser(params);

        if (user) {
            const { room, name } = user;

            io.to(room).emit('message', {
                data: { user: { name: 'Admin' }, message: `${name} has left` },
            });

            io.to(room).emit('room', {
                data: { users: getRoomUsers(room) },
            });
        }
    });

    io.on('disconnect', () => {
        console.log('Disconnect');
    });
});

server.listen(PORT, () => {
    console.log(`Server ran on port ${PORT}`);
});
