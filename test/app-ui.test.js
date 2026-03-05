const test = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");

const VALIDATION_MODULE_PATH = require.resolve("../player-validation.js");
const APP_MODULE_PATH = require.resolve("../app.js");
const TEAM_VALIDATION_MODULE_PATH = require.resolve("../team-validation.js");
const MATCH_VALIDATION_MODULE_PATH = require.resolve("../match-validation.js");

function createDom(options = {}) {
  const dom = new JSDOM(
    `<!doctype html>
    <html lang="en">
      <body>
        <form id="player-form">
          <input id="number" name="number" type="text" />
          <input id="firstName" name="firstName" type="text" />
          <input id="lastName" name="lastName" type="text" />
          <input id="teamAffiliation" name="teamAffiliation" type="text" />
          <input id="specialization" name="specialization" type="text" />
          <button id="submit-player-button" type="submit">Create Player</button>
          <button id="cancel-edit-button" type="button">Cancel Edit</button>
          <p id="form-message"></p>
        </form>
        <ul id="player-list"></ul>
        <form id="team-form">
          <input id="teamName" name="teamName" type="text" />
          <div id="team-logo-options"></div>
          <input id="teamLogo" name="teamLogo" type="hidden" />
          <textarea id="teamPlayerNumbers" name="teamPlayerNumbers"></textarea>
          <button id="submit-team-button" type="submit">Create Team</button>
          <button id="cancel-team-edit-button" type="button">Cancel Edit</button>
          <p id="team-form-message"></p>
        </form>
        <ul id="team-list"></ul>
        <form id="match-form">
          <select id="matchTeamA" name="matchTeamA"></select>
          <select id="matchTeamB" name="matchTeamB"></select>
          <input id="teamABatterRuns" name="teamABatterRuns" type="text" />
          <input id="teamBBatterRuns" name="teamBBatterRuns" type="text" />
          <input id="teamABowlerWickets" name="teamABowlerWickets" type="text" />
          <input id="teamBBowlerWickets" name="teamBBowlerWickets" type="text" />
          <button id="submit-match-button" type="submit">Create Match</button>
          <p id="match-form-message"></p>
        </form>
        <ul id="match-list"></ul>
      </body>
    </html>`,
    { url: "http://localhost" }
  );

  global.window = dom.window;
  global.document = dom.window.document;
  global.FormData = dom.window.FormData;
  global.localStorage = dom.window.localStorage;

  if (options.initialStorage) {
    Object.entries(options.initialStorage).forEach(([key, value]) => {
      dom.window.localStorage.setItem(key, value);
    });
  }

  delete require.cache[VALIDATION_MODULE_PATH];
  delete require.cache[TEAM_VALIDATION_MODULE_PATH];
  delete require.cache[MATCH_VALIDATION_MODULE_PATH];
  delete require.cache[APP_MODULE_PATH];
  window.PlayerValidation = require("../player-validation.js");
  window.TeamValidation = require("../team-validation.js");
  window.MatchValidation = require("../match-validation.js");
  require("../app.js");

  return dom;
}

function destroyDom(dom) {
  dom.window.close();
  delete global.window;
  delete global.document;
  delete global.FormData;
  delete global.localStorage;
}

function submitForm(dom, player) {
  const form = dom.window.document.getElementById("player-form");
  form.elements.number.value = player.number;
  form.elements.firstName.value = player.firstName;
  form.elements.lastName.value = player.lastName;
  form.elements.teamAffiliation.value = player.teamAffiliation;
  form.elements.specialization.value = player.specialization;
  form.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
}

function clickButton(dom, selector) {
  const button = dom.window.document.querySelector(selector);
  assert.ok(button, `Expected button for selector: ${selector}`);
  button.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
}

test("edit flow updates player details via UI controls", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "7",
      firstName: "MS",
      lastName: "Dhoni",
      teamAffiliation: "India",
      specialization: "Wicketkeeper",
    });

    clickButton(dom, 'button[title="Edit"]');

    const submitButton = dom.window.document.getElementById("submit-player-button");
    assert.equal(submitButton.textContent.trim(), "Update Player");

    submitForm(dom, {
      number: "7",
      firstName: "Mahendra",
      lastName: "Dhoni",
      teamAffiliation: "India",
      specialization: "Captain",
    });

    const listText = dom.window.document.getElementById("player-list").textContent;
    assert.match(listText, /Mahendra Dhoni/);
    assert.match(listText, /Captain/);
  } finally {
    destroyDom(dom);
  }
});

