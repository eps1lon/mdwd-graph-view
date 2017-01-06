(function ($window) {
    var $ = $window.jQuery

    // this is basically our access to the abox pressed in our schema
    /**
     *
     * @type {SchemaFactory}
     */
    var schema = $window.northwind || console.warn('no schema defined')

    var aboxQuery = $window.abox_query

    $window.GraphVisualizer = function (jqueryContext) {
        var that = this
        var $dom = jqueryContext

        var $minimap = $('#graphMinimap', $dom)
        var $graph = $('#domainGraph', $dom)
        var $graphLegend = $('#graphLegend', $dom)

        var concepts_selected_listeners = []

        var links = new Promise((fulfill, reject) => {
            aboxQuery({
                "@type": "rdf:Statement"
            }).then((statements) => {
                fulfill(statements.map(statement => {
                    return {
                        source: statement['rdf:subject']['@id'],
                        target: statement['rdf:object']['@id'],
                        value: statement['ia:hasWeight'] * 100 | 0
                    }
                }))
            })
        })

        // the graphlayout TODO: different layouts as constants
        var layout = null

        var uriToDomId = function (uri) {
            return uri.replace(':', '_')
        }

        var that = this

        // d3
        var width = +$graph.width()
        var height = +$graph.height()
        var simulation
        var color = d3.scaleOrdinal(d3.schemeCategory20);
        var zoomed = function () {
            svg.attr("transform", d3.event.transform);//The zoom and panning is affecting my G element which is a child of SVG
        }
        var zoom = d3.zoom()
            .scaleExtent([1, 10])
            .on("zoom", zoomed);

        var svg = d3.select('#domainGraph')

        this.init = function () {
            $(window).resize(function () {
                //jit.canvas.resize($graph.width(), $graph.height())
            })

            $('h2', $graphLegend).click(function () {
                $('dl', $graphLegend).toggle()
            })

            var median = list => list.length ? list.reduce((s, n) => s + n, 0) / list.length : 0

            svg.call(zoom)
        }

        this.init()

        this.refreshCanvas = function () {
            console.warn('refreshCanvas not implemented')
        }

        // class functions
        this.showGraph = function (schema) {
            var graph = this.parseGraphD3(schema)

            //console.log(nodes)

            // start new sim
            simulation = d3.forceSimulation()
                .force("link", d3.forceLink()
                    .id(function(d) { return d.id; })
                    .distance(l => l.value))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(width / 2, height / 2));

            // clear
            svg.selectAll('*').remove()

            links.then(function (all_links) {
                var nodes = graph.nodes

                // filter only relevant links
                var links = all_links.filter(link => {
                    return nodes.find(n => n.id == link.source || n.id == link.target)
                }).concat(graph.links)

                console.log(nodes, links)

                // nodes
                var node = svg.append("g")
                    .attr("class", "nodes")
                    .selectAll("circle")
                    .data(nodes)
                    .enter().append("circle")
                    .attr("r", 5)
                    .attr("fill", function(d) { return color(d.group); })

                var link = svg.append("g")
                    .attr("class", "links")
                    .selectAll("line")
                    .data(links)
                    .enter().append("line")
                    .attr("stroke-width", function(d) { return Math.sqrt(d.value/10); });

                node.append("title")
                    .text(function(d) { return d.id; });

                simulation
                    .nodes(nodes)
                    .on("tick", ticked);

                simulation.force("link")
                    .links(links);

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
            })
        }

        /**
         *
         * @param {Array<ConceptCluster>} domains
         */
        this.showDomain = function (domains) {
            console.log('showDomain caught with', domains)

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
         * flattens the hierarchy, u still need the links
         *
         * @param results
         * @returns {Array}
         */
        this.parseGraphD3 = function (results) {
            /**
             * creates a d3 link between nodes
             * @param n1
             * @param n2
             * @returns {{source: (*|string|string), target: (*|string|string), value: number}}
             */
            var createLink = (n1, n2) => {
                return {
                    source: n1.uri,
                    target: n2.uri,
                    value: 100
                }
            }

            var mapLink = (source, targets) => targets.map(target => createLink(source, target))
            /**
             * nodes that need to be walked
             * queue type LIFO
             * @type {Array}
             */
            var unparsed = JSON.parse(JSON.stringify(results)) // clone
            var visited = new Set()

            var nodes = []
            var links = []

            //console.log(unparsed)

            while (unparsed.length) {
                var node = unparsed.shift()

                if (!visited.has(node.uri) && node.uri !== undefined) {
                    visited.add(node.uri)

                    var node_d3 = {
                        id: node.uri,
                        group: 1
                    }

                    nodes.push(node_d3)

                    if (node.subclasses !== undefined) {
                        unparsed.push(...node.subclasses, ...node.individuals)
                        links.push(...mapLink(node, node.subclasses), ...mapLink(node, node.individuals))
                    } else if (node.concepts !== undefined) {
                        unparsed.push(...node.concepts)
                        links.push(...mapLink(node, node.concepts))
                    }
                }
            }

            return {
                nodes: nodes,
                links: links
            }
        }
    }
})(this)