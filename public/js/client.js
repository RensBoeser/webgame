// Socket setup
const socket = io.connect();

// Client registration
socket.on("connect", () => {
  loginHolder.style.display = "block";
  controlsHolder.style.display = "none";
	socket.emit("identify", {
		kind: "player"
	});
});

// Query DOM
const button = document.getElementById("send-name");
const nameInput = document.getElementById("name-input");
const errorHolder = document.getElementById("error");
const loginHolder = document.getElementById("login");
const joystickWrapper = document.getElementById('wrapper');
const attackButton = document.getElementById("attack");
const controlsHolder = document.getElementById("controls");
const playerName = document.getElementById("player-name");
const playerCrown = document.getElementById("player-crown");
const playerScore = document.getElementById("player-score");
const main = document.getElementById("main");

// Variables
const joystick = createJoystick(joystickWrapper);
let attack = false;

// Functions
function emitControls() {
  socket.emit("controls", {
		movement: joystick.getPosition(),
		attack: attack
  });
  attack = false;
}

function getNewName() {
  socket.emit("get-new-name")
}

function createJoystick(parent) {
  const maxDiff = 50;
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
      x: currentPos.x / 50,
      y: currentPos.y / 50
    }),
  };
}

// Listen to events
socket.on("connected", data => {
  if (data.id == socket.id) {
    nameInput.value = data.name;
  }
})

socket.on("new-name", data => {
  if (data.id == socket.id) {
    nameInput.value = data.name;
  }
})

socket.on("dead", id => {
  if (id === socket.id) {
    setTimeout(() => {
      loginHolder.style.display = "block";
      controlsHolder.style.display = "none";
      main.classList.remove("c0", "c1", "c2", "c3", "c4");
    }, 2250);
  }
});

socket.on("set-name-failed", data => {
  if (data.id === socket.id) {
    nameInput.classList.add("invalid");
    errorHolder.innerText = "This username is already in use!";
  }
});

socket.on("joined", data => {
  if (data.id === socket.id) {
    errorHolder.innerText = "";
    loginHolder.style.display = "none";
    controlsHolder.style.display = "block";
    playerName.innerText = data.player.name;
    main.classList.add(`c${data.player.color}`);
  }
});

socket.on("players", players => {
  const index = players.findIndex(player => player.id === socket.id);
  switch (index) {
    case 0: playerCrown.classList.add("crown-gold"); playerCrown.classList.remove("crown-silver", "crown-bronze", "crown-dead"); playerCrown.innerText = ""; break;
    case 1: playerCrown.classList.add("crown-silver"); playerCrown.classList.remove("crown-gold", "crown-bronze", "crown-dead"); playerCrown.innerText = ""; break;
    case 2: playerCrown.classList.add("crown-bronze"); playerCrown.classList.remove("crown-gold", "crown-silver", "crown-dead"); playerCrown.innerText = ""; break;
    case -1: playerCrown.classList.add("crown-dead"); playerCrown.classList.remove("crown-gold", "crown-silver", "crown-bronze"); playerCrown.innerText = ""; break;
    default: playerCrown.classList.remove("crown-gold", "crown-silver", "crown-bronze", "crown-dead"); playerCrown.innerText = `#${index + 1}`; break;
  }

  if (index >= 0) {
    playerScore.innerText = players[index].score
  }
})

// Add events
setInterval(emitControls, 1000 / 60);

button.addEventListener("click", () => {
  socket.emit("set-name", { name: nameInput.value });
});

attackButton.addEventListener("click", () => {
	attack = true;
});
