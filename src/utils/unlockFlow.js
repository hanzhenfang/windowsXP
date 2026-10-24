/** Create the small, route-agnostic state machine for the login unlock flow. */
export function createUnlockFlow() {
  let state = "idle"
  let beforeEntry = "idle"

  return {
    get status() {
      return state
    },
    select() {
      if (state === "idle") state = "selected"
    },
    deselect() {
      if (state === "selected") state = "idle"
    },
    begin() {
      if (state !== "idle" && state !== "selected") return false
      beforeEntry = state
      state = "entering"
      return true
    },
    cancelEntry() {
      if (state === "entering") state = beforeEntry
    },
    complete() {
      if (state === "entering") state = "entered"
    },
  }
}
