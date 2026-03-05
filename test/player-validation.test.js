const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalize,
  hasMissingField,
  hasDuplicateNumber,
  hasDuplicateName,
  validatePlayer,
} = require("../player-validation.js");

function basePlayer(overrides = {}) {
  return {
    number: "18",
    firstName: "Virat",
    lastName: "Kohli",
    teamAffiliation: "India",
    specialization: "Batter",
    ...overrides,
  };
}

test("normalize trims and lowercases", () => {
  assert.equal(normalize("  HeLLo "), "hello");
});

test("hasMissingField detects empty values", () => {
  assert.equal(hasMissingField(basePlayer({ firstName: "" })), true);
  assert.equal(hasMissingField(basePlayer()), false);
});

test("hasDuplicateNumber compares normalized values", () => {
  const players = [basePlayer({ number: " 18 " })];
  assert.equal(hasDuplicateNumber(players, basePlayer({ number: "18" })), true);
  assert.equal(hasDuplicateNumber(players, basePlayer({ number: "19" })), false);
  assert.equal(
    hasDuplicateNumber(players, basePlayer({ number: "18" }), { ignoreIndex: 0 }),
    false
  );
});

test("hasDuplicateName compares first+last name case-insensitively", () => {
  const players = [basePlayer({ firstName: "VIRAT", lastName: "KOHLI" })];
  assert.equal(
    hasDuplicateName(
      players,
      basePlayer({ firstName: "  virat ", lastName: "kohli  " })
    ),
    true
  );
  assert.equal(
    hasDuplicateName(players, basePlayer({ firstName: "Rohit", lastName: "Sharma" })),
    false
  );
  assert.equal(
    hasDuplicateName(
      players,
      basePlayer({ firstName: "virat", lastName: "kohli" }),
      { ignoreIndex: 0 }
    ),
    false
  );
});

test("validatePlayer rejects player with missing field", () => {
  const result = validatePlayer([], basePlayer({ teamAffiliation: "" }));
  assert.deepEqual(result, {
    valid: false,
    message: "All fields are required.",
  });
});

test("validatePlayer rejects duplicate number", () => {
  const players = [basePlayer({ number: "18" })];
  const result = validatePlayer(players, basePlayer({ number: " 18 " }));
  assert.deepEqual(result, {
    valid: false,
    message: "Player number must be unique.",
  });
});

test("validatePlayer rejects duplicate full name", () => {
  const players = [basePlayer({ firstName: "Virat", lastName: "Kohli" })];
  const result = validatePlayer(
    players,
    basePlayer({ number: "19", firstName: "virat", lastName: "KOHLI" })
  );
  assert.deepEqual(result, {
    valid: false,
    message: "First and last name combination must be unique.",
  });
});

test("validatePlayer accepts a unique player", () => {
  const players = [basePlayer()];
  const result = validatePlayer(
    players,
    basePlayer({
      number: "45",
      firstName: "Rohit",
      lastName: "Sharma",
    })
  );
  assert.deepEqual(result, { valid: true, message: "" });
});

test("validatePlayer allows keeping same number/name while editing same index", () => {
  const players = [basePlayer()];
  const result = validatePlayer(players, basePlayer(), { ignoreIndex: 0 });
  assert.deepEqual(result, { valid: true, message: "" });
});
