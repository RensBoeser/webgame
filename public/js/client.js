// Socket setup
const socket = io.connect();

// Client registration
socket.emit("identify", {
  kind: "player"
});

// Query DOM
const button = document.getElementById("send-name");
const nameInput = document.getElementById("name-input");
const errorHolder = document.getElementById("error");
const loginHolder = document.getElementById("login");
const joystickWrapper = document.getElementById('wrapper');

// Variables
const joystick = createJoystick(joystickWrapper);

// Functions
function emitJoystick() {
  socket.emit("movement", joystick.getPosition());
}

function createJoystick(parent) {
  const maxDiff = 100;
  const stick = document.createElement('div');
  stick.classList.add('joystick');

  stick.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  stick.addEventListener('touchstart', handleMouseDown);
  document.addEventListener('touchmove', handleMouseMove);
  document.addEventListener('touchend', handleMouseUp);

  let dragStart = null;
  let currentPos = { x: 0, y: 0 };

  function handleMouseDown(event) {
    stick.style.transition = '0s';
    if (event.changedTouches) {
      dragStart = {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };
      return;
    }
    dragStart = {
      x: event.clientX,
      y: event.clientY,
    };

  }

  function handleMouseMove(event) {
    if (dragStart === null) return;
    event.preventDefault();
    if (event.changedTouches) {
      event.clientX = event.changedTouches[0].clientX;
      event.clientY = event.changedTouches[0].clientY;
    }
    const xDiff = event.clientX - dragStart.x;
    const yDiff = event.clientY - dragStart.y;
    const angle = Math.atan2(yDiff, xDiff);
    const distance = Math.min(maxDiff, Math.hypot(xDiff, yDiff));
    const xNew = distance * Math.cos(angle);
    const yNew = distance * Math.sin(angle);
    stick.style.transform = `translate3d(${xNew}px, ${yNew}px, 0px)`;
    currentPos = { x: xNew, y: yNew };
  }

  function handleMouseUp(event) {
    if (dragStart === null) return;
    stick.style.transition = '.2s';
    stick.style.transform = `translate3d(0px, 0px, 0px)`;
    dragStart = null;
    currentPos = { x: 0, y: 0 };
  }

  parent.appendChild(stick);
  return {
    getPosition: () => ({
      x: currentPos.x / 100,
      y: currentPos.y / 100
    }),
  };
}

// Listen to events
socket.on("set-name-failed", data => {
  if (data.id === socket.id) {
    nameInput.classList.add("invalid");
    errorHolder.innerText = "This username is invalid (1-24 characters) or already in use!";
  }
});

socket.on("joined", data => {
  if (data.id === socket.id) {
    errorHolder.innerText = "";
    loginHolder.style.display = "none";
    joystickWrapper.style.display = "initial";
  }
});

// Add events
setInterval(emitJoystick, 16);

button.addEventListener("click", () => {
  socket.emit("set-name", { name: nameInput.value });
});
