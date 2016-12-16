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
        var unparsed = JSON.parse(JSON.stringify(abox)) // clone

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
                    // infoapp TBOX
                    case 'ia:ConceptCluster':
                        adjacencies.push(...node['ia:containsIndividual'])
                        break
                    // northwind TBOX
                    case 'nw:Product':
                        adjacencies.push(node['nw:hasProductCategory'], node['nw:hasSupplier'])
                        break
                    case 'nw:Employee':
                        adjacencies.push(node['nw:hasTerritory'])
                        break
                    case 'nw:Order':
                        adjacencies.push(
                            node['nw:hasEmployee'],
                            node['nw:hasCustomer'],
                            //node['nw:hasOrderDetails'], // not in order0
                            //node['nw:hasShippingRegion'],
                            node['nw:viaShipper']
                        )
                        break
                    case 'nw:OrderDetails':
                        adjacencies.push(
                            node['nw:hasOrder'],
                            node['nw:hasProduct']
                        )
                }

                // walk the adjacents
                unparsed.push(...adjacencies)

                var json_node = {
                    id: domId(node['@id']),
                    data: Object.assign(node, {
                        // some number bases on the chars of type as hex
                        '$color': '#' + ([...node['@type']].reduce((s, c) => s * c.charCodeAt() % (1<<24), 1)).toString(16),
                        '$colorBasedOn': '@type' // legend helper
                    }),
                    adjacencies: adjacencies.map(a => {
                        return {
                            nodeTo: domId(a['@id']),
                            data: Object.assign(a, {
                                // FIXME it's ignored, overridable=true will use node colors
                                '$color': 'blue'
                            })
                        }
                    })
                }

                json.push(json_node)
            }
        }

        // TODO infovis needs a connected graph, disconnected graphs cannot be drawn nicely
        // thats currently not guaranteed
        console.log(json.map(n => n.id))
        return json
    }
})(this)