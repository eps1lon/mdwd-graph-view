(function (window) {
    const $ = window.jQuery;

    // this is basically our access to the abox pressed in our schema
    /**
     *
     * @type {SchemaFactory}
     */
    const schema = window.northwind || console.warn('no schema defined');

    const aboxQuery = window.aboxQuery;

    /**
     * css className for a selected concept
     * @type {string}
     */
    const class_selected_concept = "selected-concept";

    window.GraphVisualizer = function (jqueryContext) {
        const that = this;
        const $dom = jqueryContext;

        const $minimap = $('#graphMinimap', $dom);
        const $graph = $('#domainGraph', $dom);
        const $graphLegend = $('#graphLegend', $dom);

        const concepts_selected_listeners = [];

        const links = new Promise(function (fulfill) {
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
            if (d.data.type == "ia:Document") {
                return 5;
            }
            return 10;
        };

        // the graphlayout TODO: different layouts as constants
        const layout = null;

        // d3
        let width = +$graph.width();
        let height = +$graph.height();
        let simulation;
        let color = d3.scaleOrdinal(d3.schemeCategory20);
        let zoomed = function () {
            svg.attr("transform", d3.event.transform);//The zoom and panning is affecting my G element which is a child of SVG
        };
        let zoom = d3.zoom()
            .scaleExtent([1, 10])
            .on("zoom", zoomed);

        const svg = d3.select(`#${$graph.attr('id')}`).append("svg:svg");

        this.init = function () {
            $(window).resize(function () {
                //jit.canvas.resize($graph.width(), $graph.height())
            });

            $('h2', $graphLegend).click(function () {
                $('dl', $graphLegend).toggle()
            });

            svg.call(zoom)
        };

        this.init();

        this.refreshCanvas = function () {
            console.warn('refreshCanvas not implemented')
        };

        // class functions
        this.showGraph = function (schema) {
            const graph = this.parseGraphD3(schema);

            //console.log(nodes)

            // start new sim
            simulation = d3.forceSimulation()
                .force("link", d3.forceLink()
                    .id(function(d) { return d.id; })
                    .distance(l => l.value))
                .force("charge", d3.forceManyBody())
                .force("center", d3.forceCenter(width / 2, height / 2));

            // clear
            svg.selectAll('*').remove();

            links.then(function (all_links) {
                const nodes = graph.nodes;

                // filter only relevant links
                // because we dont know how the query the box with a filter
                const links = all_links.filter(link => {
                    return nodes.find(n => n.id == link.source || n.id == link.target)
                }).concat(graph.links);

                console.log(nodes, links);

                const link = svg.append("g")
                    .attr("class", "links")
                    .selectAll("line")
                    .data(links)
                    .enter().append("line")
                    .attr("stroke-width", function(d) {
                        return Math.sqrt(d.value/10);
                    });

                // nodes
                const node = svg.append("g")
                    .attr("class", "nodes")
                    .selectAll("circle")
                    .data(nodes)
                    .enter().append("circle")
                    .attr("r", radius)
                    .attr("fill", function(node) {
                        return color(node.data.type);
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
            northwind.byUris(domains.map(d => d.uri)).then(function (results) {
                that.showGraph(results);
            });
        };

        /**
         * returns the selected artefacts
         * @returns {Array|*|{Artefact}}
         */
        this.getSelectedConcepts = function () {
            return d3.selectAll(`.${class_selected_concept}`).data().map(function (d) {
                return d.data;
            })
        };

        /**
         * fires conceptsSelected signal
         */
        this.conceptsSelected = function () {
            // TODO OPTIMIZE only return uris
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
            const createLink = function (n1, n2) {
                return {
                    source: n1.uri,
                    target: n2.uri,
                    value: 100
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
            const unparsed = JSON.parse(JSON.stringify(results)); // clone
            const visited = new Set();

            const nodes = [];
            const links = [];

            //console.log(unparsed)

            while (unparsed.length) {
                const node = unparsed.shift();

                if (!visited.has(node.uri) && node.uri !== undefined) {
                    visited.add(node.uri);

                    const node_d3 = {
                        id: node.uri,
                        data: node
                    };

                    nodes.push(node_d3);

                    if (node.subclasses !== undefined) {
                        unparsed.push(...node.subclasses, ...node.individuals);
                        links.push(...mapLink(node, node.subclasses), ...mapLink(node, node.individuals));
                    } else if (node.concepts !== undefined) {
                        unparsed.push(...node.concepts);
                        links.push(...mapLink(node, node.concepts));
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