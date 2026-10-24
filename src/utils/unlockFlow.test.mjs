import test from "node:test"
import assert from "node:assert/strict"
import { createUnlockFlow } from "./unlockFlow.js"

test("starts idle and selects the profile", () => {
  const flow = createUnlockFlow()
  assert.equal(flow.status, "idle")
  flow.select()
  assert.equal(flow.status, "selected")
})

test("allows one entry and rejects duplicate entry", () => {
  const flow = createUnlockFlow()
  flow.select()
  assert.equal(flow.begin(), true)
  assert.equal(flow.status, "entering")
  assert.equal(flow.begin(), false)
  flow.complete()
  assert.equal(flow.status, "entered")
  assert.equal(flow.begin(), false)
})

test("allows PC drag to enter without a separate profile selection", () => {
  const flow = createUnlockFlow()
  assert.equal(flow.begin(), true)
  assert.equal(flow.status, "entering")
})

test("can clear profile selection before entering", () => {
  const flow = createUnlockFlow()
  flow.select()
  flow.deselect()
  assert.equal(flow.status, "idle")
  assert.equal(flow.begin(), true)
})

test("restores the prior state when desktop navigation cannot complete", () => {
  const flow = createUnlockFlow()
  flow.select()
  flow.begin()
  flow.cancelEntry()
  assert.equal(flow.status, "selected")
  assert.equal(flow.begin(), true)
})
