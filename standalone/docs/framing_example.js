(function (window) {
    'use strict';
    const $ = window.jQuery;

    /**
     * put these members where they fit best. they were just put into one obj
     * for better overview
     *
     * @type {{context: {owl: string, dcam: string, rdf: string, dcmi: string, xml: string, xsd: string, ia: string, nw: string, nwa: string, rdfs: string, dc: string}, data: *, query: query, byUri: byUri, byUris: byUris, byType: byType}}
     */
    const Abox = {
        /**
         * just c&p from trac dont know what this does...
         * just some shortcuts i guess
         *
         * @type {{owl: string, dcam: string, rdf: string, dcmi: string, xml: string, xsd: string, ia: string, nw: string, nwa: string, rdfs: string, dc: string}}
         */
        context: {
            owl: "http://www.w3.org/2002/07/owl#",
            dcam: "http://purl.org/dc/dcam/",
            rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            dcmi: "http://purl.org/dc/dcmitype/",
            xml: "http://www.w3.org/XML/1998/namespace",
            xsd: "http://www.w3.org/2001/XMLSchema#",
            ia: "http://mmt.inf.tu-dresden.de/infoapp#",
            nw: "http://microsoft.com/2013/northwind#",
            nwa: "http://microsoft.com/2013/northwind/abox-2016#",
            rdfs: "http://www.w3.org/2000/01/rdf-schema#",
            dc: "http://purl.org/dc/terms/"
        },
        /**
         * the actual abox in jsonld format
         *
         * @type {Promise}
         */
        data: $.getJSON('northwind-abox.json'),
        /**
         * takes a query graph for a jsonld frame
         *
         * @param query_graph
         * @returns {Promise}
         */
        query: function (query_graph) {
            return new Promise(function (fulfill, reject) {
                const query = {
                    "@context": Abox.context,
                    "@graph": query_graph
                };

                Abox.data.then((full_graph) => {
                    jsonld.promises.frame(full_graph, query).then(function (frame) {
                        fulfill(frame["@graph"]);
                    }, function (error) {
                        reject(error);
                    });
                });
            });
        },
        /**
         *
         * @param {String} uri
         * @returns {Promise}
         */
        byUri: function (uri) {
            return new Promise((fulfill) => {
                Abox.query([{
                    "@id": uri,
                    // jsonld resolves the references so u get actual jsonld objects
                    "@embed": "@always"
                }]).then((graph) => {
                    fulfill(graph);
                })
            })
        },
        /**
         * sql-like where type = `$type`
         * @param {String[]} uris
         * @returns {Promise}
         */
        byUris: function (uris) {
            // TODO is there a way to query `where in` instead of iterating over list?
            return new Promise((fulfill) => {
                Promise.all(uris.map(uri => Abox.byUri(uri))).then((graphs) => {
                    // flattened array
                    fulfill([].concat(...graphs.map(g => g.content)));
                })
            })
        },
        /**
         * sql-like where type = `$type`
         * @param {String} type
         * @returns {Promise}
         */
        byType: function (type) {
            return new Promise(function (fulfill) {
                Abox.query([{
                    "@embed": "@always",
                    "@type": type
                }]).then((graph) => {
                    fulfill(graph);
                })
            })
        }
    };

    /**
     * defaults for the artefact builder
     * @type {{uri: string, string: string}}
     */
    const DEFAULTS = {
        'uri': 'defaultURI',
        'string': 'defaultString'
    };

    //

    /**
     * a way to build artefacts
     * remember that this is context specific
     * the actual application should provide an interface
     * @param jsonld
     * @returns {{uri: *, type: *, label: (*|string), sourceGraph: string, description: string, relatedArtefacts: Array}}
     */
    const buildArtefact = function (jsonld) {
        const schema = {
            'uri': jsonld['@id'],
            'type': jsonld['@type'],
            'label': jsonld['nw:hasTitle'] || `instance of ${jsonld['@type']} is not a Thing`,
            'sourceGraph': DEFAULTS.uri,
            'description': DEFAULTS.string,
            'relatedArtefacts': []
        };

        if (jsonld.hasOwnProperty('nw:hasDescription')) {
            schema.description = jsonld['nw:hasDescription']
        }

        return schema
    };

    // if you dont know Promises read them up first
    // and if your annoyed by callbacks read up about async/await syntax if interested

    // read up about the types under
    // https://trac.mmt.inf.tu-dresden.de/CRUISe/wiki/applications/infoapp#Wissensmodell

    // some documents
    const type = 'ia:Document';
    Abox.byType(type).then((results) => {
        console.log('type', type, results);
    });

    // a specific thing
    const uri = 'nwa:ProductCategory0';
    Abox.byUri(uri).then((results) => {
        console.log('uri', uri, results);
        console.log(buildArtefact(results[0]))
    });
})(this);