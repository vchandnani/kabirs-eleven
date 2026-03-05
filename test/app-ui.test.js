const test = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");

const VALIDATION_MODULE_PATH = require.resolve("../player-validation.js");
const APP_MODULE_PATH = require.resolve("../app.js");

function createDom() {
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
      </body>
    </html>`,
    { url: "http://localhost" }
  );

  global.window = dom.window;
  global.document = dom.window.document;
  global.FormData = dom.window.FormData;
  global.localStorage = dom.window.localStorage;

  delete require.cache[VALIDATION_MODULE_PATH];
  delete require.cache[APP_MODULE_PATH];
  window.PlayerValidation = require("../player-validation.js");
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
