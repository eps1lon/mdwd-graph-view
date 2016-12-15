(function ($window) {
    var $ = $window.jQuery

    var aboxQuery = window.abox_query

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
            //Change the animation transition type
            transition: $jit.Trans.Circ.easeOut,
            //animation duration (in milliseconds)
            duration: 1000,
            Node: {
                dim: 2,
                color: 'red',
                overridable: true,
                transform: false
            },
            Edge: {
                lineWidth: 1,
                color: "red",
                overridable: false
            },
            Events: {
                enable: true,
                onClick: function (node, eventInfo, e) {
                    // TODO this is our conceptsSelected handle!
                    if (node !== false) {

                        // this is semantically a Tip but Tips are attached to the cursorpointer
                        // and not permanent
                        $('#detailView').html('<pre>' + JSON.stringify(node.data, null, 4) + '</pre>')

                        // centering onclick
                        jit.onClick(node.id, {
                            onComplete: function () {
                                jit.controller.onComplete();
                            }
                        });
                    }
                }
            },
            Navigation: {
                enable: true,
                panning: true, // 'avoid nodes'
                zooming: 20
            },
            Tips: {
                enable: true,
                onShow: function (tip, node) {
                    // thats where Events.onClick should be in a perfect world
                }
            },
            /**
             * extracts the name for the node from the jsonld data
             *
             * @param domElement
             * @param node
             */
            onCreateLabel: function (domElement, node) {
                var node_name = node.name || node.id
                var jsonld = node.data

                // specific name attr
                var name_of_type = {
                    // node type => name attribute
                    'ia:Document': 'dc:title',
                    'nw:Supplier': 'nw:hasTitle'
                }

                if (jsonld['@type'] in name_of_type) {
                    node_name = jsonld[name_of_type[jsonld['@type']]]
                } else if (jsonld['@type'] === 'ia:ConceptCluster') {
                    node_name = jsonld['rdfs:label']['@value']
                } else if (jsonld['nw:hasFirstName']) {
                    node_name = [jsonld['nw:hasFirstName'], jsonld['nw:hasLastName']].join(' ')
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
            onPlaceLabel: function (domElement, node) {
                var style = domElement.style;
                style.display = '';
                style.cursor = 'pointer';
                if (node._depth <= 1) {
                    style.fontSize = "0.8em";
                    style.color = "#ddd";

                } else if (node._depth == 2) {
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
            console.log('showGraph caught with', jsonld_graph)

            jit.loadJSON(aboxParse(jsonld_graph))

            jit.refresh();
        }

        /**
         *
         * @param {Array<ConceptCluster>} domains
         */
        this.showDomain = function (domains) {
            console.log('showDomain caught with', domains)

            // remove conceptcluster from graph that are not included

            // add new graph for domain

            // for now we use the empty-create crowbar
            jit.canvas.clear()

            // query Things contained in Conceptcluster
            // TODO is there a way to query `where in` instead of iterating over list?

            // list of promises
            queries = []
            for (var domain of domains) {
                queries.push(aboxQuery([{
                    "@embed": "@always",
                    "@id": domain.uri
                }]))
            }

            Promise.all(queries).then(function (results) {
                if (results.length) {
                    jit.loadJSON(aboxParse([].concat(...results))) // flattened array
                    jit.refresh()
                }

            })
        }
    }
})(this)