import { login, settingsArgs } from './auth'

let cachedTokenExpiryTime = new Date().getTime()
let cachedTokenResponse: any = null

Cypress.Commands.add('login', (settings: settingsArgs) => {
  // Clear our cache if tokens are expired
  if (cachedTokenExpiryTime <= new Date().getTime()) {
    cachedTokenResponse = null
  }

  return login(cachedTokenResponse, settings).then((tokenResponse) => {
    cachedTokenResponse = tokenResponse
    // Set expiry time to 50 minutes from now
    cachedTokenExpiryTime = new Date().getTime() + 50 * 60 * 1000
  })
})
