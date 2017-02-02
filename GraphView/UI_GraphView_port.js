/* util */
/**
 * calculates the avg of a list
 *
 * @param {number} l list of types that can be added and divided
 *                 numbers make the most sense
 */
const avg = l => l.length ? l.reduce((s, n) => s + n, 0) / l.length : 0;

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

/**
 * css className for a selected concept
 * @type {string}
 */
const class_selected_concept = "selected-concept";

Ext.namespace("EDYRA.components");

EDYRA.components.GraphView= Ext.extend(Object, {
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
	$graphLegend: undefined, // ... of legend
	minimapZoom: undefined, // d3 zoom behavior
	simulation: undefined, // d3 sim
	svg: undefined, // svg of the graph
	g: undefined, // svg group
	graph: undefined, // jsonld graph
	schema: undefined, // a SchemaFactory
	hookEventListeners: function () {
		const that = this;
		
		$('h2', this.$graphLegend).click(function () {
            $('dl', that.$graphLegend).toggle();
        });
		
		$(`#${this.generateId('memberberries')}`).click(function () {
            console.warn("member not supported");
        });

        $(`#${this.generateId('graphLayout')}`).change(function () {
            console.warn("layout not supported");
        });
        
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
	    });
	},
	componentDidMount: function () {
		const that = this;
		
		this.$minimap = $(`#${this.generateId('graphMinimap')}`);
		this.$graph = $(`#${this.generateId('domainGraph')}`);
		this.$graphLegend = $(`#${this.generateId('graphLegend')}`);
		
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
        this.graph = graph;
        const d3_graph = this.parseGraphD3(graph.content);

        // relevance is used in forceLink.distance
        // and link svg elem creation as stroke witdh

        console.log('showgraph',graph, d3_graph);

        // start new sim
        this.simulation = d3.forceSimulation()
            .force("link", d3.forceLink()
                .id(function(d) { return d.id; })
                .distance(l => l.value))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

        // clear
        this.g.selectAll('*').remove();

        statements.then(statements => {
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
                .attr("id", this.generateId('d3-links'))
                .selectAll("line")
                .data(links)
                .enter().append("line")
                .attr("class", "d3-link")
                .attr("stroke-width", function(d) {
                    return d.value/10;
                });

            // nodes
            const node = g.append("g")
                .attr("id", this.generateId('d3-nodes'))
                .selectAll("circle")
                .data(nodes)
                .enter().append("circle")
                .attr("class", "d3-node")
                .attr("r", radius)
                .attr("fill", function(node) {
                    return color(node.data['@type']);
                });

            node.on("click", nodeClicked);
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
                const $nodes = $(`#${g.attr("id")}`, this.$graph);
                const bbox = $nodes.get(0).getBBox();

                d3.select(`#${this.generateId('graphMinimap')}`)
                    .attr("viewBox", [
                        bbox.x,
                        bbox.y,
                        bbox.width,
                        bbox.height
                    ].join(" "));

                d3.select(`#${this.generateId('minimapView')}`)
                    .attr("width", width)
                    .attr("height", height)
            };

            simulation
                .nodes(nodes)
                .on("tick", ticked);

            simulation.force("link")
                .links(links);
        })
    },
    // operation
    showDomain: function (domains) {
        console.warn('showDomain caught with', domains);

        // query Things contained in Conceptcluster
        this.schema.byUris(domains.map(d => d.uri)).then(graph => {
            this.showGraph(graph);
        });
    },
    getSelectedConcepts: function () {
        return d3.selectAll(`.${class_selected_concept}`).data().map(d => {
            return Object.assign(this.schema.fromJsonld(d.data), {
                sourceGraph: this.graph.id
            });
        })
    },
    // TODO use ctx to fire event
    conceptsSelected: function () {
        const selected_concepts = this.getSelectedConcepts();

        console.warn('conceptsSelected fired with', selected_concepts);
        
        /*
        for (const concepts_selected_listener of concepts_selected_listeners) {
            concepts_selected_listener.call(this, selected_concepts);
        }*/
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
	 * Create the grid panel
	 * @function
	 * @return void
	 */
	createPanel: function(){

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
				<select id="${this.generateId('graphLayout')}" class=""graphLayout>
					<option value="hyper_tree" selected="selected">Hyper Hyper Tree</option>
					<option value="tree_map">Tree Map</option>
				</select>
				<button id="${this.generateId('graphFocus')}" class="graphFocus">F</button>
				<button id="${this.generateId('memberberries')}" class="memberberries">M</button>
			</div>


			<svg id="${this.generateId('domainGraph')}" class="d3-wrapper domainGraph">

			</svg>

			<svg id="${this.generateId('graphMinimap')}" class="d3-wrapper graphMinimap">
				<use href="#graphVis-d3-nodes" />
				<use href="#graphVis-d3-links" />
				<rect id="${this.generateId('minimapView')}" class="minimapView"></rect>
			</svg>
			<div id="${this.generateId('graphLegend')}" class="graphLegend">
				<h2>Legend</h2>
				<dl>
					<dt class="color template"></dt>
					<dd class="colorLegend template"></dd>
				</dl>
			</div>
			<div class="tip"></div>
		</div>
		`;
		
		/* main compiling */
		var div = document.getElementById(this.renderID);
		div.innerHTML = html;
		
		this.componentDidMount();
	},
	/**
	* Obligatory method to hide the component
	* @public
	* @function
	*/
	hide: function() {
		
	},
	
	/**
	* Maps XML data to internal JavaScript objects
	*
	* @function
	* @private
	* @param {String} xsdType - datatype that is to be transformed
	* @param {DOMElement} instance - DOM object that is to be transformed
	* @return {Object} the transformed object
	*/
	map2Internal: function(xsdType, data) {
		
	},
	
	/**
	* Maps internal JavaScript structures to XML data
	* 
	* @function
	* @private
	* @param {String} xsdType - datatype that is to be transformed
	* @param {Object} instance - javascript object that is to be transformed
	* @return {String} - the transformed internal object represented as XML 
	*/
	map2XSD: function(xsdType, instance) {
		
  	},
  	setPersons: function(event){
  		console.log("Set persons received in DocumenView: ", event);
  	},
	/*
	 SETTERs for properties
	*/
	setWidth: function(value){
        this.width = parseInt(value);
	},
	
	setHeight: function(value){
        this.height = parseInt(value);
	},
	setTitle: function(value){
        this.title = "Detailcomponent";
	},
	//erm�glicht die Komponentendarstellung
	setProperty: function(propName, propValue) {
		console.log("Document prop: ", propName, propValue);
		if (propName == 'width') {
			this.width= parseInt(propValue);
		}
		if (propName == 'height') {
			this.height= parseInt(propValue);
		}
		if (propName == 'title') {
			this.title= propValue;
		}
	},
    //erm�glicht die Komponentendarstellung
	getProperty: function(propName) {
		if (propName == 'width') {
			return this.width;
		}
		if (propName == 'height') {
			return this.height;
		}
		if (propName == 'title') {
			return this.title;
		}
	},
	/*
	 SETTERs for properties
	*/
	isDirty: function(){
		//TODO
		return false;
	},
	
	invokeOperation: function(name, msg){
		
	},
	
	fireChangeEvent: function(){
		
	},
	
	getDragData: function(){
		
	},
	
	setEvent: function(incomingEvent){
		
	},
	needActualContactInformation: function(Record, Store){
		
	}
});