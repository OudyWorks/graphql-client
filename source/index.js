import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { split } from 'apollo-link'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'

// const uri = '10.0.0.21:83'

let client = {
    configure(
        fetch,
        WebSocket,
        uri,
        options = {
            query: {
                fetchPolicy: 'network-only'
            }
        }
    ) {

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
                    addTypename: false
                }),
                defaultOptions: options
            })

        Object.assign(
            client,
            apolloClient
        )

        client.__proto__ = apolloClient.__proto__

        client.subscriptionClient = subscriptionClient

    }
}

export default client