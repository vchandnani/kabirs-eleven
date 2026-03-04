const STORAGE_KEY = "cricketPlayers";
const RESET_VERSION_KEY = "cricketPlayersResetVersion";
const RESET_VERSION = "2026-03-03-fresh-reset";

const playerForm = document.getElementById("player-form");
const playerList = document.getElementById("player-list");
const formMessage = document.getElementById("form-message");
const { validatePlayer } = window.PlayerValidation;

function runOneTimeReset() {
  const currentResetVersion = window.localStorage.getItem(RESET_VERSION_KEY);
  if (currentResetVersion === RESET_VERSION) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.setItem(RESET_VERSION_KEY, RESET_VERSION);
}

function getPlayers() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function savePlayers(players) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

function renderPlayers() {
  const players = getPlayers();
  playerList.innerHTML = "";

  if (players.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No players added yet.";
    playerList.appendChild(empty);
    return;
  }

  players.forEach((player) => {
    const item = document.createElement("li");
    item.className = "player-item";
    item.textContent =
      `#${player.number} - ${player.firstName} ${player.lastName} | ` +
      `${player.teamAffiliation} | ${player.specialization}`;
    playerList.appendChild(item);
  });
}

playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const formData = new FormData(playerForm);
  const player = {
    number: (formData.get("number") || "").toString().trim(),
    firstName: (formData.get("firstName") || "").toString().trim(),
    lastName: (formData.get("lastName") || "").toString().trim(),
    teamAffiliation: (formData.get("teamAffiliation") || "").toString().trim(),
    specialization: (formData.get("specialization") || "").toString().trim(),
  };

  const players = getPlayers();
  const validation = validatePlayer(players, player);
  if (!validation.valid) {
    formMessage.textContent = validation.message;
    formMessage.className = "message error";
    return;
  }

  players.push(player);
  savePlayers(players);
  renderPlayers();

  playerForm.reset();
  formMessage.textContent = "Player created successfully.";
  formMessage.className = "message success";
});

runOneTimeReset();
renderPlayers();
