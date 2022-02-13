const express = require("express");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");
const FilterBadWords = require("bad-words");
const {
  addUser,
  getListUserByRoom,
  getUserById,
  removeUser,
} = require("../public/models/user");
const { generateMessages } = require("../public/utils/generate-messages");

const app = express();
const pathPublicDirectory = path.join(__dirname, "../public");
app.use(express.static(pathPublicDirectory));

const httpServer = createServer(app);
const io = new Server(httpServer, {});

io.on("connection", (socket) => {
  console.log("New client connects:", socket.id);

  //Xử lí join room
  socket.on("join-room-client-to-server", ({ room, username }) => {
    socket.join(room); //Đưa client vào room

    //Add user
    const newUser = {
      id: socket.id,
      room,
      username,
    };
    addUser(newUser);
    /**
     * Xử lí câu chào
     * 1/ User vừa kết nối vào: "Chào mừng bạn đến với CyberChat"
     * 2/ Các User đã kết nối trước đó: "Có 1 User vừa mới kết nối vào CyberChat"
     */
    socket.emit(
      "send-messages-server-to-client",
      generateMessages("ADMIN", `Chào mừng bạn đến với phòng chat ${room}!`)
    );

    socket.broadcast
      .to(room)
      .emit(
        "send-messages-server-to-client",
        generateMessages(
          "ADMIN",
          `${username} vừa mới kết nối vào phòng chat ${room}`
        )
      );

    //Nhận message từ client
    socket.on("send-messages-client-to-server", (messages, callback) => {
      //Kiểm tra tin nhắn có hợp lệ
      const filterBadWords = new FilterBadWords();
      if (filterBadWords.isProfane(messages)) {
        return callback("Tin nhắn không hợp lệ");
      }

      //Nên lưu message user gửi lên ở đây

      const { username } = getUserById(socket.id);
      //Gửi message về các clients
      io.to(room).emit(
        "send-messages-server-to-client",
        generateMessages(username, messages)
      );

      //Xử lí tin nhắn thành công
      callback();
    });

    //Xử lí trả danh sách người dùng theo phòng về client
    const userList = getListUserByRoom(room);
    io.to(room).emit("send-user-list-server-to-client", userList);

    //Nhận giá trị location từ client
    socket.on("share-location-client-to-server", ({ latitude, longitude }) => {
      const urlLocation = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const { username } = getUserById(socket.id);
      io.to(room).emit(
        "share-location-server-to-client",
        generateMessages(username, urlLocation)
      );
    });
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    console.log(`Client: ${socket.id} disconnected!`);
  });
});

httpServer.listen(3000, () => {
  console.log(`App run on port: 3000`);
});
