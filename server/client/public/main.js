const send_btn = document.getElementById("send-btn");
const message_container = document.getElementById("message_container");
isWindowBlur = false;
window.focus();

window.onblur = () => {
  isWindowBlur = true;
};
window.onfocus = () => {
  isWindowBlur = false;
};

tinymce.init({
  selector: "#message_input_box",
  plugins:
    "advlist link image lists media code codesample emoticons insertdatetime table anchor fullscreen",
  toolbar1: "undo redo | styles | bold italic | image ",
  toolbar2: "alignleft aligncenter alignright | fullscreen",
  skin: "oxide-dark",
  file_picker_types: "file image media",
  file_browser_callback_types: "file image media",
  file_picker_callback: (cb, value, meta) => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");

    input.addEventListener("change", (e) => {
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        /*
              Note: Now we need to register the blob in TinyMCEs image blob
              registry. In the next release this part hopefully won't be
              necessary, as we are looking to handle it internally.
            */
        const id = "blobid" + new Date().getTime();
        const blobCache = tinymce.activeEditor.editorUpload.blobCache;
        const base64 = reader.result.split(",")[1];
        const blobInfo = blobCache.create(id, file, base64);
        blobCache.add(blobInfo);

        /* call the callback and populate the Title field with the file name */
        cb(blobInfo.blobUri(), { title: file.name });
      });
      reader.readAsDataURL(file);
    });

    input.click();
  },
});

//  starting a new socket
const socket = io();

var siofu = new SocketIOFileUpload(socket);

siofu.listenOnSubmit(
  document.getElementById("file_submit_btn"),
  document.getElementById("file_input")
);
siofu.listenOnDrop(document.getElementById("file_drop"));

// Do something when a file is uploaded:

room = prompt("Enter room to enter");
while (room == "" || room == null) {
  alert("room cannot be null");
  room = prompt("Enter room to enter");
}

confirmFlag = confirm("Are you sure what to join this room ?");
while (confirmFlag == false) {
  alert("Click yes to go");
  confirmFlag = confirm("Are you sure what to join this room ?");
}

name_ = prompt("Enter your name");
while (name_ == "" || name_ == null) {
  alert("Name cannot be null");
  name_ = prompt("Enter your name");
}

document.getElementById(
  "user_join_message"
).innerHTML = `Hello @${name_}  welcome to this { ${room} } room`;

if (name_ != "" && room != "") {
  const user = {
    name: name_ || "unkown",
  };

  socket.emit("join-message", { user: user, room: room });

  siofu.addEventListener("progress", function (event) {
    var percent = (event.bytesLoaded / event.file.size) * 100;
    var ldbar = new ldBar("#progress_bar");
    ldbar.set(percent.toFixed(2));
  });

  siofu.addEventListener("complete", function (event) {
    message_container.innerHTML += `<div class='chat-block-style2'>
    <span class='text-blue chat-userStyle2'>You</span>
    <div class='chat-style2'>
        <a href='${window.location.protocol + "/file/"}${
      event.file.name
    }' download>${event.file.name}</a>
  </div>
  </div>`;
    message_container.scrollTo(0, message_container.scrollHeight);
  });

  // for the current user
  send_btn.addEventListener("click", (e) => {
    content = tinymce.get("message_input_box").getContent();
    if (content == "") {
      alert("Please provide a message");
      return;
    }
    message_container.innerHTML += `<div class='chat-block-style2'>
        <span class='chat-userStyle2'>You</span>
        <div class='chat-style2'>${tinymce
          .get("message_input_box")
          .getContent({ format: "raw" })}</div>
    </div>`;

    message_container.scrollTo(0, message_container.scrollHeight);

    socket.emit("message", {
      user: user,
      room: room,
      message: tinymce.get("message_input_box").getContent(),
    });
  });

  socket.on("file-transfer", ({ user, fileName }) => {
    message_container.innerHTML += `<div class='chat-block-style1'>
      <span class='chat-userStyle1'>${user.name}</span>
      <div class='chat-style1'>
          <a href='${
            window.location.protocol + "/file/"
          }${fileName}' download>${fileName}</a>
    </div>
    </div>`;
    message_container.scrollTo(0, message_container.scrollHeight);
  });

  socket.on("message", (data) => {
    if (isWindowBlur) {
      noti_sound = document.getElementById("n-sound");
      noti_sound.play();
    }

    message_container.innerHTML += `<div class='chat-block-style1'>
      <span class='chat-userStyle1'>${data.user.name}</span>
      <div class='chat-style1'>${data.message}</div>
    </div>`;

    message_container.scrollTo(0, message_container.scrollHeight);
    // message_container.innerHTML+=data.message;
  });

  socket.on("welcome-message", (data) => {
    message_container.innerHTML += `<div class='chat-block-style1' >
      <span class='chat-userStyle1'>${data.user.name}</span>
      <div class='chat-style1'>${data.message}
        <div class='welcome-text'>Send a message ....</div>
      </div>
    </div>`;

    message_container.scrollTo(0, message_container.scrollHeight);
    // message_container.innerHTML+=data.message;
  });
} else {
  window.close();
}
