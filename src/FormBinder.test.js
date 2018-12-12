import { FormBinder } from "./FormBinder"

test("Test creation", () => {
  const formBinder = new FormBinder({}, {})

  expect(formBinder).toBeDefined()
})
