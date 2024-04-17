require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const route = require('./router/route');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 5000;
const app = express();

const {
    addUser,
    findUser,
    getRoomUsers,
    removeUser,
} = require('./service/users');
const {
    addMessage,
    getMessages,
    clearMessageStorage,
} = require('./service/messages');

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
    // Подключение к чату
    socket.on('join', ({ name, room }) => {
        socket.join(room);

        const { user, isExist } = addUser({ name, room });
        const messageHistory = getMessages();

        socket.emit('messageHistory', { data: messageHistory });

        const serviceMessage = {
            user: { name: 'Admin' },
            message: {
                id: uuidv4(),
                text: isExist
                    ? `${user.name} is back again`
                    : `${user.name} has joined`,
            },
        };

        socket.emit('message', { data: serviceMessage });
        addMessage(serviceMessage);

        socket.broadcast
            .to(user.room)
            .emit('message', { data: serviceMessage });
        addMessage(serviceMessage);

        io.to(user.room).emit('room', {
            data: { users: getRoomUsers(user.room) },
        });
    });

    // Отправка сообщения
    socket.on('sendMessage', ({ message, params }) => {
        const user = findUser(params);

        if (user) {
            const newMessage = {
                user: params,
                message: { id: uuidv4(), text: message },
            };

            addMessage(newMessage);

            io.to(user.room).emit('message', {
                data: newMessage,
            });
        }
    });

    // Выход из чата
    socket.on('leftRoom', ({ params }) => {
        const user = removeUser(params);

        if (user) {
            const { room, name } = user;
            const usersOnline = getRoomUsers(room);

            // Очищу хранилище сообщений, если все пользователи вышли
            if (!usersOnline.length) {
                clearMessageStorage();
            } else {
                io.to(room).emit('message', {
                    data: {
                        user: { name: 'Admin' },
                        message: { id: uuidv4(), text: `${name} has left` },
                    },
                });

                io.to(room).emit('room', {
                    data: { users: usersOnline },
                });
            }
        }
    });

    io.on('disconnect', () => {
        console.log('Disconnect');
    });
});

server.listen(PORT, () => {
    console.log(`Server ran on port ${PORT}`);
});