test("cancel edit resets form mode", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "45",
      firstName: "Rohit",
      lastName: "Sharma",
      teamAffiliation: "India",
      specialization: "Batter",
    });

    clickButton(dom, 'button[title="Edit"]');
    clickButton(dom, "#cancel-edit-button");

    const submitButton = dom.window.document.getElementById("submit-player-button");
    const message = dom.window.document.getElementById("form-message").textContent;
    assert.equal(submitButton.textContent.trim(), "Create Player");
    assert.equal(message, "Edit cancelled.");
  } finally {
    destroyDom(dom);
  }
});

test("delete flow removes selected player", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "18",
      firstName: "Virat",
      lastName: "Kohli",
      teamAffiliation: "India",
      specialization: "Batter",
    });
    submitForm(dom, {
      number: "1",
      firstName: "KL",
      lastName: "Rahul",
      teamAffiliation: "India",
      specialization: "Batter",
    });

    clickButton(dom, 'button[title="Delete"]');

    const listItems = dom.window.document.querySelectorAll("#player-list .player-item");
    const listText = dom.window.document.getElementById("player-list").textContent;
    assert.equal(listItems.length, 1);
    assert.doesNotMatch(listText, /Virat Kohli/);
  } finally {
    destroyDom(dom);
  }
});

test("editing into a duplicate number is blocked", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "8",
      firstName: "Ravindra",
      lastName: "Jadeja",
      teamAffiliation: "India",
      specialization: "All-rounder",
    });
    submitForm(dom, {
      number: "99",
      firstName: "Hardik",
      lastName: "Pandya",
      teamAffiliation: "India",
      specialization: "All-rounder",
    });

    clickButton(dom, 'button[title="Edit"]');
    submitForm(dom, {
      number: "99",
      firstName: "Ravindra",
      lastName: "Jadeja",
      teamAffiliation: "India",
      specialization: "All-rounder",
    });

    const message = dom.window.document.getElementById("form-message").textContent;
    const listText = dom.window.document.getElementById("player-list").textContent;
    assert.equal(message, "Player number must be unique.");
    assert.match(listText, /#8 - Ravindra Jadeja/);
  } finally {
    destroyDom(dom);
  }
});

test("deleting the player currently being edited exits edit mode", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "10",
      firstName: "Sachin",
      lastName: "Tendulkar",
      teamAffiliation: "India",
      specialization: "Batter",
    });

    clickButton(dom, 'button[title="Edit"]');
    clickButton(dom, 'button[title="Delete"]');

    const submitButton = dom.window.document.getElementById("submit-player-button");
    const message = dom.window.document.getElementById("form-message").textContent;
    const listText = dom.window.document.getElementById("player-list").textContent;
    assert.equal(submitButton.textContent.trim(), "Create Player");
    assert.equal(message, "Player deleted successfully.");
    assert.match(listText, /No players added yet\./);
  } finally {
    destroyDom(dom);
  }
});

test("deleting a player before edited row keeps edit target valid", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "6",
      firstName: "Yuvraj",
      lastName: "Singh",
      teamAffiliation: "India",
      specialization: "All-rounder",
    });
    submitForm(dom, {
      number: "3",
      firstName: "Suresh",
      lastName: "Raina",
      teamAffiliation: "India",
      specialization: "All-rounder",
    });

    const editButtons = dom.window.document.querySelectorAll('button[title="Edit"]');
    editButtons[1].dispatchEvent(new dom.window.Event("click", { bubbles: true }));

    const deleteButtons = dom.window.document.querySelectorAll('button[title="Delete"]');
    deleteButtons[0].dispatchEvent(new dom.window.Event("click", { bubbles: true }));

    submitForm(dom, {
      number: "3",
      firstName: "Suresh",
      lastName: "Raina",
      teamAffiliation: "India",
      specialization: "Batter",
    });

    const listItems = dom.window.document.querySelectorAll("#player-list .player-item");
    const listText = dom.window.document.getElementById("player-list").textContent;
    assert.equal(listItems.length, 1);
    assert.match(listText, /Suresh Raina/);
    assert.match(listText, /Batter/);
    assert.doesNotMatch(listText, /Yuvraj Singh/);
  } finally {
    destroyDom(dom);
  }
});

