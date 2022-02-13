const socket = io();

const acknowledgement = (err) => {
  if (err) {
    return alert(err);
  }

  console.log("Đã gửi tin nhắn thành công!");
};

document.getElementById("form-messages").addEventListener("submit", (e) => {
  e.preventDefault();
  const messages = document.getElementById("input-messages").value;

  //Gửi message lên server
  socket.emit("send-messages-client-to-server", messages, acknowledgement);
});

//Nhận messages từ server
socket.on("send-messages-server-to-client", (content) => {
  document.getElementById(
    "message-list"
  ).innerHTML += `<div class="message-item">
  <div class="message__row1">
    <p class="message__name">${content.username}</p>
    <p class="message__date">${content.time}</p>
  </div>
  <div class="message__row2">
    <p class="message__content">
      ${content.message}
    </p>
  </div>
</div>`;
});

//Nhận userList từ server
socket.on("send-user-list-server-to-client", (userList) => {
  document.getElementById("user-list-by-room").innerHTML = userList
    .map(
      (info) => `
    <li class="app__item-user">${info.username}</li>
    `
    )
    .reduce((sumString, string) => {
      return (sumString += string);
    }, "");
});

const queryString = location.search;
const { room, username } = Qs.parse(queryString, {
  ignoreQueryPrefix: true,
});

socket.emit("join-room-client-to-server", { room, username });

//Xử lí chia sẻ vị trí
document.getElementById("btn-share-location").addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Trình duyệt không hỗ trợ chia sẻ vị trí");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    socket.emit("share-location-client-to-server", location);
  });
});

//Nhận giá trị location từ server trả về cho client
socket.on("share-location-server-to-client", ({ username, time, message }) => {
  document.getElementById(
    "message-list"
  ).innerHTML += `<div class="message-item">
  <div class="message__row1">
    <p class="message__name">${username}</p>
    <p class="message__date">${time}</p>
  </div>
  <div class="message__row2">
    <p class="message__content">
      <a href="${message}" target="_blank">${username} location</a>
    </p>
  </div>
</div>`;
});
