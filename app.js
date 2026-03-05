const STORAGE_KEY = "cricketPlayers";
const TEAM_STORAGE_KEY = "cricketTeams";
const RESET_VERSION_KEY = "cricketPlayersResetVersion";
const RESET_VERSION = "2026-03-03-fresh-reset";

const playerForm = document.getElementById("player-form");
const playerList = document.getElementById("player-list");
const formMessage = document.getElementById("form-message");
const submitPlayerButton = document.getElementById("submit-player-button");
const cancelEditButton = document.getElementById("cancel-edit-button");
const teamForm = document.getElementById("team-form");
const teamList = document.getElementById("team-list");
const teamFormMessage = document.getElementById("team-form-message");
const teamLogoOptions = document.getElementById("team-logo-options");
const { validatePlayer } = window.PlayerValidation;
const { validateTeam, normalize: normalizeTeamValue } = window.TeamValidation;
let editingIndex = null;
const TEAM_LOGOS = [
  {
    id: "orange-blue",
    label: "Sunfire",
    src:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#ffb058"/><circle cx="32" cy="30" r="16" fill="#2f78c4"/><path d="M18 48h28v4H18z" fill="#fff"/></svg>'
      ),
  },
  {
    id: "green-gold",
    label: "Green Shield",
    src:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1f8f62"/><path d="M32 8l18 8v14c0 12-7 20-18 26C21 50 14 42 14 30V16l18-8z" fill="#ffd166"/><circle cx="32" cy="28" r="7" fill="#1f8f62"/></svg>'
      ),
  },
  {
    id: "navy-white",
    label: "Crest",
    src:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#23406a"/><circle cx="32" cy="32" r="18" fill="#fff"/><path d="M20 32h24" stroke="#23406a" stroke-width="4"/><path d="M32 20v24" stroke="#23406a" stroke-width="4"/></svg>'
      ),
  },
  {
    id: "red-star",
    label: "Victory",
    src:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#e36a6f"/><path d="M32 14l5 10 11 2-8 8 2 12-10-6-10 6 2-12-8-8 11-2z" fill="#fff"/></svg>'
      ),
  },
];

function selectTeamLogo(logoSrc, buttonToActivate) {
  teamForm.elements.teamLogo.value = logoSrc;
  const buttons = teamLogoOptions.querySelectorAll(".logo-option");
  buttons.forEach((button) => {
    button.classList.remove("active");
    button.setAttribute("aria-pressed", "false");
  });
  if (buttonToActivate) {
    buttonToActivate.classList.add("active");
    buttonToActivate.setAttribute("aria-pressed", "true");
  }
}

function renderTeamLogoOptions() {
  teamLogoOptions.innerHTML = "";
  TEAM_LOGOS.forEach((logo, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "logo-option";
    button.setAttribute("aria-label", `Select ${logo.label} logo`);
    button.setAttribute("aria-pressed", "false");
    button.title = logo.label;

    const image = document.createElement("img");
    image.src = logo.src;
    image.alt = `${logo.label} team logo`;
    image.className = "logo-option-image";
    button.appendChild(image);

    button.addEventListener("click", () => {
      selectTeamLogo(logo.src, button);
    });

    teamLogoOptions.appendChild(button);

    if (index === 0) {
      selectTeamLogo(logo.src, button);
    }
  });
}

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

function getTeams() {
  const raw = window.localStorage.getItem(TEAM_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTeams(teams) {
  window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teams));
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
  renderTeams();
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

function renderTeams() {
  const players = getPlayers();
  const teams = getTeams();
  const playerByNumber = new Map(
    players.map((player) => [
      normalizeTeamValue(player.number),
      `${player.firstName} ${player.lastName}`,
    ])
  );

  teamList.innerHTML = "";

  if (teams.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No teams added yet.";
    teamList.appendChild(empty);
    return;
  }

  teams.forEach((team) => {
    const item = document.createElement("li");
    item.className = "team-item";

    const header = document.createElement("div");
    header.className = "team-header";

    const logo = document.createElement("img");
    logo.className = "team-logo";
    logo.src = team.logoUrl;
    logo.alt = `${team.name} logo`;
    header.appendChild(logo);

    const teamName = document.createElement("strong");
    teamName.textContent = team.name;
    header.appendChild(teamName);

    const playerNames = document.createElement("ul");
    playerNames.className = "team-player-list";
    team.playerNumbers.forEach((number) => {
      const mappedName = playerByNumber.get(normalizeTeamValue(number));
      const playerItem = document.createElement("li");
      playerItem.textContent = mappedName
        ? `#${number} - ${mappedName}`
        : `#${number} - Unknown Player`;
      playerNames.appendChild(playerItem);
    });

    item.appendChild(header);
    item.appendChild(playerNames);
    teamList.appendChild(item);
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
  renderTeams();

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

teamForm.addEventListener("submit", (event) => {
  event.preventDefault();
  teamFormMessage.textContent = "";

  const formData = new FormData(teamForm);
  const team = {
    name: (formData.get("teamName") || "").toString().trim(),
    logoUrl: (formData.get("teamLogo") || "").toString().trim(),
    playerNumbers: (formData.get("teamPlayerNumbers") || "").toString(),
  };

  const players = getPlayers();
  const validation = validateTeam(players, team);
  if (!validation.valid) {
    teamFormMessage.textContent = validation.message;
    teamFormMessage.className = "message error";
    return;
  }

  const teams = getTeams();
  teams.push({
    name: team.name,
    logoUrl: team.logoUrl,
    playerNumbers: validation.playerNumbers,
  });
  saveTeams(teams);
  renderTeams();

  teamForm.reset();
  teamFormMessage.textContent = "Team created successfully.";
  teamFormMessage.className = "message success";
});

runOneTimeReset();
clearEditingMode();
renderTeamLogoOptions();
renderPlayers();
renderTeams();
