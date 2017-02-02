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
	statements: undefined,
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
		console.warn("Init with id: ", this.renderID);
		
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
		var html = `
					<div class="component" id="graphVis">
			<div id="graphVis-graphTools" class="graphTools">
				<select id="graphVis-graphLayout" class=""graphLayout>
					<option value="hyper_tree" selected="selected">Hyper Hyper Tree</option>
					<option value="tree_map">Tree Map</option>
				</select>
				<button id="graphVis-graphFocus" class="graphFocus">F</button>
				<button id="graphVis-memberberries" class="memberberries">M</button>
			</div>


			<svg id="graphVis-domainGraph" class="d3-wrapper domainGraph">

			</svg>

			<svg id="graphVis-graphMinimap" class="d3-wrapper graphMinimap">
				<use href="#graphVis-d3-nodes" />
				<use href="#graphVis-d3-links" />
				<rect id="graphVis-minimapView" class="minimapView"></rect>
			</svg>
			<div id="graphVis-graphLegend" class="graphLegend">
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