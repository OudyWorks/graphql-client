import client from './index'
import fetch from 'node-fetch'
import ws from 'ws'

const WebSocket = authorization => 
    class WS extends ws {
        constructor(address, protocols, options) {
            super(
                address,
                protocols,
                {
                    headers: {
                        authorization
                    }
                }
            )
        }
    }

let nodeClient = {
    configure(
        uri,
        {
            defaultOptions = {
                query: {
                    fetchPolicy: 'no-cache'
                },
                mutate: {
                    fetchPolicy: 'no-cache'
                }
            },
            authorization = '',
            batch = undefined
        }
    ) {
        return client.configure.bind(this)(
            uri,
            {
                defaultOptions,
                authorization,
                batch,
                fetch,
                WebSocket: WebSocket(authorization)
            }
        )
    }
}

export default nodeClient