const { trimStr } = require('../utils/utils');

let users = [];

const findUser = (user) => {
    const userName = trimStr(user.name);
    const userRoom = trimStr(user.room);

    return users.find(
        (u) => trimStr(u.name) === userName && trimStr(u.room) === userRoom
    );
};

const addUser = (user) => {
    const isExist = findUser(user);

    !isExist && users.push(user);

    const currentUser = isExist || user;

    return { isExist: !!isExist, user: currentUser };
};

const getRoomUsers = (room) => users.filter((u) => u.room === room);

const removeUser = (user) => {
    const isExist = findUser(user);

    if (isExist) {
        users = users.filter(
            ({ room, name }) => room === isExist.room && name !== isExist.name
        );
    }

    return isExist;
};

module.exports = { addUser, findUser, getRoomUsers, removeUser };
