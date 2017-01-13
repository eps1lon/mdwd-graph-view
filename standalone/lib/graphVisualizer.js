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
        }

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

        this.init = function (jquery_context) {
            $('h2', $graphLegend).click(function () {
                $('dl', $graphLegend).toggle();
            });

            this.$dom = jquery_context;

            $minimap = $('#graphMinimap', this.$dom);
            $graph = $('#domainGraph', this.$dom);
            $graphLegend = $('#graphLegend', this.$dom);

            width = +$graph.width();
            height = +$graph.height();

            svg = d3.select(`#${$graph.attr('id')}`);
            g = svg.append("g");

            // zooming
            svg.call(d3.zoom()
                .scaleExtent([1/4, 10])
                .on("zoom", function () {
                    //The zoom and panning is affecting my G element which is a child of SVG
                    g.attr("transform", d3.event.transform);
                }))
        };

        this.refreshCanvas = function () {
            console.warn('refreshCanvas not implemented')
        };

        // class functions
        this.showGraph = function (schema) {
            const graph = this.parseGraphD3(schema);

            console.log('showgraph',schema, graph);

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
                const nodes = graph.nodes;
                const links = graph.links;

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
                    .attr("id", "domainGraph-links")
                    .attr("class", "links")
                    .selectAll("line")
                    .data(links)
                    .enter().append("line")
                    .attr("stroke-width", function(d) {
                        return Math.sqrt(d.value/10);
                    });

                // nodes
                const node = g.append("g")
                    .attr("id", "domainGraph-nodes")
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


                    // update minimap
                    const $nodes = $(".nodes", $graph);
                    const bbox = $nodes.get(0).getBBox();

                    d3.select("#graphMinimap")
                        .attr("viewBox", [
                            bbox.x,
                            bbox.y,
                            bbox.width,
                            bbox.height
                        ].join(" "));
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
                const artefact = unparsed.shift();

                if (!visited.has(artefact.uri) && artefact.uri !== undefined) {
                    visited.add(artefact.uri);

                    const node_d3 = {
                        id: artefact.uri,
                        data: artefact
                    };

                    nodes.push(node_d3);

                    if (artefact.subclasses !== undefined) { // Class
                        unparsed.push(...artefact.subclasses, ...artefact.individuals);
                        links.push(...mapLink(artefact, artefact.subclasses), ...mapLink(artefact, artefact.individuals));
                    } else if (artefact.concepts !== undefined) { // concepts
                        unparsed.push(...artefact.concepts);
                        links.push(...mapLink(artefact, artefact.concepts));
                    }

                    unparsed.push(...artefact.relatedArtefacts)
                    links.push(...mapLink(artefact, artefact.relatedArtefacts));
                }
            }

            return {
                nodes: nodes,
                links: links
            };
        }
    }
})(this);