let client = {
    uri: null,
    fetch: null,
    authorization: undefined,
    configure(
        uri,
        options = {
            fetch,
            authorization: ''
        }
    ) {
        this.uri = uri
        this.fetch = options.fetch || window.fetch
        this.authorization = options.authorization
    },
    request(query, variables = {}) {
        return this.fetch(
            this.uri,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': this.authorization
                },
                body: JSON.stringify({
                    query, variables
                })
            }
        ).then(
            response =>
                response.json()
        )
    },
    query({query, variables}) {
        return this.request(query, variables)
    },
    mutate({mutation, variables}) {
        return this.request(mutation, variables)
    }
}

export default client