import liteClient from './lite'
import fetch from 'node-fetch'

let liteNodeClient = Object.assign({}, liteClient)

liteNodeClient.configure = function(
        uri,
        {authorization = ''}
    ) {
        return liteClient.configure.bind(this)(
            uri,
            {
                fetch,
                authorization
            }
        )
    }

export default liteNodeClient