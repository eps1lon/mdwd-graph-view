/**
 * UI_InfoappDomainViewer
 * 
 * abox_query > SchemaFactory > > northwind war unsere Hilfspipeline zum generieren der Daten
 * während des Praktikums wurde nie die anfangs definierte Datenschnittstelle zur Verfügung gestellt
 * die komponente ist so daher statisch aktuell. unter standalone befindet sich ein 
 * funktionierendes, dynamisches Beispiel was auch die Kommunikation zwischen DomainSelector
 * und Viewer exemplarisch emuliert
 * 
 * die schemafactory wird noch immer vom code verwendet bei bestimmten operation
 * dies ist nur für beispiele noch existent. ausführen führt zu fehlern
 */
/**
 * calculates the avg of a list
 *
 * @param {number} l list of types that can be added and divided
 *                 numbers make the most sense
 */
const avg = l => l.length ? l.reduce((s, n) => s + n, 0) / l.length : 0;

const ucfirst = s => s.length ? s[0].toUpperCase() + s.slice(1) : '';

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
 * callback for d3 to determine radius
 * can be a number
 */
const radius = function (d) {
    if (d.data['@type   '] == "ia:Document") {
        return 5;
    }
    return 10;
};

const example_graph = $.getJSON("http://localhost:8080/csr-client/components/mdwd/UI_InfoappDomainViewer/data/example_graph.json");
const example_statements = $.getJSON("http://localhost:8080/csr-client/components/mdwd/UI_InfoappDomainViewer/data/example_statements.json");

/**
 * css className for a selected concept
 * @type {string}
 */
const class_selected_concept = "selected-concept";

Ext.namespace("EDYRA.components");

const naive_props = ['width', 'height', 'title'];

