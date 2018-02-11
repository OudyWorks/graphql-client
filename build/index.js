'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _apolloClient = require('apollo-client');

var _apolloLinkHttp = require('apollo-link-http');

var _apolloCacheInmemory = require('apollo-cache-inmemory');

var _subscriptionsTransportWs = require('subscriptions-transport-ws');

var _apolloLink = require('apollo-link');

var _apolloLinkWs = require('apollo-link-ws');

var _apolloUtilities = require('apollo-utilities');

// const uri = '10.0.0.21:83'

let client = {
    configure(fetch, WebSocket, uri, options = {
        query: {
            fetchPolicy: 'network-only'
        }
    }) {

        const httpLink = new _apolloLinkHttp.HttpLink({
            uri,
            fetch
        }),
              subscriptionClient = new _subscriptionsTransportWs.SubscriptionClient(uri.replace(/^http/, 'ws'), {
            reconnect: true,
            // wasKeepAliveReceived: true,
            timeout: 60000
        }, WebSocket),
              wsLink = new _apolloLinkWs.WebSocketLink(subscriptionClient),
              link = (0, _apolloLink.split)(({ query }) => {
            const { kind, operation } = (0, _apolloUtilities.getMainDefinition)(query);
            return kind === 'OperationDefinition' && operation === 'subscription';
        }, wsLink, httpLink),
              apolloClient = new _apolloClient.ApolloClient({
            link,
            cache: new _apolloCacheInmemory.InMemoryCache({
                addTypename: false
            }),
            defaultOptions: options
        });

        Object.assign(client, apolloClient);

        client.__proto__ = apolloClient.__proto__;

        client.subscriptionClient = subscriptionClient;
    }
};

exports.default = client;