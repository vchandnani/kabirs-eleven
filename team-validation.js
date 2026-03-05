(function () {
  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  function parsePlayerNumbers(rawPlayerNumbers) {
    return (rawPlayerNumbers || "")
      .toString()
      .split(/[\n,]+/)
      .map((value) => value.trim())
      .filter((value) => value !== "");
  }

  function validateTeam(players, team) {
    const name = (team.name || "").toString().trim();
    const logoUrl = (team.logoUrl || "").toString().trim();
    const playerNumbers = parsePlayerNumbers(team.playerNumbers);

    if (name === "") {
      return {
        valid: false,
        message: "Team name is required.",
        playerNumbers: [],
      };
    }

    if (logoUrl === "") {
      return {
        valid: false,
        message: "Select a team logo.",
        playerNumbers: [],
      };
    }

    if (playerNumbers.length === 0) {
      return {
        valid: false,
        message: "Add at least one player number.",
        playerNumbers: [],
      };
    }

    if (playerNumbers.length > 11) {
      return {
        valid: false,
        message: "A team can have up to 11 player numbers.",
        playerNumbers: [],
      };
    }

    const seen = new Set();
    for (const number of playerNumbers) {
      const key = normalize(number);
      if (seen.has(key)) {
        return {
          valid: false,
          message: "Player numbers in a team must be unique.",
          playerNumbers: [],
        };
      }
      seen.add(key);
    }

    const playerNumbersInSystem = new Set(players.map((player) => normalize(player.number)));
    const missingNumber = playerNumbers.find(
      (number) => !playerNumbersInSystem.has(normalize(number))
    );
    if (missingNumber) {
      return {
        valid: false,
        message: `Player number ${missingNumber} does not exist.`,
        playerNumbers: [],
      };
    }

    return { valid: true, message: "", playerNumbers };
  }

  const exported = { parsePlayerNumbers, validateTeam, normalize };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }

  if (typeof window !== "undefined") {
    window.TeamValidation = exported;
  }
})();
