(function ($window) {
    'use strict';
    var $ = $window.jQuery

    /**
     * the json ld abox as a {Promise}
     */
    var abox = $.getJSON('data/northwind-abox.json')

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
    }

    /**
     * takes a query graph for a jsonld frame
     * @param query_graph
     * @returns {Promise}
     */
    $window.abox_query = function (query_graph) {
        return new Promise((fulfill, reject) => {
            var query = {
                "@context": ABOX_CONTEXT,
                "@graph": query_graph
            }

            abox.then((full_graph) => {
                jsonld.promises.frame(full_graph, query).then((frame) => {
                    fulfill(frame["@graph"]);
                }, (error) => {
                    reject(error);
                });
            })
        })
    }
})(this)