test("create team maps player numbers to full names", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "18",
      firstName: "Virat",
      lastName: "Kohli",
      teamAffiliation: "India",
      specialization: "Batter",
    });
    submitForm(dom, {
      number: "45",
      firstName: "Rohit",
      lastName: "Sharma",
      teamAffiliation: "India",
      specialization: "Batter",
    });

    const teamForm = dom.window.document.getElementById("team-form");
    teamForm.elements.teamName.value = "India XI";
    teamForm.elements.teamPlayerNumbers.value = "18,45";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    const teamListText = dom.window.document.getElementById("team-list").textContent;
    assert.match(teamListText, /India XI/);
    assert.match(teamListText, /#18 - Virat Kohli/);
    assert.match(teamListText, /#45 - Rohit Sharma/);
  } finally {
    destroyDom(dom);
  }
});

test("create team blocks unknown player numbers", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "18",
      firstName: "Virat",
      lastName: "Kohli",
      teamAffiliation: "India",
      specialization: "Batter",
    });

    const teamForm = dom.window.document.getElementById("team-form");
    teamForm.elements.teamName.value = "India XI";
    teamForm.elements.teamPlayerNumbers.value = "18,99";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    const teamMessage = dom.window.document.getElementById("team-form-message");
    const teamListText = dom.window.document.getElementById("team-list").textContent;
    assert.equal(teamMessage.textContent, "Player number 99 does not exist.");
    assert.match(teamListText, /No teams added yet\./);
  } finally {
    destroyDom(dom);
  }
});

test("edit team updates team fields and members", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "18",
      firstName: "Virat",
      lastName: "Kohli",
      teamAffiliation: "India",
      specialization: "Batter",
    });
    submitForm(dom, {
      number: "45",
      firstName: "Rohit",
      lastName: "Sharma",
      teamAffiliation: "India",
      specialization: "Batter",
    });
    submitForm(dom, {
      number: "7",
      firstName: "MS",
      lastName: "Dhoni",
      teamAffiliation: "India",
      specialization: "Wicketkeeper",
    });

    const teamForm = dom.window.document.getElementById("team-form");
    teamForm.elements.teamName.value = "India XI";
    teamForm.elements.teamPlayerNumbers.value = "18,45";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    clickButton(dom, 'button[title="Edit Team"]');
    assert.equal(
      dom.window.document.getElementById("submit-team-button").textContent.trim(),
      "Update Team"
    );

    teamForm.elements.teamName.value = "India Legends";
    teamForm.elements.teamPlayerNumbers.value = "18,7";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    const teamListText = dom.window.document.getElementById("team-list").textContent;
    assert.match(teamListText, /India Legends/);
    assert.match(teamListText, /#18 - Virat Kohli/);
    assert.match(teamListText, /#7 - MS Dhoni/);
    assert.doesNotMatch(teamListText, /#45 - Rohit Sharma/);
  } finally {
    destroyDom(dom);
  }
});

test("cancel team edit exits edit mode", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "18",
      firstName: "Virat",
      lastName: "Kohli",
      teamAffiliation: "India",
      specialization: "Batter",
    });

    const teamForm = dom.window.document.getElementById("team-form");
    teamForm.elements.teamName.value = "India XI";
    teamForm.elements.teamPlayerNumbers.value = "18";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    clickButton(dom, 'button[title="Edit Team"]');
    clickButton(dom, "#cancel-team-edit-button");

    assert.equal(
      dom.window.document.getElementById("submit-team-button").textContent.trim(),
      "Create Team"
    );
    assert.equal(
      dom.window.document.getElementById("team-form-message").textContent,
      "Team edit cancelled."
    );
  } finally {
    destroyDom(dom);
  }
});

