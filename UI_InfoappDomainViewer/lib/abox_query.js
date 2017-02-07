(function (window) {
    'use strict';
    const $ = window.jQuery;

    /**
     * the json ld abox as a {Promise}
     */
    const abox_filename = 'http://localhost:8080/csr-client/components/mdwd/GraphView/data/northwind-abox.json'; // 'data/northwind-abox.json';
    const abox = $.getJSON(abox_filename);
    /**
     * context c&p from trac
     * @type {{owl: string, dcam: string, rdf: string, dcmi: string, xml: string, xsd: string, ia: string, nw: string, nwa: string, rdfs: string, dc: string}}
     */
    const ABOX_CONTEXT = {
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
    };

    /**
     * takes a query graph for a jsonld frame
     * @param query_graph
     * @returns {Promise}
     */
    window.aboxQuery = function (query_graph) {
    	console.warn('jsonld api broken in component context. use static json ld graphs');
    	
        return new Promise(function (fulfill, reject) {
            const query = {
                "@context": ABOX_CONTEXT,
                "@graph": query_graph
            };

            abox.then((full_graph) => {
            	console.warn(full_graph, query)
                jsonld.promises.frame(full_graph, query).then(function (frame) {
                    fulfill(frame["@graph"]);
                }, function (error) {
                    reject(error);
                });
            });
        });
    }
})(this);