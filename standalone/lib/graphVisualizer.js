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

        // create jit graph
        var jit = new $jit.Hypertree({
            injectInto: $graph.attr('id'),
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
            Events: {
                enable: true,
                onClick: function (node, eventInfo, e) {
                    // TODO this is our conceptsSelected handle!
                    if (node !== false) {
                        $('#detailView').html('<pre>'  + JSON.stringify(node.data, null, 4) + '</pre>')

                        console.log(node)
                    }
                }
            },
            Navigation: {
                enable: true,
                panning: true, // 'avoid nodes'
                zooming: 20
            },

            /**
             * extracts the name for the node from the jsonld data
             *
             * @param domElement
             * @param node
             */
            onCreateLabel: function(domElement, node) {
                var node_name = node.name
                var jsonld = node.data

                // specific name attr
                var name_of_type = {
                    // node type => name attribute
                    'ia:Document': 'dc:title'
                }

                if (jsonld['@type'] in name_of_type) {
                    node_name = node[name_of_type[jsonld['@type']]]
                } else if (jsonld['@type'] === 'ia:ConceptCluster') {
                    node_name = jsonld['rdfs:label']['@value']
                } else {
                    // generic
                    for (var name_attr of ['nw:hasName']) {
                        if (name_attr in jsonld) {
                            node_name = jsonld[name_attr]
                        }
                    }
                }

                if (node_name === undefined) {
                    console.warn('no name attr found for ' + jsonld['@id'], jsonld)
                }

                $(domElement).text(node_name)
            },
            onPlaceLabel: function(domElement, node) {
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

        $(window).resize(function () {
            jit.canvas.resize($graph.width(), $graph.height())
        })

        // class functions
        this.showGraph = function (jsonld_graph) {
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
                        'data': n,
                        'children': associated_to.map(a => {
                            return {
                                'id': graphToDomId(a['@id']),
                                'data': 'a'
                            }
                        })
                    }
                })
            }

            console.log(json)
            jit.loadJSON(json)

            jit.refresh();
        }
    }
})(this)