EDYRA.components.DomainViewer = Ext.extend(Object, {
	// 
	title: null,
	panel: null,
	dateSelect: null,
	height: null,
	width: null,
	window: null,
	locale: null,
	xmlUtils: null,	
	event: null,
	updateNecessary: false,
	renderID: null,
	// class
	log: undefined,
	proxy: undefined,
	statements: undefined, // relevance statements as promise
	$minimap: undefined, // jquery obj of minimap
	$graph: undefined, // ... of graph
	minimapZoom: undefined, // d3 zoom behavior
	simulation: undefined, // d3 sim
	svg: undefined, // svg of the graph
	g: undefined, // svg group
	graph: undefined, // jsonld graph
	schema: undefined, // a SchemaFactory
    color: undefined, // d3 colorization
	hookEventListeners: function () {
		const that = this;
        /*
		 * zoom the graph to view all selected concepts
		 *
		 * if no nodes are selected the center of the svg (not graph)
		 * is chosen
		 *
		 * if only one node is selected the hole graph will be visible
		 *
		 * zoom is called in a transition over 1s
		 */
        $(`#${this.generateId('graphFocus')}`).click(function () {
        	console.warn('graphFocus');
            const [X, Y] = [[], []];

            d3.selectAll(`.${class_selected_concept}`).each(d => {
                X.push(d.x);
                Y.push(d.y);
            });

            if (X.length == 0) {
                // default to center
                X.push(that.width / 2);
                Y.push(that.height / 2);
            }

            const focus = {
                x: -avg(X),
                y: -avg(Y),
                width: Math.max(...X) - Math.min(...X),
                height: Math.max(...Y) - Math.min(...Y),
                k: 1
            };

            if (X.length > 1) {
                focus.k = Math.min(that.width / focus.width,
                    that.height / focus.height);
            }
            
            // this can be simplified by matrix multiplication
            let focus_transform
                = d3.zoomIdentity
                .translate(that.width / 2, that.height / 2)
                // add a little margin by zooming out a bit
                .scale(focus.k / 2)
                .translate(focus.x, focus.y);

            that.svg.transition()
                .duration(1000)
                .call(that.minimapZoom.transform, focus_transform);
        });
	},
	/**
	* Initiate the component
	* Store the necessary context parameters as component properties
	* 
	* @public
	* @function
	* @param {IContext} ctx Context object 
	* @see https://trac.mmt.inf.tu-dresden.de/CRUISe/wiki/runtimes/api#IContext
	* @return void
	*/
	init: function(ctx) {
		this.renderID = ctx.renderTargetId;

        this.log = ctx.getAttribute('Logger');
        this.proxy=ctx.getAttribute('EventHandler');
        
        this.schema = northwind; // dev helper, should come from the ctx
		
        this.color = d3.scaleOrdinal(d3.schemeCategory20);

        this.statements = example_statements;
        /* TODO broken jsonld api
		this.statements = new Promise(function (fulfill) {
			const domains = window.northwind.byType('ia:ConceptCluster');
			
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
	    });*/
	},
	componentDidMount: function () {
		const that = this;
		
		this.$minimap = $(`#${this.generateId('graphMinimap')}`);
		this.$graph = $(`#${this.generateId('domainGraph')}`);
		
		this.width = +this.$graph.width();
        this.height = +this.$graph.height();
		
		this.hookEventListeners();
		
		this.minimap = d3.select(`#${this.generateId('minimapView')}`);
        this.svg = d3.select(`#${this.$graph.attr('id')}`);
        this.g = this.svg.append("g").attr("id", this.generateId('d3-tree-elements'));
        
        const scale = [1/4, 10];

        this.minimapZoom = d3.zoom()
            .scaleExtent(scale)
            .on("zoom", function () {
                const transform = d3.event.transform;

                that.g.attr("transform", transform);

                that.minimap.attr("transform", invertTransform(transform));
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

        // zooming ignore dbclick zoom
        this.svg.call(this.minimapZoom).on("dblclick.zoom", null);

        // inverse to svg.zoom
        d3.select(`#${this.$minimap.attr("id")}`).call(d3.zoom()
            .scaleExtent(scale)
            .on("zoom", function () {
                const transform = d3.event.transform;

                that.minimap.attr("transform", transform);

                that.g.attr("transform", invertTransform(transform));
            }));
	},
	generateId: function (id) {
        return [this.renderID, id].join('-')
    },
    // operation
    showGraph: function (graph) {
        const that = this;
        
        this.graph = graph;
        this.publishGraphChanged(graph);

        const d3_graph = this.parseGraphD3(graph.content);

        // relevance is used in forceLink.distance
        // and link svg elem creation as stroke witdh

        console.warn('showgraph',graph, d3_graph);

        // start new sim
        this.simulation = d3.forceSimulation()
            .force("link", d3.forceLink()
                .id(function(d) { return d.id; })
                .distance(l => l.value))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(this.width / 2, this.height / 2));

        // clear
        this.g.selectAll('*').remove();

        this.statements.then(statements => {
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

            const link =this.g.append("g")
                .attr("id", this.generateId('d3-links'))
                .selectAll("line")
                .data(links)
                .enter().append("line")
                .attr("class", "d3-link")
                .attr("stroke-width", function(d) {
                    return d.value/10;
                });

            // nodes
            const node = this.g.append("g")
                .attr("id", this.generateId('d3-nodes'))
                .selectAll("circle")
                .data(nodes)
                .enter().append("circle")
                .attr("class", "d3-node")
                .attr("r", radius)
                .attr("fill", (node) => {
                    return this.color(node.data['@type']);
                });

            node.on("click", function () {
                $(this).toggleClass(class_selected_concept);
                that.publishConceptsChange();
            });
            node.append("title").text(d => this.schema.fromJsonld(d.data).label)

            const ticked = () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);


                // update minimap
                const $nodes = $(`#${this.g.attr("id")}`, this.$graph);
                const bbox = $nodes.get(0).getBBox();

                //console.log(d3.select(`#${this.generateId('graphMinimap')}`))
                d3.select(`#${this.generateId('graphMinimap')}`)
                    .attr("viewBox", [
                        bbox.x,
                        bbox.y,
                        bbox.width,
                        bbox.height
                    ].join(" "));

                d3.select(`#${this.generateId('minimapView')}`)
                    .attr("width", this.width)
                    .attr("height", this.height)
            };

            this.simulation
                .nodes(nodes)
                .on("tick", ticked);

            this.simulation.force("link")
                .links(links);
        })
    },
    // operation
    showDomain: function (domains) {
        // query Things contained in Conceptcluster
        this.schema.byUris(domains.map(d => d.uri)).then(graph => {
            this.showGraph(graph);
        });
    },
    getSelectedConcepts: function () {
        return d3.selectAll(`${this.renderID} .${class_selected_concept}`).data().map(d => {
            return Object.assign(this.schema.fromJsonld(d.data), {
                sourceGraph: this.graph.id
            });
        })
    },
    parseGraphD3: function (graph_content) {
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
    },
	
	/**
	 * Obligatory method to dispose this UI-Component
	 * @function
	 * @public
	 * @return void
	 */
	dispose: function(){
	
	},
	/**
	* Obligatory method to render the component, 
	*	the multiline [es6 feature] seems to work in chrome, maybe add Babel?
	* @function
	* @public
	* @return void
	*/
	show: function() {
		const id = this.renderID;
		var html = `
					<div class="component">
			<div id="${this.generateId('graphTools')}" class="graphTools">
				<button id="${this.generateId('graphFocus')}" class="graphFocus">focus</button>
			</div>


			<svg id="${this.generateId('domainGraph')}" class="d3-wrapper domainGraph">

			</svg>

			<svg id="${this.generateId('graphMinimap')}" class="d3-wrapper graphMinimap">
				<use href="#${this.generateId('d3-nodes')}" />
				<use href="#${this.generateId('d3-links')}" />
				<rect id="${this.generateId('minimapView')}" class="minimapView"></rect>
			</svg>
			<div class="tip"></div>
		</div>
		`;
		
		/* main compiling */
		var div = document.getElementById(this.renderID);
		div.innerHTML = html;
		
		this.componentDidMount();
		
        // TODO remove example
		example_graph.then((jsonld) => {
            this.showGraph(jsonld);
		});
	},
	/**
	* Obligatory method to hide the component
	* @public
	* @function
	*/
	hide: function() {
		
	},
	/*
	 SETTERs for properties
	*/
	//ermöglicht die Komponentendarstellung
	setProperty: function(propName, propValue) {
		if (naive_props.includes(propName)) {
            const setter = `set${ucfirst(propName)}`;
            return this[setter].call(this, propValue);
        }
        this.log.warn(`no setter defined for ${propName}`);
	},
    //ermöglicht die Komponentendarstellung
	getProperty: function(propName) {
		if (naive_props.includes(propName)) {
            const getter = `get${ucfirst(propName)}`;
            return this[getter].call(this);
        }

        this.log.warn(`no setter defined for ${propName}`);
	},
    getWidth: function() {
        return this.width;
    },
    setWidth: function(width) {
        if (isNaN(+width)) {
            this.warn(`${width} not parseable`);
            return;
        }
        this.width = +width;
    },
    getHeight: function() {
        return this.height;
    },
    setHeight: function(height) {
        if (isNaN(+height)) {
            this.warn(`${height} not parseable`);
            return;
        }
        this.height = +height;
    },
    getTitle: function() {
        return this.title;
    },
    setTitle: function(title) {
        this.title = title.toString();
    },
	invokeOperation: function(name, msg) {
        const body = msg.getBody();

		switch (name) {
        case 'showDomain':
            this.showDomain(body.domains);
            break;
        case 'showGraph':
            this.showGraph(body.graph);
            break;
        default:
            this.log.warn(`${name} operation not defined`);
            break;
        }
	},
	publishConceptsChange: function() {
        var message = new Ext.cruise.client.Message();

        message.setName('conceptsChanged');
        message.appendToBody('concepts', this.getSelectedConcepts());

        this.proxy.publish(message);
    },
    publishGraphChanged: function() {
        var message = new Ext.cruise.client.Message();

        message.setName('graphChanged');
        message.appendToBody('graph', this.graph);

        this.proxy.publish(message);
    }
});