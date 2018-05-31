import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { split } from 'apollo-link'
import { setContext } from 'apollo-link-context'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'

let client = {
    configure(
        uri,
        options = {
            defaultOptions: {
                query: {
                    fetchPolicy: 'no-cache'
                },
                mutate: {
                    fetchPolicy: 'no-cache'
                }
            },
            fetch,
            WebSocket,
            authorization: ''
        }
    ) {

        let F = options.fetch || window.fetch
        let W = options.WebSocket || window.WebSocket

        return new Promise(
            (resolve, reject) =>
            F(
                uri,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': options.authorization
                    },
                    body: JSON.stringify({
                        query: `
                        {
                            __schema {
                              types {
                                kind
                                name
                                possibleTypes {
                                    name
                                }
                              }
                            }
                        }                          
                        `
                    })
                }
            ).then(
                result =>
                    result.json()
            ).then(
                result => {
                
                    result.data.__schema.types = result.data.__schema.types.filter(
                        type => type.possibleTypes !== null
                    )
    
                    const httpLink = new HttpLink({
                            uri,
                            fetch: F
                        }),
                        subscriptionClient = new SubscriptionClient(
                            uri.replace(/^http/, 'ws'),
                            {
                                reconnect: true,
                                // wasKeepAliveReceived: true,
                                timeout: 60000
                            },
                            W
                        ),
                        wsLink = new WebSocketLink(
                            subscriptionClient
                        ),
                        authLink = setContext((_, { headers = {} }) => ({
                            headers: Object.assign(
                                headers,
                                {
                                    authorization: options.authorization
                                }
                            )
                        })),
                        link = split(
                            ({ query }) => {
                                const { kind, operation } = getMainDefinition(query)
                                return kind === 'OperationDefinition' && operation === 'subscription'
                            },
                            wsLink,
                            httpLink
                        ),
                        apolloClient = new ApolloClient({
                            link: authLink.concat(link),
                            cache: new InMemoryCache({
                                addTypename: false,
                                fragmentMatcher: new IntrospectionFragmentMatcher({
                                    introspectionQueryResultData: result.data
                                })
                            }),
                            defaultOptions: options.defaultOptions
                        })
    
                    Object.assign(
                        this,
                        apolloClient
                    )
    
                    this.__proto__ = apolloClient.__proto__
    
                    this.subscriptionClient = subscriptionClient

                    // temp solution to disable subscription cache
                    this.store.markSubscriptionResult = function() {}

                    resolve()
    
                }
            ).catch(reject)

        )

    }
}

export default client