(function (window) {
    'use strict';

    var domId = function (uri) {
        return uri.replace(':', '_')
    }

    /**
     * gets a northwind abox and parses it according to the TBOX from
     * https://trac.mmt.inf.tu-dresden.de/CRUISe/attachment/wiki/applications/infoapp/knowledgegraph_sample_tbox.png
     * into a graph thats visualizeable by infovis
     * @param abox
     */
    window.aboxParse = function (abox) {
        /**
         * visited nodes
         * @type {Set}
         */
        var visited = new Set()

        /**
         * nodes that need to be walked
         * queue type LIFO
         * @type {Array}
         */
        var unparsed = abox

        /**
         * the extended json for infovis
         * see https://philogb.github.io/jit/static/v20/Docs/files/Loader/Loader-js.html#Loader.js
         * @type {Array}
         */
        var json = []

        while (unparsed.length) {
            var node = unparsed.shift()
            if (!visited.has(node['@id'])) {
                visited.add(node['@id'])

                var adjacencies = []

                switch (node['@type']) {
                    case 'nw:Product':
                        adjacencies.push(node['nw:hasProductCategory'], node['nw:hasSupplier'])
                        break;
                    case 'ia:ConceptCluster':
                        adjacencies.push(...node['ia:containsIndividual'])
                        break;
                }

                // walk the adjacents
                unparsed.push(...adjacencies)

                var json_node = {
                    id: domId(node['@id']),
                    data: node,
                    adjacencies: adjacencies.map(a => {
                        return {
                            nodeTo: domId(a['@id']),
                            data: a
                        }
                    })
                }

                json.push(json_node)
            }
        }

        // TODO infovis needs a closed tree (e.g. there cant be two sets of nodes that dont connect)
        // thats currently not guaranteed
        return json
    }
})(this)