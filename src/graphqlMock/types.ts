import { IMocks } from '@graphql-tools/mock/typings/types'
import { QueryHookOptions, QueryResult, MutationHookOptions, MutationTuple } from '@apollo/client'

export interface SetOperationsOpts {
  name?: string
  endpoint?: string
  /* Delay for stubbed responses (in ms) */
  delay?: number
}

export interface GQLRequestPayload<AllOperations extends Record<string, any>> {
  operationName: Extract<keyof AllOperations, string>
  query: string
  variables: any
}

export interface MockGraphQLOptions<AllOperations extends Record<string, any>> {
  name?: string
  mocks?: IMocks
  endpoint?: string
  operations?: Partial<AllOperations>
  /* Global Delay for stubbed responses (in ms) */
  delay?: number
}

type QueryHook<TInput, TVars> = (baseOptions: QueryHookOptions<TInput, TVars>) => QueryResult<TInput, TVars>

type MutationHook<TInput, TVars> = (baseOptions: MutationHookOptions<TInput, TVars>) => MutationTuple<TInput, TVars>

export type QueryFN<T extends QueryHook<TInput, TVars>, TInput = any, TVars = any> = {
  keys?: keyof TInput | keyof TInput[]
  resolver: (opts: Parameters<T>[0]) => ReturnType<T>['data']
  error?: string
}

export type MutationFN<T extends MutationHook<TInput, TVars>, TInput = any, TVars = any> = {
  keys?: keyof TInput | keyof TInput[]
  resolver: (opts: Parameters<T>[0]) => ReturnType<T>[1]['data']
  error?: string
}
