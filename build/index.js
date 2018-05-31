'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _apolloClient = require('apollo-client');

var _apolloLinkHttp = require('apollo-link-http');

var _apolloCacheInmemory = require('apollo-cache-inmemory');

var _subscriptionsTransportWs = require('subscriptions-transport-ws');

var _apolloLink = require('apollo-link');

var _apolloLinkContext = require('apollo-link-context');

var _apolloLinkWs = require('apollo-link-ws');

var _apolloUtilities = require('apollo-utilities');

let client = {
    configure(fetch, WebSocket, uri, options = {
        query: {
            fetchPolicy: 'no-cache'
        },
        mutate: {
            fetchPolicy: 'no-cache'
        }
    }, authorization = '') {

        class WS extends WebSocket {
            constructor(address, protocols, options) {
                super(address, protocols, {
                    headers: {
                        authorization
                    }
                });
            }
        }

        return new Promise((resolve, reject) => fetch(uri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authorization
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
        }).then(result => result.json()).then(result => {

            result.data.__schema.types = result.data.__schema.types.filter(type => type.possibleTypes !== null);

            const httpLink = new _apolloLinkHttp.HttpLink({
                uri,
                fetch
            }),
                  subscriptionClient = new _subscriptionsTransportWs.SubscriptionClient(uri.replace(/^http/, 'ws'), {
                reconnect: true,
                // wasKeepAliveReceived: true,
                timeout: 60000
            }, WS),
                  wsLink = new _apolloLinkWs.WebSocketLink(subscriptionClient),
                  authLink = (0, _apolloLinkContext.setContext)((_, { headers = {} }) => ({
                headers: Object.assign(headers, { authorization })
            })),
                  link = (0, _apolloLink.split)(({ query }) => {
                const { kind, operation } = (0, _apolloUtilities.getMainDefinition)(query);
                return kind === 'OperationDefinition' && operation === 'subscription';
            }, wsLink, httpLink),
                  apolloClient = new _apolloClient.ApolloClient({
                link: authLink.concat(link),
                cache: new _apolloCacheInmemory.InMemoryCache({
                    addTypename: false,
                    fragmentMatcher: new _apolloCacheInmemory.IntrospectionFragmentMatcher({
                        introspectionQueryResultData: result.data
                    })
                }),
                defaultOptions: options
            });

            Object.assign(client, apolloClient);

            client.__proto__ = apolloClient.__proto__;

            client.subscriptionClient = subscriptionClient;

            // temp solution to disable subscription cache
            client.store.markSubscriptionResult = function () {};

            resolve();
        }).catch(reject));
    }
};

exports.default = client;