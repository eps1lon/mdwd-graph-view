(function (window) {
    const $ = window.jQuery;

    const aboxQuery = window.aboxQuery;

    /**
     * css className for a selected concept
     * @type {string}
     */
    const class_selected_concept = "selected-concept";

    window.GraphVisualizer = function () {
        const that = this;

        const concepts_selected_listeners = [];

        const statements = new Promise(function (fulfill) {
            aboxQuery({
                "@type": "rdf:Statement"
            }).then((statements) => {
                fulfill(statements.map(function (statement) {
                    return {
                        source: statement['rdf:subject']['@id'],
                        target: statement['rdf:object']['@id'],
                        value: statement['ia:hasWeight'] * 100 | 0
                    };
                }));
            });
        });

        /**
         * undirected
         * @param l1
         * @param l2
         */
        const linksEqual = function (l1, l2) {
            return (l1.source == l2.source && l1.target == l2.target)
                || (l1.source == l2.target && l1.target == l2.source)
        };

        /**
         * callback thats executed when the user clicks a node
         */
        const nodeClicked = function () {
            $(this).toggleClass(class_selected_concept);
            that.conceptsSelected();
        };

        /**
         * callback for d3 to determine radius
         * can be a number
         */
        const radius = function (d) {
            if (d.data['@type   '] == "ia:Document") {
                return 5;
            }
            return 10;
        };

        // some private const for d3
        let width
            , height
            , simulation
            , svg
            , g
            , $minimap
            , $graph
            , $graphLegend;
        let color = d3.scaleOrdinal(d3.schemeCategory20);

        /**
         *
         * @param jquery_context
         * @param {!SchemaFactory} schema_factory
         */
        this.init = function (jquery_context, schema_factory) {
            this.$dom = jquery_context;
            this.schema = schema_factory;
            this.graph = null;

            $('h2', $graphLegend).click(function () {
                $('dl', $graphLegend).toggle();
            });

            $("#memberberries", this.$dom).click(function () {
                console.warn("member not supported");
            });

            $("#graphLayout", this.$dom).change(function () {
                console.warn("layout not supported");
            });

            $minimap = $('#graphMinimap', this.$dom);
            $graph = $('#domainGraph', this.$dom);
            $graphLegend = $('#graphLegend', this.$dom);

            width = +$graph.width();
            height = +$graph.height();

            minimap = d3.select("#minimap-view");
            svg = d3.select(`#${$graph.attr('id')}`);
            g = svg.append("g").attr("id", "d3-tree-elements");

            const scale = [1/4, 10];

            const minimapZoom = d3.zoom()
                .scaleExtent(scale)
                .on("zoom", function () {
                    const transform = d3.event.transform;

                    g.attr("transform", transform);

                    minimap.attr("transform", invertTransform(transform));
                });

            $("#graphFocus", this.$dom).click(function () {
                const nodes = g.selectAll(`.${class_selected_concept}`);

                console.log(nodes);

                const x = 20;
                const y = 20;
                const scale = 1;
                const translate = [width / 2 - scale * x, height / 2 - scale * y];

                g.attr("transform", `translate(${x} ${y}) scale(${scale})`);
            });

            const invertTransform = function (d3_transform) {
                // invert every single operation
                // - for translation, 1 / for scale
                const inverted = {
                    k: 1 / d3_transform.k,
                    x: -d3_transform.x,
                    y: -d3_transform.y
                };

                // and reverse the operations!
                return `scale(${inverted.k}) translate(${inverted.x} ${inverted.y}) `;
            };

            // zooming
            svg.call(minimapZoom);

            // inverse to svg.zoom
            d3.select(`#${$minimap.attr("id")}`).call(d3.zoom()
                .scaleExtent(scale)
                .on("zoom", function () {
                    const transform = d3.event.transform;

                    minimap.attr("transform", transform);

                    g.attr("transform", invertTransform(transform));
                }))
        };

        /**
         * generates a graph from a schema
         *
         * @param {JsonldGraph} graph
         */
        this.showGraph = function (graph) {
            this.graph = graph;
            const d3_graph = this.parseGraphD3(graph.content);

            // relevance is used in forceLink.distance
            // and link svg elem creation as stroke witdh

            console.log('showgraph',graph, d3_graph);

            // start new sim
            simulation = d3.forceSimulation()
                .force("link", d3.forceLink()
                    .id(function(d) { return d.id; })
                    .distance(l => l.value))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(width / 2, height / 2));

            // clear
            g.selectAll('*').remove();

            statements.then(function (statements) {
                const nodes = d3_graph.nodes;
                const links = d3_graph.links;

                // map rdf statements on links
                // O(|statements|*|links|) :(((
                for (const statement of statements) {
                    for (const link of links) {
                        if (linksEqual(link, statement)) {
                            link.value = statement.value
                        }
                    }
                }

                const link = g.append("g")
                    .attr("id", "d3-links")
                    .selectAll("line")
                    .data(links)
                    .enter().append("line")
                    .attr("class", "d3-link")
                    .attr("stroke-width", function(d) {
                        return d.value/10;
                    });

                // nodes
                const node = g.append("g")
                    .attr("id", "d3-nodes")
                    .selectAll("circle")
                    .data(nodes)
                    .enter().append("circle")
                    .attr("class", "d3-node")
                    .attr("r", radius)
                    .attr("fill", function(node) {
                        return color(node.data['@type']);
                    })
                    .on("click", nodeClicked);

                const ticked = function () {
                    link
                        .attr("x1", function(d) { return d.source.x; })
                        .attr("y1", function(d) { return d.source.y; })
                        .attr("x2", function(d) { return d.target.x; })
                        .attr("y2", function(d) { return d.target.y; });

                    node
                        .attr("cx", function(d) { return d.x; })
                        .attr("cy", function(d) { return d.y; });


                    // update minimap
                    const $nodes = $(`#${g.attr("id")}`, $graph);
                    const bbox = $nodes.get(0).getBBox();

                    d3.select("#graphMinimap")
                        .attr("viewBox", [
                            bbox.x,
                            bbox.y,
                            bbox.width,
                            bbox.height
                        ].join(" "));

                    d3.select("#minimap-view")
                        .attr("width", width)
                        .attr("height", height)
                };

                simulation
                    .nodes(nodes)
                    .on("tick", ticked);

                simulation.force("link")
                    .links(links);
            })
        };

        /**
         *
         * @param {Array<ConceptCluster>} domains
         */
        this.showDomain = function (domains) {
            console.log('showDomain caught with', domains);

            // query Things contained in Conceptcluster
            northwind.byUris(domains.map(d => d.uri)).then(function (graph) {
                that.showGraph(graph);
            });
        };

        /**
         * returns the selected artefacts
         * @returns {Array|*|{Artefact}}
         */
        this.getSelectedConcepts = function () {
            return d3.selectAll(`.${class_selected_concept}`).data().map(function (d) {
                return Object.assign(that.schema.fromJsonld(d.data),{
                    sourceGraph: that.graph.id
                });
            })
        };

        /**
         * fires conceptsSelected signal
         */
        this.conceptsSelected = function () {
            const selected_concepts = this.getSelectedConcepts();

            console.log('conceptsSelected fired with', selected_concepts);

            for (const concepts_selected_listener of concepts_selected_listeners) {
                concepts_selected_listener.call(this, selected_concepts);
            }
        };

        /**
         *  if u want to be signaled on conceptsSelected hook here!
         * @param cb(concepts: []<Artefact>)
         */
        this.addConceptsSelectedListener = function (cb) {
            concepts_selected_listeners.push(cb);
        };

        /**
         * parses a jsonld graph into a d3 graph
         *
         * @param {!JsonLDGraph} graph_content
         * @returns {Array}
         */
        this.parseGraphD3 = function (graph_content) {
            /**
             * creates a d3 link between nodes
             * @param n1
             * @param n2
             * @returns {{source: (*|string|string), target: (*|string|string), value: number}}
             */
            const createLink = function (n1, n2) {
                return {
                    source: n1['@id'],
                    target: n2['@id'],
                    value: 100 // thats the relevance
                }
            };

            /**
             * creates an array of links between every member of targets to source
             *
             * @param source node
             * @param targets {Array}
             * @returns {Array}
             */
            const mapLink = function (source, targets) {
                return targets.map(target => createLink(source, target));
            };

            /**
             * nodes that need to be walked
             * queue type LIFO
             * @type {Array}
             */
            const unparsed = JSON.parse(JSON.stringify(graph_content)); // clone
            const visited = new Set();

            const nodes = [];
            const links = [];

            while (unparsed.length) {
                const jsonld = unparsed.shift();

                if (!visited.has(jsonld['@id']) && jsonld['@id'] !== undefined) {
                    visited.add(jsonld['@id']);

                    const node_d3 = {
                        id: jsonld['@id'],
                        data: jsonld
                    };

                    nodes.push(node_d3);

                    for (const value of Object.values(jsonld)) {
                        if ($.isArray(value)) {
                            unparsed.push(...value);
                            links.push(...mapLink(jsonld, value));
                        }
                    }
                }
            }

            return {
                nodes: nodes,
                links: links
            };
        }
    }
})(this);