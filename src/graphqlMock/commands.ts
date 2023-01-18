import { graphql, buildClientSchema, printSchema, GraphQLError, IntrospectionQuery } from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { addMocksToSchema } from '@graphql-tools/mock'
import { GQLRequestPayload, SetOperationsOpts } from './types'

const wait =
  (timeout: number) =>
  <T>(response: T) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(response), timeout))

/**
 * Adds a .mockGraphql() and .mockGraphqlOps() methods to the cypress chain.
 *
 * The .mockGraphql should be called in the cypress "before" or "beforeEach" block
 * config to set up the server.
 *
 * By default, it will use the /graphql endpoint, but this can be changed
 * depending on the server implementation
 *
 * It takes an "operations" object, representing the named operations
 * of the GraphQL server. This is combined with the "mocks" option,
 * to modify the output behavior per test.
 *
 * The .mockGraphqlOps() allows you to configure the mock responses at a
 * more granular level
 *
 * For example, if we have a query called "UserQuery" and wanted to
 * explicitly force a state where a viewer is null (logged out), it would
 * look something like:
 *
 * .mockGraphqlOps({
 *   operations: {
 *     UserQuery: {
 *       viewer: null
 *     }
 *   }
 * })
 */
export const mockGraphql: Cypress.Chainable<any>['mockGraphql'] = function <
  TObject extends Record<any, any>,
  TKey extends keyof TObject,
  TResult extends TObject[TKey],
>(schema: IntrospectionQuery) {
  const endpoint = '/graphql',
    delay = 0,
    operations = {},
    mocks = {}

  const executeableSchema = makeExecutableSchema({
    typeDefs: printSchema(buildClientSchema(schema)),
  })

  addMocksToSchema({
    schema: executeableSchema,
    mocks,
  })

  let currentDelay = delay
  let currentOps: Record<TKey, TResult> = {} as any

  cy.on('window:before:load', (win) => {
    console.log('window:before:load')
    const originalFetch = win.fetch
    async function fetch(input: RequestInfo, init?: RequestInit) {
      if (typeof input !== 'string') {
        throw new Error(
          `Currently only support fetch(url, options), saw fetch(Request), received: ${JSON.stringify(input)}`,
        )
      }
      if (input.indexOf(endpoint) !== -1 && init && init.method === 'POST') {
        const payload: GQLRequestPayload<TResult> = JSON.parse(init.body as string)
        console.log('GraphQL Mock opts', payload)
        const { operationName, query, variables } = payload

        const fn = currentOps[operationName as unknown as TKey]

        if (fn.error) {
          throw new GraphQLError(fn.error)
        }
        const data = fn.resolver({ variables })

        console.log('GraphQL Mock data', data)

        return await graphql({
          schema: executeableSchema,
          source: query,
          variableValues: variables,
          operationName,
          rootValue: data,
        })
          .then(wait(currentDelay))
          .then((data: any) => new Response(JSON.stringify(data)))
      }
      return originalFetch(input, init)
    }
    cy.stub(win, 'fetch', fetch).as('fetchStub')
  })
  //
  return cy
    .wrap({
      setOperations: (key: TKey, fn: TResult, options: SetOperationsOpts = {}) => {
        currentDelay = options.delay || 0
        currentOps = {
          ...currentOps,
          [key]: fn,
        }
      },
    })
    .as(getAlias())
}

export const mockGraphqlOps: Cypress.Chainable<unknown>['mockGraphqlOps'] = function (key, fn, opts) {
  console.log('Saving operation:', fn)
  return cy.get(`@${getAlias(opts?.name)}`).invoke('setOperations' as any, key, fn, opts)
}

const getAlias = (nickname = 'default') => `mockGraphqlOps:${nickname}`

Cypress.Commands.add('mockGraphql', mockGraphql)
Cypress.Commands.add('mockGraphqlOps', mockGraphqlOps)
