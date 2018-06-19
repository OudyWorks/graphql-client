import debounce from 'lodash.debounce'

let client = {
    uri: null,
    fetch: null,
    authorization: undefined,
    configure(
        uri,
        options = {
            fetch,
            authorization: '',
            batch: undefined
        }
    ) {
        this.uri = uri
        this.fetch = options.fetch || window.fetch
        this.authorization = options.authorization
        this.batch = options.batch
        this.queue = []
        if(this.batch) {
            if(this.batch === true)
                this.batch = {}
            this.purge = debounce(
                () => {
                    do {
                        let requests = this.queue.splice(0, this.batch.batchMax || 10)
                        this.request(requests.map(request => ({query: request.query, variables: request.variables}))).then(
                            (responses) =>
                                responses.map(
                                    (response, i) => {
                                        if(response.errors)
                                            requests[i].reject(response.errors)
                                        else
                                            requests[i].resolve(response)
                                    }
                                )
                        )
                    } while(this.queue.length)
                },
                this.batch.batchInterval || 10
            )
        }
    },
    request(body) {
        return new Promise(
            resolve => {
                this.fetch(
                    this.uri,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': this.authorization
                        },
                        body: JSON.stringify(body)
                    }
                ).then(
                    response =>
                        response.json()
                ).then(
                    response => {
                        if(response.errors)
                            reject(response.errors)
                        else
                            resolve(response)
                    }
                )
            }
        )
    },
    process(query, variables) {
        if(this.batch)
            return new Promise(
                (resolve, reject) => {
                    this.queue.push({query, variables, resolve, reject})
                    this.purge()
                }
            )
        else
            return this.request({query, variables})
    },
    query({query, variables}) {
        return this.process(query, variables)
    },
    mutate({mutation, variables}) {
        return this.process(mutation, variables)
    }
}

export default client