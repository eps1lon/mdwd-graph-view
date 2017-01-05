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

        // d3
        var svg = d3.select('#domainGraph')
        var width = +$graph.width()
        var height = +$graph.height()
        var simulation
        var color = d3.scaleOrdinal(d3.schemeCategory20);

        console.log(width, height)

        var concepts_selected_listeners = []

        // the graphlayout TODO: different layouts as constants
        var layout = null

        var uriToDomId = function (uri) {
            return uri.replace(':', '_')
        }

        var that = this

        // create jit graph

        this.init = function () {
            simulation = d3.forceSimulation()
                .force("link", d3.forceLink().id(function(d) { return d.id; }))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(width / 2, height / 2));

            $(window).resize(function () {
                //jit.canvas.resize($graph.width(), $graph.height())
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

        this.refreshCanvas = function () {
            console.warn('refreshCanvas not implemented')
        }

        // class functions
        this.showGraph = function (schema) {
            var graph = this.parseGraphD3(schema)

            console.log(graph, graph.nodes, graph.links)

            svg.selectAll('*').remove()

            var link = svg.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(graph.links)
                .enter().append("line")
                .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

            var node = svg.append("g")
                .attr("class", "nodes")
                .selectAll("circle")
                .data(graph.nodes)
                .enter().append("circle")
                .attr("r", 5)
                .attr("fill", function(d) { return color(d.group); })


            node.append("title")
                .text(function(d) { return d.id; });

            simulation
                .nodes(graph.nodes)
                .on("tick", ticked);

            simulation.force("link")
                .links(graph.links);

            function ticked() {
                link
                    .attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

                node
                    .attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; });
            }
        }

        /**
         *
         * @param {Array<ConceptCluster>} domains
         */
        this.showDomain = function (domains) {
            console.log('showDomain caught with', domains)

            // remove conceptcluster from graph that are not included

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
         * parses our schema graph into a strcture thats readable by infovis
         * @param graph our graph as defined in the schema
         * @returns {Graph}
         */
        this.parseGraphJit = function (graph) {
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
                        adjacencies.push(...artefact.individuals)
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


        this.parseGraphD3 = function (results) {
            var createLink = (n1, n2) => {
                return {
                    source: uriToDomId(n1.uri),
                    target: uriToDomId(n2.uri),
                    value: 1 // TODO
                }
            }
            /**
             * nodes that need to be walked
             * queue type LIFO
             * @type {Array}
             */
            var unparsed = JSON.parse(JSON.stringify(results)) // clone
            var visited = new Set()

            var nodes = []
            var links = []

            console.log(unparsed)

            while (unparsed.length) {
                var node = unparsed.shift()

                if (!visited.has(node.uri) && node.uri !== undefined) {
                    visited.add(node.uri)

                    var node_d3 = {
                        id: uriToDomId(node.uri),
                        group: 1
                    }

                    nodes.push(node_d3)

                    if (node.subclasses !== undefined) {
                        unparsed.push(...node.subclasses, ...node.individuals)
                        links.push(
                            ...node.subclasses.map(n2 => createLink(node, n2)),
                            ...node.individuals.map(n2 => createLink(node, n2))
                        )
                    } else if (node.concepts !== undefined) {
                        unparsed.push(...node.concepts)
                        links.push(...node.concepts.map(n2 => createLink(node, n2)))
                    }
                }
            }

            return {
                links: links,
                nodes: nodes
            }
        }
    }
})(this)