test("delete team removes selected team", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "18",
      firstName: "Virat",
      lastName: "Kohli",
      teamAffiliation: "India",
      specialization: "Batter",
    });

    const teamForm = dom.window.document.getElementById("team-form");
    teamForm.elements.teamName.value = "India XI";
    teamForm.elements.teamPlayerNumbers.value = "18";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    clickButton(dom, 'button[title="Delete Team"]');

    const teamListText = dom.window.document.getElementById("team-list").textContent;
    assert.match(teamListText, /No teams added yet\./);
    assert.equal(
      dom.window.document.getElementById("team-form-message").textContent,
      "Team deleted successfully."
    );
  } finally {
    destroyDom(dom);
  }
});

test("deleting a team before edited team keeps edit target valid", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "18",
      firstName: "Virat",
      lastName: "Kohli",
      teamAffiliation: "India",
      specialization: "Batter",
    });
    submitForm(dom, {
      number: "45",
      firstName: "Rohit",
      lastName: "Sharma",
      teamAffiliation: "India",
      specialization: "Batter",
    });
    submitForm(dom, {
      number: "7",
      firstName: "MS",
      lastName: "Dhoni",
      teamAffiliation: "India",
      specialization: "Wicketkeeper",
    });

    const teamForm = dom.window.document.getElementById("team-form");
    teamForm.elements.teamName.value = "Team A";
    teamForm.elements.teamPlayerNumbers.value = "18,45";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );
    teamForm.elements.teamName.value = "Team B";
    teamForm.elements.teamPlayerNumbers.value = "7";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    const editButtons = dom.window.document.querySelectorAll('button[title="Edit Team"]');
    editButtons[1].dispatchEvent(new dom.window.Event("click", { bubbles: true }));
    const deleteButtons = dom.window.document.querySelectorAll('button[title="Delete Team"]');
    deleteButtons[0].dispatchEvent(new dom.window.Event("click", { bubbles: true }));

    teamForm.elements.teamName.value = "Team B Prime";
    teamForm.elements.teamPlayerNumbers.value = "7";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    const teamListText = dom.window.document.getElementById("team-list").textContent;
    assert.match(teamListText, /Team B Prime/);
    assert.doesNotMatch(teamListText, /Team A/);
  } finally {
    destroyDom(dom);
  }
});

test("app boot handles invalid players/teams/matches JSON with safe fallback", () => {
  const dom = createDom({
    initialStorage: {
      cricketPlayers: "{invalid-json",
      cricketTeams: "{invalid-json",
      cricketMatches: "{invalid-json",
      cricketPlayersResetVersion: "2026-03-03-fresh-reset",
    },
  });
  try {
    const playerListText = dom.window.document.getElementById("player-list").textContent;
    const teamListText = dom.window.document.getElementById("team-list").textContent;
    const matchListText = dom.window.document.getElementById("match-list").textContent;
    assert.match(playerListText, /No players added yet\./);
    assert.match(teamListText, /No teams added yet\./);
    assert.match(matchListText, /No matches added yet\./);
  } finally {
    destroyDom(dom);
  }
});

test("create match stores totals and winner", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "18",
      firstName: "Virat",
      lastName: "Kohli",
      teamAffiliation: "India",
      specialization: "Batter",
    });
    submitForm(dom, {
      number: "45",
      firstName: "Rohit",
      lastName: "Sharma",
      teamAffiliation: "India",
      specialization: "Batter",
    });
    submitForm(dom, {
      number: "7",
      firstName: "MS",
      lastName: "Dhoni",
      teamAffiliation: "India",
      specialization: "Wicketkeeper",
    });
    submitForm(dom, {
      number: "8",
      firstName: "Ravindra",
      lastName: "Jadeja",
      teamAffiliation: "India",
      specialization: "All-rounder",
    });

    const teamForm = dom.window.document.getElementById("team-form");
    teamForm.elements.teamName.value = "Team A";
    teamForm.elements.teamPlayerNumbers.value = "18,45";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );
    teamForm.elements.teamName.value = "Team B";
    teamForm.elements.teamPlayerNumbers.value = "7,8";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    const matchForm = dom.window.document.getElementById("match-form");
    matchForm.elements.matchTeamA.value = "0";
    matchForm.elements.matchTeamB.value = "1";
    matchForm.elements.teamABatterRuns.value = "18:42,45:33";
    matchForm.elements.teamBBatterRuns.value = "7:40,8:20";
    matchForm.elements.teamABowlerWickets.value = "18:2,45:1";
    matchForm.elements.teamBBowlerWickets.value = "7:1,8:1";
    matchForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    const matchListText = dom.window.document.getElementById("match-list").textContent;
    assert.match(matchListText, /Team A vs Team B/);
    assert.match(matchListText, /Team A: 75\/2/);
    assert.match(matchListText, /Team B: 60\/3/);
    assert.match(matchListText, /Winner: Team A/);
  } finally {
    destroyDom(dom);
  }
});

