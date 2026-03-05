(function () {
  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  function hasMissingField(player) {
    return Object.values(player).some((value) => value === "");
  }

  function hasDuplicateNumber(players, player, options = {}) {
    const ignoreIndex =
      typeof options.ignoreIndex === "number" ? options.ignoreIndex : -1;
    return players.some(
      (existing, index) =>
        index !== ignoreIndex &&
        normalize(existing.number) === normalize(player.number)
    );
  }

  function hasDuplicateName(players, player, options = {}) {
    const ignoreIndex =
      typeof options.ignoreIndex === "number" ? options.ignoreIndex : -1;
    return players.some(
      (existing, index) =>
        index !== ignoreIndex &&
        normalize(existing.firstName) === normalize(player.firstName) &&
        normalize(existing.lastName) === normalize(player.lastName)
    );
  }

  function validatePlayer(players, player, options = {}) {
    if (hasMissingField(player)) {
      return { valid: false, message: "All fields are required." };
    }

    if (hasDuplicateNumber(players, player, options)) {
      return { valid: false, message: "Player number must be unique." };
    }

    if (hasDuplicateName(players, player, options)) {
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
