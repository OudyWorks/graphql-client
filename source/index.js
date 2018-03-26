import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { split } from 'apollo-link'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'

let client = {
    configure(
        fetch,
        WebSocket,
        uri,
        options = {
            query: {
                fetchPolicy: 'no-cache'
            },
            mutate: {
                fetchPolicy: 'no-cache'
            }
        }
    ) {

        return new Promise(
            (resolve, reject) =>
            fetch(
                uri,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
                            fetch
                        }),
                        subscriptionClient = new SubscriptionClient(
                            uri.replace(/^http/, 'ws'),
                            {
                                reconnect: true,
                                // wasKeepAliveReceived: true,
                                timeout: 60000
                            },
                            WebSocket
                        ),
                        wsLink = new WebSocketLink(
                            subscriptionClient
                        ),
                        link = split(
                            ({ query }) => {
                                const { kind, operation } = getMainDefinition(query)
                                return kind === 'OperationDefinition' && operation === 'subscription'
                            },
                            wsLink,
                            httpLink
                        ),
                        apolloClient = new ApolloClient({
                            link,
                            cache: new InMemoryCache({
                                addTypename: false,
                                fragmentMatcher: new IntrospectionFragmentMatcher({
                                    introspectionQueryResultData: result.data
                                })
                            }),
                            defaultOptions: options
                        })
    
                    Object.assign(
                        client,
                        apolloClient
                    )
    
                    client.__proto__ = apolloClient.__proto__
    
                    client.subscriptionClient = subscriptionClient

                    resolve()
    
                }
            ).catch(reject)

        )

    }
}

export default client