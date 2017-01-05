(function (window) {
    'use strict';
    const EXTENDS_IDENT = 'EXTENDS' // on change pls check schema definition in const schema

    var aboxQuery = window.abox_query || console.warn('abox_query not defined')

    /**
     * Generates a factory from the schema that can generate data types from an abox
     * @param schemas {Map(...data_type => {'defaults' => Map(...key => default_value)}, 'extends': data_type | undefined, 'build': function (data, jsonld)}
     * @constructor
     */
    window.SchemaFactory = function (schemas, schema_type) {
        var that = this

        this.schemas = schemas
        this.schema_type = schema_type

        var clone = o => JSON.parse(JSON.stringify(o))

        /**
         * computes the inheritance chain for a given type
         * @param type
         * @returns {Array}
         */
        var extensionStack = function (type) {
            var stack = []

            var schema
            while (schema = schemas[type]) {
                stack.push(type)
                type = schema[EXTENDS_IDENT]
            }

            return stack
        }

        /**
         * gets this.fromJsonld() as a promise
         * @param uri
         * @returns {Promise}
         */
        this.byUri = function (uri) {
            return new Promise((fulfill, reject) => {
                aboxQuery([{
                    "@id": uri,
                    "@embed": "@always"
                }]).then(graph => {
                    console.log(graph)
                    fulfill(graph.map(g => that.fromJsonld(g)))
                })
            })
        }

        this.byUris = function (uris) {
            // TODO is there a way to query `where in` instead of iterating over list?
            return new Promise((fulfill, reject) => {
                Promise.all(uris.map(uri => that.byUri(uri))).then(function (results) {
                    fulfill([].concat(...results)) // flattened array
                })
            })
        }

        /**
         * gets []<this.fromJsonld()> in a promise
         * @param type
         * @returns {Promise}
         */
        this.byType = function (type) {
            return new Promise((fulfill, reject) => {
                abox_query([{
                    "@embed": "@always",
                    "@type": type
                }]).then(graph => {
                    fulfill(graph.map(g => that.fromJsonld(g)))
                })
            })
        }

        /**
         * creates the data type with default value
         * @param type
         * @returns {Map}
         */
        this.emptyType = function (type) {
            if (schemas.hasOwnProperty(type)) {
                var data = clone(this.schemas[type].defaults)

                if (this.schemas[type][EXTENDS_IDENT] !== undefined) {
                    // merge
                    Object.assign(data, this.emptyType(this.schemas[type][EXTENDS_IDENT]))
                }

                return data
            }
        }

        /**
         * parses the jsonld data into a fitting schema data type
         * it calls the build callback for each data type in the inheritance chain starting
         * with the superclass
         * recursive calls to this function should only be made on children and not adjacencies
         * or in a way that you can be sure you wont encounter circles, thanks
         *
         * @param jsonld
         * @returns {Map}
         */
        this.fromJsonld = function (jsonld) {
            // if the objects are not embedded we only get an id
            if (Object.keys(jsonld).length   == 1) {
                return jsonld['@id']
            }

            // get the schema type generally something derived from `@type`
            var schema_type = this.schema_type(jsonld)
            // default values
            var schema = this.emptyType(schema_type)
            // stack 
            var build_stack = extensionStack(schema_type)

            //console.log(schema_type, schema, build_stack, jsonld)

            // call build for each class in the inheritance chain starting with the superclass
            while (schema_type = build_stack.pop()) {
                schema = schemas[schema_type].build.call(this, clone(schema), jsonld)
            }

            return schema
        }
    }
})(this)