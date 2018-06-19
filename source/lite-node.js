import liteClient from './lite'
import fetch from 'node-fetch'

let liteNodeClient = Object.assign({}, liteClient)

liteNodeClient.configure = function(
        uri,
        {authorization = '', batch = undefined}
    ) {
        return liteClient.configure.bind(this)(
            uri,
            {
                fetch,
                authorization,
                batch
            }
        )
    }

export default liteNodeClient