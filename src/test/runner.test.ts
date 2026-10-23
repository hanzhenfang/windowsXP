import { describe, expect, it } from "vitest"

describe("browser regression test environment", () => {
  it("provides isolated localStorage", () => {
    localStorage.setItem("test-key", "local")
    expect(localStorage.getItem("test-key")).toBe("local")
  })
})
