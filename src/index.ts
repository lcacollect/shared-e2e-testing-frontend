import { SetOperationsOpts } from './graphqlMock'
import { IntrospectionQuery } from 'graphql'
import { settingsArgs } from './login/auth'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(settings: settingsArgs): Chainable
      mockGraphql(schema: IntrospectionQuery): Chainable

      mockGraphqlOps<TObject, T extends keyof TObject, U extends TObject[T]>(
        key: T,
        resolver: U,
        options?: SetOperationsOpts,
      ): Cypress.Chainable
    }
  }
}

export * from './login'
export * from './upload'
export * from './graphqlMock'
