(function ($window) {
    var $ = $window.jQuery

    var aboxQuery = window.abox_query

    $window.GraphVisualizer = function (jqueryContext) {
        var $dom = jqueryContext

        var $minimap = $('#graphMinimap', $dom)
        var $graph = $('#domainGraph', $dom)
        var $graphLegend = $('#graphLegend', $dom)

        // the graphlayout TODO: different layouts as constants
        var layout = null

        var graphToDomId = function (graph_id) {
            return graph_id.replace(':', '_')
        }

        var that = this

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
                dim: 10,
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
                type: 'Native',
                onClick: function (node, eventInfo, e) {
                    var pos = eventInfo.getPos()

                    if (node === false) {
                        // this doesnt really work
                        // node = jit.graph.getClosestNodeToPos(new $jit.Complext(pos.x, pos.y))
                    }

                    // TODO this is our conceptsSelected handle!
                    if (node !== false) {
                        // this is semantically a Tip but Tips are attached to the cursorpointer
                        // and not permanent
                        $('#detailView').html('<pre>' + JSON.stringify(node.data, null, 4) + '</pre>')

                        // centering onclick
                        jit.onClick(node.id)
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
            onComplete: function () {
                // create legend
                var $legend = $('dl', $graphLegend)

                // remove old
                $('*:not(.template)', $legend).remove()

                // create map
                var colors = new Set()

                // loop through node and map $color => $colorBasedOn
                $jit.Graph.Util.eachNode(jit.graph, function (node) {
                    var color = node.data['$color'] || node.Node.color

                    if (!colors.has(color)) {
                        colors.add(color)

                        var legend = 'Unknown'
                        if (node.data['$colorBasedOn']) {
                            legend
                                = node.data['$colorBasedOn'].split(',')
                                                            .map(basedOn => node.data[basedOn])
                        }

                        var $color = $('.color.template', $legend).clone(true)
                                                                  .removeClass('template')
                        var $desc = $('.colorLegend.template', $legend).clone(true)
                                                                       .removeClass('template')

                        $color.css('background-color', color)
                        $desc.text(legend)

                        $legend.append($color, $desc)
                    }
                })
            },
            onPlaceLabel: function (domElement, node) {
            }
        })

        $(window).resize(function () {
            jit.canvas.resize($graph.width(), $graph.height())
        })

        $('h2', $graphLegend).click(function () {
            $('dl', $graphLegend).toggle()
        })

        // class functions
        this.showGraph = function (jsonld_graph) {
            console.log('showGraph caught with', jsonld_graph)

            jit.loadJSON(aboxParse(jsonld_graph))

            jit.refresh()
            jit.controller.onComplete()
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
                    that.showGraph([].concat(...results)) // flattened array
                }

            })
        }
    }
})(this)