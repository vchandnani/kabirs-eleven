(function () {
  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  function parseStats(rawValue, metricLabel) {
    const parts = (rawValue || "")
      .toString()
      .split(/[\n,]+/)
      .map((part) => part.trim())
      .filter((part) => part !== "");

    if (parts.length === 0) {
      return { ok: false, message: `${metricLabel} is required.` };
    }

    const entries = [];
    const seenNumbers = new Set();

    for (const part of parts) {
      const [rawNumber, rawStat, extra] = part.split(":");
      if (!rawNumber || !rawStat || extra !== undefined) {
        return {
          ok: false,
          message: `Invalid format in ${metricLabel}. Use playerNumber:value.`,
        };
      }

      const playerNumber = rawNumber.trim();
      const statValue = Number.parseInt(rawStat.trim(), 10);
      if (playerNumber === "" || Number.isNaN(statValue) || statValue < 0) {
        return {
          ok: false,
          message: `Invalid value in ${metricLabel}. Use non-negative numbers.`,
        };
      }

      const key = normalize(playerNumber);
      if (seenNumbers.has(key)) {
        return {
          ok: false,
          message: `Duplicate player number in ${metricLabel}.`,
        };
      }
      seenNumbers.add(key);
      entries.push({ playerNumber, value: statValue });
    }

    return { ok: true, entries };
  }

  function validateMembers(entries, allowedNumbers, metricLabel) {
    const invalid = entries.find(
      (entry) => !allowedNumbers.has(normalize(entry.playerNumber))
    );
    if (!invalid) {
      return { ok: true };
    }
    return {
      ok: false,
      message: `Player #${invalid.playerNumber} is not in ${metricLabel}.`,
    };
  }

  function sumValues(entries) {
    return entries.reduce((total, entry) => total + entry.value, 0);
  }

  function validateMatch(teams, payload) {
    const teamAIndex = Number.parseInt(payload.teamAIndex, 10);
    const teamBIndex = Number.parseInt(payload.teamBIndex, 10);

    if (Number.isNaN(teamAIndex) || Number.isNaN(teamBIndex)) {
      return { valid: false, message: "Select both teams." };
    }

    if (!teams[teamAIndex] || !teams[teamBIndex]) {
      return { valid: false, message: "Selected teams are invalid." };
    }

    if (teamAIndex === teamBIndex) {
      return { valid: false, message: "A match requires two different teams." };
    }

    const teamA = teams[teamAIndex];
    const teamB = teams[teamBIndex];

    const teamABatterRuns = parseStats(payload.teamABatterRuns, "Team A batter runs");
    if (!teamABatterRuns.ok) {
      return { valid: false, message: teamABatterRuns.message };
    }

    const teamBBatterRuns = parseStats(payload.teamBBatterRuns, "Team B batter runs");
    if (!teamBBatterRuns.ok) {
      return { valid: false, message: teamBBatterRuns.message };
    }

    const teamABowlerWickets = parseStats(
      payload.teamABowlerWickets,
      "Team A bowler wickets"
    );
    if (!teamABowlerWickets.ok) {
      return { valid: false, message: teamABowlerWickets.message };
    }

    const teamBBowlerWickets = parseStats(
      payload.teamBBowlerWickets,
      "Team B bowler wickets"
    );
    if (!teamBBowlerWickets.ok) {
      return { valid: false, message: teamBBowlerWickets.message };
    }

    const teamANumbers = new Set(teamA.playerNumbers.map((number) => normalize(number)));
    const teamBNumbers = new Set(teamB.playerNumbers.map((number) => normalize(number)));

    const teamABatterMemberCheck = validateMembers(
      teamABatterRuns.entries,
      teamANumbers,
      `${teamA.name} roster`
    );
    if (!teamABatterMemberCheck.ok) {
      return { valid: false, message: teamABatterMemberCheck.message };
    }

    const teamBBatterMemberCheck = validateMembers(
      teamBBatterRuns.entries,
      teamBNumbers,
      `${teamB.name} roster`
    );
    if (!teamBBatterMemberCheck.ok) {
      return { valid: false, message: teamBBatterMemberCheck.message };
    }

    const teamABowlerMemberCheck = validateMembers(
      teamABowlerWickets.entries,
      teamANumbers,
      `${teamA.name} roster`
    );
    if (!teamABowlerMemberCheck.ok) {
      return { valid: false, message: teamABowlerMemberCheck.message };
    }

    const teamBBowlerMemberCheck = validateMembers(
      teamBBowlerWickets.entries,
      teamBNumbers,
      `${teamB.name} roster`
    );
    if (!teamBBowlerMemberCheck.ok) {
      return { valid: false, message: teamBBowlerMemberCheck.message };
    }

    const teamATotalRuns = sumValues(teamABatterRuns.entries);
    const teamBTotalRuns = sumValues(teamBBatterRuns.entries);
    const teamAWicketsLost = sumValues(teamBBowlerWickets.entries);
    const teamBWicketsLost = sumValues(teamABowlerWickets.entries);

    let winningTeamName = "Draw";
    if (teamATotalRuns > teamBTotalRuns) {
      winningTeamName = teamA.name;
    } else if (teamBTotalRuns > teamATotalRuns) {
      winningTeamName = teamB.name;
    } else if (teamAWicketsLost < teamBWicketsLost) {
      winningTeamName = teamA.name;
    } else if (teamBWicketsLost < teamAWicketsLost) {
      winningTeamName = teamB.name;
    }

    return {
      valid: true,
      message: "",
      data: {
        teamAName: teamA.name,
        teamBName: teamB.name,
        teamABatterRuns: teamABatterRuns.entries,
        teamBBatterRuns: teamBBatterRuns.entries,
        teamABowlerWickets: teamABowlerWickets.entries,
        teamBBowlerWickets: teamBBowlerWickets.entries,
        teamATotalRuns,
        teamBTotalRuns,
        teamAWicketsLost,
        teamBWicketsLost,
        winningTeamName,
      },
    };
  }

  const exported = { parseStats, validateMatch, normalize };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }

  if (typeof window !== "undefined") {
    window.MatchValidation = exported;
  }
})();
