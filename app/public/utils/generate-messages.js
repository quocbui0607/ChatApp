const dateFormat = require("date-format");

const generateMessages = (username, message) => ({
  username,
  message,
  time: dateFormat("dd/MM/yyyy - hh:mm", new Date()),
});

module.exports = {
  generateMessages,
};
