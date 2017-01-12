(function (window) {
    'use strict';
    const EXTENDS_IDENT = 'EXTENDS'; // on change pls check schema definition in const schema

    const aboxQuery = window.aboxQuery || console.warn('abox_query not defined');

    const $ = window.jQuery;

    /**
     * Generates a factory from the schema that can generate data types from an abox
     * @constructor
     * @param schemas
     * @param schema_type
     */
    window.SchemaFactory = function (schemas, schema_type) {
        const that = this;

        this.schemas = schemas;
        this.schema_type = schema_type;

        const clone = o => JSON.parse(JSON.stringify(o));

        /**
         * computes the inheritance chain for a given type
         * @param type
         * @returns {Array}
         */
        const extensionStack = function (type) {
            const stack = [];

            let schema;
            while (schema = schemas[type]) {
                stack.push(type);
                type = schema[EXTENDS_IDENT];
            }

            return stack;
        };

        /**
         * gets this.fromJsonld() as a promise
         * @param uri
         * @returns {Promise}
         */
        this.byUri = function (uri) {
            return new Promise((fulfill) => {
                aboxQuery([{
                    "@id": uri,
                    "@embed": "@always"
                }]).then(graph => {
                    //console.log(graph)
                    fulfill(graph.map(g => that.fromJsonld(g)))
                })
            })
        };

        this.byUris = function (uris) {
            // TODO is there a way to query `where in` instead of iterating over list?
            return new Promise((fulfill) => {
                Promise.all(uris.map(uri => that.byUri(uri))).then(function (results) {
                    fulfill([].concat(...results)); // flattened array
                })
            })
        };

        /**
         * gets []<this.fromJsonld()> in a promise
         * @param type
         * @returns {Promise}
         */
        this.byType = function (type) {
            return new Promise(function (fulfill) {
                aboxQuery([{
                    "@embed": "@always",
                    "@type": type
                }]).then(function (graph) {
                    fulfill(graph.map(g => that.fromJsonld(g)));
                })
            })
        };

        /**
         * creates the data type with default value
         * @param type
         * @returns {Map}
         */
        this.emptyType = function (type) {
            if (schemas.hasOwnProperty(type)) {
                const data = clone(this.schemas[type].defaults);

                if (this.schemas[type][EXTENDS_IDENT] !== undefined) {
                    // merge
                    Object.assign(data, this.emptyType(this.schemas[type][EXTENDS_IDENT]))
                }

                return data
            }
        };

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
            let schema_type = this.schema_type(jsonld);
            // default values
            let schema = this.emptyType(schema_type);
            // stack 
            const build_stack = extensionStack(schema_type);

            // arrays are adjacent candidates
            const adj_candidates = Object.keys(jsonld)
                                         .filter(k => $.isArray(jsonld[k]))
            // every member of every candiate key gets fromJsonld applied
            const adjacent = [].concat(...adj_candidates.map(k => jsonld[k].map(j => this.fromJsonld(j)))); // flattened

            //console.log(schema_type, schema, build_stack, jsonld)

            // call build for each class in the inheritance chain starting with the superclass
            while (schema_type = build_stack.pop()) {
                schema = schemas[schema_type].build.call(this, clone(schema), jsonld, adjacent);
            }

            return schema;
        }
    }
})(this);