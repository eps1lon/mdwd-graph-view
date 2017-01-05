(function ($window) {
    var $ = $window.jQuery

    // this is basically our access to the abox pressed in our schema
    /**
     *
     * @type {SchemaFactory}
     */
    var schema = $window.northwind || console.warn('no schema defined')

    $window.GraphVisualizer = function (jqueryContext) {
        var that = this
        var $dom = jqueryContext

        var $minimap = $('#graphMinimap', $dom)
        var $graph = $('#domainGraph', $dom)
        var $graphLegend = $('#graphLegend', $dom)

        var concepts_selected_listeners = []

        // the graphlayout TODO: different layouts as constants
        var layout = null

        var uriToDomId = function (uri) {
            return uri.replace(':', '_')
        }

        var that = this

        // create jit graph
        var jit = new $jit.ForceDirected({
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
                        // toggle selected
                        node.data['$selected'] = !node.data['$selected']

                        // get selected
                        $jit.Graph.Util.eachNode(jit.graph, function (node) {
                            // TODO selected style
                            if (node.data['$selected']) {
                                node.data['$type'] = 'triangle'
                            } else {
                                node.data['$type'] = node.Config.type
                            }
                        })

                        jit.animate();
                        //jit.select(jit.root);

                        // fire change handle
                        that.conceptsSelected()
                    }
                },
                /*
                //Change cursor style when hovering a node
                onMouseEnter: function() {
                    jit.canvas.getElement().style.cursor = 'move';
                },
                onMouseLeave: function() {
                    jit.canvas.getElement().style.cursor = '';
                },
                //Update node positions when dragged
                onDragMove: function(node, eventInfo, e) {
                    var pos = eventInfo.getPos();
                    node.pos.setc(pos.x, pos.y);
                    jit.plot();
                },//*/
                onRightClick: function (node, eventInfo, e) {
                    if (node !== false) {
                        // this is semantically a Tip but Tips are attached to the cursorpointer
                        // and not permanent
                        $('#detailView').html('<pre>' + JSON.stringify(node.data, null, 4) + '</pre>')

                        // centering onclick
                        // ForceDirected has no centering
                        if ($.isFunction(jit.onClick)) {
                            jit.onClick(node.id)
                        }
                    }
                }
            },
            Navigation: {
                enable: true,
                type: 'Native', // check events type, got no d&d when type in navigation was not set
                panning: 'avoid nodes', // 'avoid nodes'
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
                $(domElement).text(node.label)
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

        var resolveForJit = function (graph) {

        }

        this.init = function () {
            $(window).resize(function () {
                jit.canvas.resize($graph.width(), $graph.height())
            })

            $('h2', $graphLegend).click(function () {
                $('dl', $graphLegend).toggle()
            })

            var median = list => list.length ? list.reduce((s, n) => s + n, 0) / list.length : 0

            $('#graphFocus').click(function () {
                var concepts = that.getSelectedConcepts()
                var positions = {
                    x: [],
                    y: []
                }

                // get center of concepts
                for (var concept of concepts) {
                    var node = $jit.Graph.Util.getNode(jit.graph, uriToDomId(concept.uri))
                    positions.x.push(node.pos.x)
                    positions.y.push(node.pos.y)
                }

                // TODO canvas pos
            })
        }

        this.init()


        // class functions
        this.showGraph = function (graph) {
            console.log('showGraph caught with', graph)
            var jit_graph = this.parseGraph(graph)
            console.log('parsed to', jit_graph)

            if (jit_graph.length) {
                jit.loadJSON(jit_graph)

                jit.refresh()
                jit.animate()
                jit.controller.onComplete()
            } else {
                console.log('empty graph')
            }

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
            northwind.byUris(domains.map(d => d.uri)).then(function (results) {
                that.showGraph(results)
            })
        }

        this.getSelectedConcepts = function () {
            var selected_concepts = []

            // get selected
            $jit.Graph.Util.eachNode(jit.graph, function (node) {
                if (node.data['$selected']) {
                    selected_concepts.push(node.data)
                }
            })

            return selected_concepts
        }

        /**
         * fires conceptsSelected signla
         */
        this.conceptsSelected = function () {
            // TODO OPTIMIZE only return uris
            var selected_concepts = this.getSelectedConcepts()

            console.log('conceptsSelected fired with', selected_concepts)

            for (var i = 0; i < concepts_selected_listeners.length; ++i) {
                concepts_selected_listeners[i].call(this, selected_concepts)
            }
        }

        /**
         *  if u want to be signaled on conceptsSelected hook here!
         * @param cb(concepts: []<Artefact>)
         */
        this.addConceptsSelectedListener = function (cb) {
            concepts_selected_listeners.push(cb)
        }

        /**
         * parses our schema graph into a strcture thats readable by our used api
         * @param graph our graph as defined in the schema
         * @returns {Graph}
         */
        this.parseGraph = function (graph) {
            console.log('parseGraph', JSON.parse(JSON.stringify(graph)))

            /**
             * the extended json for infovis
             * see https://philogb.github.io/jit/static/v20/Docs/files/Loader/Loader-js.html#Loader.js
             * @type {Array}
             */
            var json = []

            /**
             * nodes that need to be walked
             * queue type LIFO
             * @type {Array}
             */
            var unparsed = JSON.parse(JSON.stringify(graph)) // clone

            var visited = new Set()

            while (unparsed.length) {
                var artefact = unparsed.shift()

                //console.log('walk', artefact)

                if (!visited.has(artefact.uri)) {
                    visited.add(artefact.uri)

                    var adjacencies = artefact.relatedArtefacts

                    // duck typing
                    if (artefact.subclasses) { // Class
                        adjacencies.push(...artefact.subclasses)
                    } else if (artefact.concepts) { // ConceptCluster
                        adjacencies.push(...artefact.concepts)
                    }
                    // walk the adjacents
                    unparsed.push(...adjacencies)

                    if (!artefact.type) console.log(artefact.uri)

                    var json_node = {
                        id: uriToDomId(artefact.uri),
                        label: artefact.label,
                        data: Object.assign(artefact, {
                            // some number bases on the chars of type as hex
                            '$color': '#' + ([...(artefact.type || artefact.uri)].reduce((s, c) => s * c.charCodeAt() % (1<<24), 1)).toString(16),
                            '$colorBasedOn': 'type' // legend helper
                        }),
                        adjacencies: adjacencies.map(a => {
                            return {
                                nodeTo: uriToDomId(a.uri),
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

            // TODO infovis hypertree needs a connected graph, disconnected graphs cannot be drawn nicely
            // thats currently not guaranteed
            //console.log(json.map(n => n.id))

            return json
        }
    }
})(this)