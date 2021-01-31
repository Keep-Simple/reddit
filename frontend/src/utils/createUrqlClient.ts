import { stringifyVariables } from '@urql/core'
import { ChangePasswordMutation } from './../generated/graphql'
import { cacheExchange } from '@urql/exchange-graphcache'
import {
    Cache,
    QueryInput,
    Resolver,
} from '@urql/exchange-graphcache/dist/types/types'
import {
    CombinedError,
    dedupExchange,
    errorExchange,
    fetchExchange,
} from 'urql'
import {
    LoginMutation,
    LogoutMutation,
    MeDocument,
    MeQuery,
    RegisterMutation,
} from '../generated/graphql'
import Router from 'next/router'

export const cursorPagination = (): Resolver => {
    return (_parent, fieldArgs, cache, info) => {
        const { parentKey, fieldName } = info

        const notInCache = !cache.resolveFieldByKey(
            parentKey,
            `${fieldName}(${stringifyVariables(fieldArgs)})`
        )

        info.partial = notInCache

        return cache
            .inspectFields(parentKey)
            .filter((info) => info.fieldName === fieldName)
            ?.reduce(
                (acc: string[], fi) =>
                    acc.concat(
                        cache.resolveFieldByKey(
                            parentKey,
                            fi.fieldKey
                        ) as string[]
                    ),
                []
            )
    }
}

// just funtion to get types
function betterUpdateQuery<Result, Query>(
    cache: Cache,
    qi: QueryInput,
    result: any,
    fn: (r: Result, q: Query) => Query
) {
    return cache.updateQuery(qi, (data) => fn(result, data as any) as any)
}

export const createUrqlClient = (ssrExchange: any) => ({
    url: 'http://localhost:3001/graphql',
    fetchOptions: {
        credentials: 'include' as const,
    },
    exchanges: [
        dedupExchange,
        cacheExchange({
            resolvers: {
                Query: {
                    // stack queries data to create long data list
                    posts: cursorPagination(),
                },
            },
            updates: {
                Mutation: {
                    createPost: (_result, args, cache, info) => {
                        // invalidate all posts queries to prevent data race conditions
                        cache
                            .inspectFields('Query')
                            ?.filter((info) => info.fieldName === 'posts')
                            ?.forEach((fi) => {
                                cache.invalidate(
                                    'Query',
                                    'posts',
                                    fi.arguments || {}
                                )
                            })
                    },
                    changePassword: (_result, args, cache, info) => {
                        // prevent redundant network me query fetch by putting user to cache
                        betterUpdateQuery<ChangePasswordMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            (result, query) => {
                                if (result.changePassword.errors) {
                                    return query
                                } else {
                                    return {
                                        me: result.changePassword.user,
                                    }
                                }
                            }
                        )
                    },
                    logout: (_result, args, cache, info) => {
                        // update me query, so ui will correspond
                        betterUpdateQuery<LogoutMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            () => ({ me: null })
                        )
                    },
                    login: (_result, args, cache, info) => {
                        // prevent redundant network me query fetch by putting user to cache
                        betterUpdateQuery<LoginMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            (result, query) => {
                                if (result.login.errors) {
                                    return query
                                } else {
                                    return {
                                        me: result.login.user,
                                    }
                                }
                            }
                        )
                    },
                    register: (_result, args, cache, info) => {
                        // prevent redundant network me query fetch by putting user to cache
                        betterUpdateQuery<RegisterMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            (result, query) => {
                                if (result.register.errors) {
                                    return query
                                } else {
                                    return {
                                        me: result.register.user,
                                    }
                                }
                            }
                        )
                    },
                },
            },
        }),
        errorExchange({
            onError: (error: CombinedError) => {
                if (error?.message.includes('not authenticated')) {
                    Router.replace('/login')
                }
            },
        }),
        ssrExchange,
        fetchExchange,
    ],
})
