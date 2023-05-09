const apiScopes = ['user.read']
const environment = 'login.windows.net'

const buildAccountEntity = (
  homeAccountId: string,
  realm: string,
  localAccountId: string,
  username: string,
  name: string,
) => {
  return {
    authorityType: 'MSSTS',
    // This could be filled in but it involves a bit of custom base64 encoding
    // and would make this sample more complicated.
    // This value does not seem to get used, so we can leave it out.
    clientInfo: '',
    homeAccountId,
    environment,
    realm,
    localAccountId,
    username,
    name,
  }
}

const buildIdTokenEntity = (homeAccountId: string, idToken: string, realm: string, clientId: string) => {
  return {
    credentialType: 'IdToken',
    homeAccountId,
    environment,
    clientId,
    secret: idToken,
    realm,
  }
}

const buildAccessTokenEntity = (
  homeAccountId: string,
  accessToken: string,
  expiresIn: number,
  extExpiresIn: number,
  realm: string,
  scopes: string[],
  clientId: string,
) => {
  const now = Math.floor(Date.now() / 1000)
  return {
    homeAccountId,
    credentialType: 'AccessToken',
    secret: accessToken,
    cachedAt: now.toString(),
    expiresOn: (now + expiresIn).toString(),
    extendedExpiresOn: (now + extExpiresIn).toString(),
    environment,
    clientId,
    realm,
    target: scopes.map((s: string) => s.toLowerCase()).join(' '),
    // Scopes _must_ be lowercase or the token won't be found
  }
}

const parseJwt = (token: string) => {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      })
      .join(''),
  )

  return JSON.parse(jsonPayload)
}

const injectTokens = (tokenResponse: any, clientId: string) => {
  const idToken = parseJwt(tokenResponse.id_token)
  const localAccountId = idToken['oid'] || idToken['sid']
  const realm = idToken['tid']
  const homeAccountId = `${localAccountId}.${realm}`
  const username = idToken['preferred_username']
  const name = idToken['name']

  const accountKey = `${homeAccountId}-${environment}-${realm}`
  const accountEntity = buildAccountEntity(homeAccountId, realm, localAccountId, username, name)

  const idTokenKey = `${homeAccountId}-${environment}-idtoken-${clientId}-${realm}-`
  const idTokenEntity = buildIdTokenEntity(homeAccountId, tokenResponse.id_token, realm, clientId)

  const accessTokenKey = `${homeAccountId}-${environment}-accesstoken-${clientId}-${realm}-${apiScopes.join(' ')}`
  const accessTokenEntity = buildAccessTokenEntity(
    homeAccountId,
    tokenResponse.access_token,
    tokenResponse.expires_in,
    tokenResponse.ext_expires_in,
    realm,
    apiScopes,
    clientId,
  )

  const tokenKeys = {
    idToken: [idTokenKey],
    accessToken: [accessTokenKey],
    refreshToken: [],
  }

  window.localStorage.setItem(`msal.token.keys.${clientId}`, JSON.stringify([tokenKeys]))
  window.sessionStorage.setItem('msal.account.keys', JSON.stringify([accountKey]))

  window.sessionStorage.setItem(accountKey, JSON.stringify(accountEntity))
  window.sessionStorage.setItem(idTokenKey, JSON.stringify(idTokenEntity))
  window.sessionStorage.setItem(accessTokenKey, JSON.stringify(accessTokenEntity))
}

export interface settingsArgs {
  tenantId: string
  clientId: string
  clientSecret: string
  username: string
  password: string
}

export const login = (
  cachedTokenResponse: string,
  { tenantId, clientId, clientSecret, username, password }: settingsArgs,
) => {
  let tokenResponse: any = null
  const authority = `https://login.microsoftonline.com/${tenantId}`
  let chainable: Cypress.Chainable = cy.visit('/')

  if (!cachedTokenResponse) {
    chainable = chainable.request({
      url: authority + '/oauth2/v2.0/token',
      method: 'POST',
      body: {
        // eslint-disable-next-line camelcase
        grant_type: 'password',
        // eslint-disable-next-line camelcase
        client_id: clientId,
        // eslint-disable-next-line camelcase
        client_secret: clientSecret,
        scope: ['openid profile email'].concat(apiScopes).join(' '),
        username: username,
        password: password,
      },
      form: true,
    })
  } else {
    chainable = chainable.then(() => {
      return {
        body: cachedTokenResponse,
      }
    })
  }

  chainable
    .then((response) => {
      injectTokens(response.body, clientId)
      tokenResponse = response.body
    })
    .reload()
    .then(() => {
      return tokenResponse
    })

  return chainable
}
