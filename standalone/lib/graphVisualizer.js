(function ($window) {
    var $ = $window.jQuery

    $window.GraphVisualizer = function (jqueryContext) {
        var $dom = jqueryContext

        var $minimap = $('#graphMinimap', $dom)
        var $graph = $('#domainGraph', $dom)

        // the graphlayout TODO: different layouts as constants
        var layout = null

        var graphToDomId = function (graph_id) {
            return graph_id.replace(':', '_')
        }

        // extracts node name for infovis from nodeType
        var nodeName = function (node) {
            // specific name attr
            var name_of_type = {
                // node type => name attribute
                'ia:Document': 'dc:title'
            }

            if (node['@type'] in name_of_type) {
                return node[name_of_type[node['@type']]]
            }

            // generic
            for (var name_attr of ['nw:hasName']) {
                if (name_attr in node) {
                    return node[name_attr]
                }
            }

            console.warn('no name attr found for ' + node['@id'])
            return undefined
        }

        this.showGraph = function (jsonld_graph) {
            //
            $('*', $graph).remove()

            var ht = new $jit.Hypertree({
                injectInto: 'domainGraph',
                height: $graph.height(),
                width: $graph.width(),
                Node: {
                    dim: 9,
                    color: "#f00"
                },
                Edge: {
                    lineWidth: 2,
                    color: "#088"
                },
                onCreateLabel: function(domElement, node){
                    domElement.innerHTML = node.name;
                },
                onPlaceLabel: function(domElement, node){
                    var style = domElement.style;
                    style.display = '';
                    style.cursor = 'pointer';
                    if (node._depth <= 1) {
                        style.fontSize = "0.8em";
                        style.color = "#ddd";

                    } else if(node._depth == 2){
                        style.fontSize = "0.7em";
                        style.color = "#555";

                    } else {
                        style.display = 'none';
                    }

                    var left = parseInt(style.left);
                    var w = domElement.offsetWidth;
                    style.left = (left - w / 2) + 'px';
                }
            })

            console.log(jsonld_graph)

            var json = {
                'id': 'graphVisualizerRoot',
                'name': jsonld_graph[0]['@type'], // just placeholder
                'children': jsonld_graph.map(n => {
                    var associated_to = n['ia:associatedTo'] || []

                    // single object is not given in list :(
                    if (!Array.isArray(associated_to)) {
                        associated_to = [associated_to]
                    }

                    return {
                        'id': graphToDomId(n['@id']),
                        'name': nodeName(n),
                        'children': associated_to.map(a => {
                            return {
                                'id': graphToDomId(a['@id']),
                                'name': nodeName(a)
                            }
                        })
                    }
                })
            }

            console.log(json)
            ht.loadJSON(json)

            ht.refresh();
        }
    }
})(this)