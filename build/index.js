'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _apolloClient = require('apollo-client');

var _apolloLinkHttp = require('apollo-link-http');

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

var _apolloCacheInmemory = require('apollo-cache-inmemory');

var _subscriptionsTransportWs = require('subscriptions-transport-ws');

var _apolloLink = require('apollo-link');

var _apolloLinkWs = require('apollo-link-ws');

var _apolloUtilities = require('apollo-utilities');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const uri = '10.0.0.21:83'

let client = {
    configure(uri, options = {
        query: {
            fetchPolicy: 'network-only'
        }
    }, WebSocket) {

        const httpLink = new _apolloLinkHttp.HttpLink({
            uri,
            fetch: _nodeFetch2.default
        }),
              wsLink = new _apolloLinkWs.WebSocketLink(new _subscriptionsTransportWs.SubscriptionClient(uri.replace(/^http/, 'ws'), {
            reconnect: true,
            // wasKeepAliveReceived: true,
            timeout: 60000
        }, WebSocket)),
              link = (0, _apolloLink.split)(({ query }) => {
            const { kind, operation } = (0, _apolloUtilities.getMainDefinition)(query);
            return kind === 'OperationDefinition' && operation === 'subscription';
        }, wsLink, httpLink);

        Object.assign(client, new _apolloClient.ApolloClient({
            link,
            cache: new _apolloCacheInmemory.InMemoryCache({
                addTypename: false
            }),
            defaultOptions: options
        }));
    }
};

exports.default = client;