test("create match rejects same team on both sides", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "18",
      firstName: "Virat",
      lastName: "Kohli",
      teamAffiliation: "India",
      specialization: "Batter",
    });
    submitForm(dom, {
      number: "45",
      firstName: "Rohit",
      lastName: "Sharma",
      teamAffiliation: "India",
      specialization: "Batter",
    });

    const teamForm = dom.window.document.getElementById("team-form");
    teamForm.elements.teamName.value = "Team A";
    teamForm.elements.teamPlayerNumbers.value = "18,45";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );
    teamForm.elements.teamName.value = "Team B";
    teamForm.elements.teamPlayerNumbers.value = "18,45";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    const matchForm = dom.window.document.getElementById("match-form");
    matchForm.elements.matchTeamA.value = "0";
    matchForm.elements.matchTeamB.value = "0";
    matchForm.elements.teamABatterRuns.value = "18:10";
    matchForm.elements.teamBBatterRuns.value = "45:10";
    matchForm.elements.teamABowlerWickets.value = "18:1";
    matchForm.elements.teamBBowlerWickets.value = "45:1";
    matchForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    assert.equal(
      dom.window.document.getElementById("match-form-message").textContent,
      "A match requires two different teams."
    );
  } finally {
    destroyDom(dom);
  }
});

test("match creation is blocked when submit is disabled", () => {
  const dom = createDom();
  try {
    const matchForm = dom.window.document.getElementById("match-form");
    const submitMatchButton = dom.window.document.getElementById("submit-match-button");
    submitMatchButton.disabled = true;

    matchForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    assert.equal(
      dom.window.document.getElementById("match-form-message").textContent,
      "Add at least 2 teams before creating a match."
    );
  } finally {
    destroyDom(dom);
  }
});

test("match team selectors auto-adjust to keep different teams", () => {
  const dom = createDom();
  try {
    submitForm(dom, {
      number: "18",
      firstName: "Virat",
      lastName: "Kohli",
      teamAffiliation: "India",
      specialization: "Batter",
    });
    submitForm(dom, {
      number: "45",
      firstName: "Rohit",
      lastName: "Sharma",
      teamAffiliation: "India",
      specialization: "Batter",
    });

    const teamForm = dom.window.document.getElementById("team-form");
    teamForm.elements.teamName.value = "Team A";
    teamForm.elements.teamPlayerNumbers.value = "18";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );
    teamForm.elements.teamName.value = "Team B";
    teamForm.elements.teamPlayerNumbers.value = "45";
    teamForm.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true })
    );

    const matchForm = dom.window.document.getElementById("match-form");
    matchForm.elements.matchTeamA.value = "0";
    matchForm.elements.matchTeamB.value = "0";
    matchForm.elements.matchTeamA.dispatchEvent(
      new dom.window.Event("change", { bubbles: true })
    );
    assert.notEqual(matchForm.elements.matchTeamA.value, matchForm.elements.matchTeamB.value);

    matchForm.elements.matchTeamA.value = "1";
    matchForm.elements.matchTeamB.value = "1";
    matchForm.elements.matchTeamB.dispatchEvent(
      new dom.window.Event("change", { bubbles: true })
    );
    assert.notEqual(matchForm.elements.matchTeamA.value, matchForm.elements.matchTeamB.value);
  } finally {
    destroyDom(dom);
  }
});

test("match stat fields are single-line text inputs", () => {
  const dom = createDom();
  try {
    const ids = [
      "teamABatterRuns",
      "teamBBatterRuns",
      "teamABowlerWickets",
      "teamBBowlerWickets",
    ];
    ids.forEach((id) => {
      const field = dom.window.document.getElementById(id);
      assert.ok(field);
      assert.equal(field.tagName, "INPUT");
      assert.equal(field.getAttribute("type"), "text");
    });
  } finally {
    destroyDom(dom);
  }
});
