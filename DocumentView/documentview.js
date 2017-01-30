Ext.namespace("EDYRA.components");

EDYRA.components.DocumentView= Ext.extend(Object, {
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
		console.log("Init with id: ", this.renderID);
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
	* Obligatory method to render the component
	* @function
	* @public
	* @return void
	*/
	show: function() {
		var source = `
			<h2 class="cmp__heading">Dokumente & Kontakte</h2>
			<div class="fileCMP__wrapper">
			{{#each searchTerms as |list|}}
				<h4 class='fileCMP__listTitle'>
					{{list.name}}
					<i class="{{caretClass list.visible}}"></i>
				</h4>
				{{#if list.visible}}
				<ul class="fileCMP__list">
					{{#each list.items as |item|}}
						<li>
							<i class="{{iconClass item.type}}"></i>{{item.name}}
						</li>
					{{/each}}
				</ul>
				{{/if}}
			{{/each}}
			</div>
		`;
		/* example data*/
		var data = {
			searchTerms: [
				{
					name: 'Briefkastenfirma',
					visible: false,
					items: [
						{ name: 'E-Mail von Uwe Obst', type: 'mail' },
						{ name: 'Kontaktperson: Uwe Obst', type: 'contact' },
						{ name: 'DIY Briefkästen', type: 'document' },
						{ name: 'Briefkästendesign 2016.avi', type: 'file'},
						{ name: 'Kontaktperson: Hanns Gemüse', type: 'contact' },
					]
				},
				{
					name: 'Finanzamt',
					visible: true,
					items: [
						{ name: 'E-Mail von Uwe Obst', type: 'mail' },
						{ name: 'Briefkästendesign 2016.avi', type: 'file'},
						{ name: 'Kontaktperson: Hanns Gemüse', type: 'contact' },
						{ name: 'DIY Briefkästen', type: 'document' },
						{ name: 'DIY Briefkästen', type: 'document' },
						{ name: 'Kontaktperson: Hanns Gemüse', type: 'contact' },
					]
				}
			]
		};
		/* helper to map item type to FA class*/
		Handlebars.registerHelper('iconClass', function(iconType) {
			switch(iconType) {
			    case 'mail':
			        return 'fa fa-envelope';
			    case 'file':
			    	return 'fa fa-paperclip';
			    case 'contact':
			    	return 'fa fa-user';
			    default:
			        return 'fa fa-file';
			}
		});
		/* helper to map visible state to FA class*/
		Handlebars.registerHelper('caretClass', function(state) {
			if(state) return 'fa fa-caret-down';
			else return 'fa fa-caret-up';
		});
		/* main compiling */
		var div = document.getElementById(this.renderID);
		var template = Handlebars.compile(source);
		var html = template(data);
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
	//ermöglicht die Komponentendarstellung
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
    //ermöglicht die Komponentendarstellung
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