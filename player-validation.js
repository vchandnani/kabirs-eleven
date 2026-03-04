(function () {
  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  function hasMissingField(player) {
    return Object.values(player).some((value) => value === "");
  }

  function hasDuplicateNumber(players, player) {
    return players.some(
      (existing) => normalize(existing.number) === normalize(player.number)
    );
  }

  function hasDuplicateName(players, player) {
    return players.some(
      (existing) =>
        normalize(existing.firstName) === normalize(player.firstName) &&
        normalize(existing.lastName) === normalize(player.lastName)
    );
  }

  function validatePlayer(players, player) {
    if (hasMissingField(player)) {
      return { valid: false, message: "All fields are required." };
    }

    if (hasDuplicateNumber(players, player)) {
      return { valid: false, message: "Player number must be unique." };
    }

    if (hasDuplicateName(players, player)) {
      return {
        valid: false,
        message: "First and last name combination must be unique.",
      };
    }

    return { valid: true, message: "" };
  }

  const exported = {
    normalize,
    hasMissingField,
    hasDuplicateNumber,
    hasDuplicateName,
    validatePlayer,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }

  if (typeof window !== "undefined") {
    window.PlayerValidation = exported;
  }
})();
