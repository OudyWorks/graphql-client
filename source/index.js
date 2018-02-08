import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import fetch from 'node-fetch'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { split } from 'apollo-link'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'
// import WebSocket from 'ws'

// const uri = '10.0.0.21:83'

let client = {
    configure(
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
            wsLink = new WebSocketLink(
                new SubscriptionClient(
                    uri.replace(/^http/, 'ws'),
                    {
                        reconnect: true,
                        // wasKeepAliveReceived: true,
                        timeout: 60000
                    },
                    typeof WebSocket != 'undefined' ? WebSocket : require('ws')
                )
            ),
            link = split(
                ({ query }) => {
                    const { kind, operation } = getMainDefinition(query)
                    return kind === 'OperationDefinition' && operation === 'subscription'
                },
                wsLink,
                httpLink
            )

        Object.assign(
            client,
            new ApolloClient({
                link,
                cache: new InMemoryCache({
                    addTypename: false
                }),
                defaultOptions: options
            })
        )

    }
}

export default client