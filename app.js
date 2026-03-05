const STORAGE_KEY = "cricketPlayers";
const RESET_VERSION_KEY = "cricketPlayersResetVersion";
const RESET_VERSION = "2026-03-03-fresh-reset";

const playerForm = document.getElementById("player-form");
const playerList = document.getElementById("player-list");
const formMessage = document.getElementById("form-message");
const submitPlayerButton = document.getElementById("submit-player-button");
const cancelEditButton = document.getElementById("cancel-edit-button");
const { validatePlayer } = window.PlayerValidation;
let editingIndex = null;

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

function setEditingMode(index) {
  editingIndex = index;
  submitPlayerButton.textContent = "Update Player";
  cancelEditButton.style.display = "inline-block";
}

function clearEditingMode() {
  editingIndex = null;
  submitPlayerButton.textContent = "Create Player";
  cancelEditButton.style.display = "none";
}

function fillForm(player) {
  playerForm.elements.number.value = player.number;
  playerForm.elements.firstName.value = player.firstName;
  playerForm.elements.lastName.value = player.lastName;
  playerForm.elements.teamAffiliation.value = player.teamAffiliation;
  playerForm.elements.specialization.value = player.specialization;
}

function deletePlayer(index) {
  const players = getPlayers();
  players.splice(index, 1);
  savePlayers(players);
  renderPlayers();

  if (editingIndex === index) {
    playerForm.reset();
    clearEditingMode();
  } else if (editingIndex !== null && editingIndex > index) {
    editingIndex -= 1;
  }

  formMessage.textContent = "Player deleted successfully.";
  formMessage.className = "message success";
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

  players.forEach((player, index) => {
    const item = document.createElement("li");
    item.className = "player-item";
    const details = document.createElement("span");
    details.className = "player-details";
    details.textContent =
      `#${player.number} - ${player.firstName} ${player.lastName} | ` +
      `${player.teamAffiliation} | ${player.specialization}`;

    const actions = document.createElement("div");
    actions.className = "player-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "icon-button";
    editButton.setAttribute("aria-label", "Edit player");
    editButton.title = "Edit";
    editButton.textContent = "✎";
    editButton.addEventListener("click", () => {
      fillForm(player);
      setEditingMode(index);
      formMessage.textContent = "Editing player. Update and save.";
      formMessage.className = "message";
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "icon-button danger";
    deleteButton.setAttribute("aria-label", "Delete player");
    deleteButton.title = "Delete";
    deleteButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm-2 6h10l-1 11H8L7 9zm3 2v7h2v-7h-2zm4 0v7h2v-7h-2z" fill="currentColor"/></svg>';
    deleteButton.addEventListener("click", () => {
      deletePlayer(index);
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    item.appendChild(details);
    item.appendChild(actions);
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
  const validation = validatePlayer(players, player, { ignoreIndex: editingIndex });
  if (!validation.valid) {
    formMessage.textContent = validation.message;
    formMessage.className = "message error";
    return;
  }

  if (editingIndex === null) {
    players.push(player);
  } else {
    players[editingIndex] = player;
  }
  savePlayers(players);
  renderPlayers();

  playerForm.reset();
  formMessage.textContent =
    editingIndex === null
      ? "Player created successfully."
      : "Player updated successfully.";
  formMessage.className = "message success";
  clearEditingMode();
});

cancelEditButton.addEventListener("click", () => {
  playerForm.reset();
  clearEditingMode();
  formMessage.textContent = "Edit cancelled.";
  formMessage.className = "message";
});

runOneTimeReset();
clearEditingMode();
renderPlayers();
