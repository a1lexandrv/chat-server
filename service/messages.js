let messageStorage = [];

const addMessage = (message) => {
    return messageStorage.push(message);
};

const getMessages = () => {
    return messageStorage;
};

const clearMessageStorage = () => {
    return (messageStorage = []);
};

module.exports = {
    addMessage,
    getMessages,
    clearMessageStorage,
};
