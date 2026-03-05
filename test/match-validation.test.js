const test = require("node:test");
const assert = require("node:assert/strict");

const { parseStats, validateMatch } = require("../match-validation.js");

function team(name, playerNumbers) {
  return { name, logoUrl: "logo", playerNumbers };
}

test("parseStats parses player:value pairs", () => {
  const parsed = parseStats("18:42,45:33", "Team A batter runs");
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.entries, [
    { playerNumber: "18", value: 42 },
    { playerNumber: "45", value: 33 },
  ]);
});

test("parseStats rejects invalid format", () => {
  const parsed = parseStats("18-42", "Team A batter runs");
  assert.equal(parsed.ok, false);
});

test("validateMatch rejects same team", () => {
  const teams = [team("A", ["18", "45"]), team("B", ["7", "8"])];
  const result = validateMatch(teams, {
    teamAIndex: "0",
    teamBIndex: "0",
    teamABatterRuns: "18:10",
    teamBBatterRuns: "7:10",
    teamABowlerWickets: "18:1",
    teamBBowlerWickets: "7:1",
  });
  assert.equal(result.valid, false);
  assert.equal(result.message, "A match requires two different teams.");
});

test("validateMatch rejects players not on selected roster", () => {
  const teams = [team("A", ["18", "45"]), team("B", ["7", "8"])];
  const result = validateMatch(teams, {
    teamAIndex: "0",
    teamBIndex: "1",
    teamABatterRuns: "99:10",
    teamBBatterRuns: "7:10",
    teamABowlerWickets: "18:1",
    teamBBowlerWickets: "7:1",
  });
  assert.equal(result.valid, false);
  assert.match(result.message, /is not in A roster/);
});

test("validateMatch rejects invalid team B batter roster references", () => {
  const teams = [team("A", ["18", "45"]), team("B", ["7", "8"])];
  const result = validateMatch(teams, {
    teamAIndex: "0",
    teamBIndex: "1",
    teamABatterRuns: "18:10",
    teamBBatterRuns: "99:10",
    teamABowlerWickets: "18:1",
    teamBBowlerWickets: "7:1",
  });
  assert.equal(result.valid, false);
  assert.match(result.message, /is not in B roster/);
});

test("validateMatch rejects invalid team A bowler roster references", () => {
  const teams = [team("A", ["18", "45"]), team("B", ["7", "8"])];
  const result = validateMatch(teams, {
    teamAIndex: "0",
    teamBIndex: "1",
    teamABatterRuns: "18:10",
    teamBBatterRuns: "7:10",
    teamABowlerWickets: "99:1",
    teamBBowlerWickets: "7:1",
  });
  assert.equal(result.valid, false);
  assert.match(result.message, /is not in A roster/);
});

test("validateMatch rejects invalid team B bowler roster references", () => {
  const teams = [team("A", ["18", "45"]), team("B", ["7", "8"])];
  const result = validateMatch(teams, {
    teamAIndex: "0",
    teamBIndex: "1",
    teamABatterRuns: "18:10",
    teamBBatterRuns: "7:10",
    teamABowlerWickets: "18:1",
    teamBBowlerWickets: "99:1",
  });
  assert.equal(result.valid, false);
  assert.match(result.message, /is not in B roster/);
});

test("validateMatch computes totals and winner", () => {
  const teams = [team("A", ["18", "45"]), team("B", ["7", "8"])];
  const result = validateMatch(teams, {
    teamAIndex: "0",
    teamBIndex: "1",
    teamABatterRuns: "18:42,45:33",
    teamBBatterRuns: "7:40,8:20",
    teamABowlerWickets: "18:2,45:1",
    teamBBowlerWickets: "7:1,8:1",
  });
  assert.equal(result.valid, true);
  assert.equal(result.data.teamATotalRuns, 75);
  assert.equal(result.data.teamBTotalRuns, 60);
  assert.equal(result.data.teamAWicketsLost, 2);
  assert.equal(result.data.teamBWicketsLost, 3);
  assert.equal(result.data.winningTeamName, "A");
});

test("validateMatch picks team B when B has more runs", () => {
  const teams = [team("A", ["18", "45"]), team("B", ["7", "8"])];
  const result = validateMatch(teams, {
    teamAIndex: "0",
    teamBIndex: "1",
    teamABatterRuns: "18:10,45:5",
    teamBBatterRuns: "7:20,8:3",
    teamABowlerWickets: "18:1",
    teamBBowlerWickets: "7:1",
  });
  assert.equal(result.valid, true);
  assert.equal(result.data.winningTeamName, "B");
});

test("validateMatch uses wickets tie-breaker in favor of team A", () => {
  const teams = [team("A", ["18", "45"]), team("B", ["7", "8"])];
  const result = validateMatch(teams, {
    teamAIndex: "0",
    teamBIndex: "1",
    teamABatterRuns: "18:20,45:10",
    teamBBatterRuns: "7:25,8:5",
    teamABowlerWickets: "18:3",
    teamBBowlerWickets: "7:1",
  });
  assert.equal(result.valid, true);
  assert.equal(result.data.winningTeamName, "A");
});

test("validateMatch uses wickets tie-breaker in favor of team B", () => {
  const teams = [team("A", ["18", "45"]), team("B", ["7", "8"])];
  const result = validateMatch(teams, {
    teamAIndex: "0",
    teamBIndex: "1",
    teamABatterRuns: "18:20,45:10",
    teamBBatterRuns: "7:25,8:5",
    teamABowlerWickets: "18:1",
    teamBBowlerWickets: "7:3",
  });
  assert.equal(result.valid, true);
  assert.equal(result.data.winningTeamName, "B");
});
