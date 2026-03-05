const test = require("node:test");
const assert = require("node:assert/strict");

const { parsePlayerNumbers, validateTeam } = require("../team-validation.js");

function player(number, firstName, lastName) {
  return {
    number,
    firstName,
    lastName,
    teamAffiliation: "India",
    specialization: "Batter",
  };
}

test("parsePlayerNumbers handles commas and new lines", () => {
  assert.deepEqual(parsePlayerNumbers("18, 45\n1"), ["18", "45", "1"]);
});

test("validateTeam rejects missing team name", () => {
  const result = validateTeam([], {
    name: "",
    logoUrl: "https://example.com/logo.png",
    playerNumbers: "18",
  });
  assert.equal(result.valid, false);
  assert.equal(result.message, "Team name is required.");
});

test("validateTeam rejects missing team logo selection", () => {
  const result = validateTeam([], {
    name: "India",
    logoUrl: "",
    playerNumbers: "18",
  });
  assert.equal(result.valid, false);
  assert.equal(result.message, "Select a team logo.");
});

test("validateTeam rejects empty player-number input", () => {
  const players = [player("18", "Virat", "Kohli")];
  const result = validateTeam(players, {
    name: "India",
    logoUrl: "https://example.com/logo.png",
    playerNumbers: "  ",
  });
  assert.equal(result.valid, false);
  assert.equal(result.message, "Add at least one player number.");
});

test("validateTeam rejects more than 11 player numbers", () => {
  const players = Array.from({ length: 12 }, (_, i) =>
    player(String(i + 1), `P${i + 1}`, "T")
  );
  const numbers = players.map((p) => p.number).join(",");
  const result = validateTeam(players, {
    name: "India",
    logoUrl: "https://example.com/logo.png",
    playerNumbers: numbers,
  });
  assert.equal(result.valid, false);
  assert.equal(result.message, "A team can have up to 11 player numbers.");
});

test("validateTeam rejects duplicate team player numbers", () => {
  const players = [player("18", "Virat", "Kohli"), player("45", "Rohit", "Sharma")];
  const result = validateTeam(players, {
    name: "India",
    logoUrl: "https://example.com/logo.png",
    playerNumbers: "18,45,18",
  });
  assert.equal(result.valid, false);
  assert.equal(result.message, "Player numbers in a team must be unique.");
});

test("validateTeam rejects missing player number references", () => {
  const players = [player("18", "Virat", "Kohli")];
  const result = validateTeam(players, {
    name: "India",
    logoUrl: "https://example.com/logo.png",
    playerNumbers: "18,99",
  });
  assert.equal(result.valid, false);
  assert.equal(result.message, "Player number 99 does not exist.");
});

test("validateTeam accepts valid team numbers and returns parsed values", () => {
  const players = [player("18", "Virat", "Kohli"), player("45", "Rohit", "Sharma")];
  const result = validateTeam(players, {
    name: "India",
    logoUrl: "https://example.com/logo.png",
    playerNumbers: "18,45",
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.playerNumbers, ["18", "45"]);
});
