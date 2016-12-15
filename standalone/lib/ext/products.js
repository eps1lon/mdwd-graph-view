function loadProducts(graph){
    return new Promise((fulfill, reject) => {
            // query for every product that is associated to a document
            let query = {
                "@context": {
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
                "@graph": [{
                    "@embed": "@always",
                    "@type": "nw:Product",
                    "ia:associatedTo": {
                        "@embed": "@always",
                        "@type": "ia:Document"
                    }
                }]
            };
    // use global jsonld-object of 'jsonld.js' for querying the jsonld graph
    jsonld.promises.frame(graph, query).then((frame) => {
        fulfill(frame["@graph"]);
}, (error) => {
        reject(error);
    });
});
}
