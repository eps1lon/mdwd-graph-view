/**
 * @class GraphView
 *
 */
// TODO auto-generated stub for component "GraphView" with ID "https://svn.mmt.inf.tu-dresden.de/repositories/CRUISe/components/trunk/UI_GraphViewTODO/"
// further implementation required
GraphView = function() { 
	var context = null;
	var log= null;
	var renderTargetId= null;
	var proxy= null;
	var serviceAccess= null;
	var xmlUtils= null;
	var appControl= null;

	/**
	 * The initialization method of the component.
	 *
	 * @function
	 * @param {Ext.cruise.client.BaseContext} contextObj the component context for access to the runtime's functionality
	 */
	this.init = function(contextObj) {
		context = contextObj;
		log= context.getAttribute("Logger");
		renderTargetId= context.getAttribute("renderTargetId");
		// provides an interface to publish application level events. only events defined in the component's SMCD are permitted.
		proxy= context.getAttribute("EventHandler");
		serviceAccess= context.getAttribute("ServiceAccess");
		// provides restricted means to manipulate the current composition and load completely new compositions  
		appControl= contextObj.getAttribute("AppControl");
		// provides common functionality for working with XML documents and hides browser specific solutions
		// see http://cruisedemos.dyndns.org/tsr-api class Ext.cruise.client.Utility for the API
		xmlUtils= contextObj.getAttribute("XMLUtilities");
		
		/*
		 ***********************************************************************************************
		 * IMPORTANT NOTE: Read the guidelines and conventions for component developers [1,2] carefully!
		 ***********************************************************************************************
		 *
		 * [1] - https://trac.mmt.inf.tu-dresden.de/CRUISe/wiki/components/devtutorial#IGrunds%C3%A4tzliches
		 * [2] - https://trac.mmt.inf.tu-dresden.de/CRUISe/wiki/components/impl
		 */
		
		//TODO: auto-generated method stub
		
		/* To fire an event use the following scheme.
			var msg = new Ext.cruise.client.Message();
			msg.setName('eventNameAsDeclaredInMCDL');
			msg.appendToBody('parameter1AsDeclaredInMCDL', '<test/>');
			msg.appendToBody('parameter2AsDeclaredInMCDL', '<test2>Hello World!</test2>');
	        proxy.publish(msg);
		*/
	};
	
	/**
	 * Called by the runtime environment to show the UI component.
	 * @function
	 */
	this.show = function() {
		//TODO: auto-generated method stub
	};
	
	/**
	 * Called by the runtime environment to hide the UI component.
	 * @function
	 */
	this.hide = function() {
		//TODO: auto-generated method stub
	};

	
	/**
	 * Called by the runtime environment to enable the UI component (indicating that the component should react on interactions).
	 * @function
	 */
	this.enable= function(){
		//TODO: auto-generated method stub
	};

	/**
	 * Called by the runtime environment to disable the UI component (indicating that the component should not react on interactions).
	 * @function
	 */
	this.disable= function(){
		//TODO: auto-generated method stub
	};
	
	/**
	 * Method called when the component is removed from the application. 
	 * All internally allocated resources have to be disposed.   
	 * 
	 * @function
	 */
	this.dispose = function() {
		context = null;
		log= null;
		renderTargetId= null;
		proxy= null;
		xmlUtils= null;
		serviceAccess= null;
		
		//TODO: auto-generated method stub
	};
	
	/**
	 * The method for setting any property of this component.
	 *
	 * @param {String} propName the name of the property to be set
	 * @param {String} propValue the value to be set
	 */
	this.setProperty = function(propName, propValue) {
		if (propName == 'height') {
			//TODO: set the property height of type '{http://mmt.inf.tu-dresden.de/models/mcdl.owl#}hasHeight'
		}
		if (propName == 'width') {
			//TODO: set the property width of type '{http://mmt.inf.tu-dresden.de/models/mcdl.owl#}hasWidth'
		}
		if (propName == 'title') {
			//TODO: set the property title of type '{http://mmt.inf.tu-dresden.de/models/mcdl.owl#}hasTitle'
		}
	};
	
	/**
	 * The getter method for reading any property of this component.
	 *
	 * @param {String} propName the name of the property to be returned
	 * @return {String} the property value
	 */
	this.getProperty = function(propName) {
		if (propName == 'height') {
			//TODO: return the property 'height' of type '{http://mmt.inf.tu-dresden.de/models/mcdl.owl#}hasHeight'
			return null;
		}
		if (propName == 'width') {
			//TODO: return the property 'width' of type '{http://mmt.inf.tu-dresden.de/models/mcdl.owl#}hasWidth'
			return null;
		}
		if (propName == 'title') {
			//TODO: return the property 'title' of type '{http://mmt.inf.tu-dresden.de/models/mcdl.owl#}hasTitle'
			return null;
		}
	};

	/**
	 * The method to invoke any operation of this component.
	 *
	 * @param {String} operationName the name of the operation to be invoked
	 * @param {Ext.cruise.client.Message} msg the message object as delivered by the event. the message's body is an associative array of parameters (names as defined in MCDL).
	 */
	this.invokeOperation = function(operationName, msg){
		var params= msg.getBody();
	};
};