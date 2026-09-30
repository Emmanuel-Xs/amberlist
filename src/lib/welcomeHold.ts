// After "Delete all my data" the app starts fresh, but the welcome screen popping up at once
// feels abrupt. Hold it until the next page load.
let held = false
export const holdWelcome = () => {
  held = true
}
export const welcomeHeld = () => held
