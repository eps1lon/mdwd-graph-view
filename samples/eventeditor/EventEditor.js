Ext.namespace("EDYRA.components");

EDYRA.ECRouteRecord = Ext.data.Record.create([
				{name: 'startName', type: 'string'},
				{name: 'startTime', type: 'string'},
				{name: 'destTime', type: 'string'},
				{name: 'xml', type: 'object'}
			]);
EDYRA.ECPersonRecord = Ext.data.Record.create([
				{name: 'surname', type: 'string'},
				{name: 'forename', type: 'string'},
				{name: 'email', type: 'string'},
				{name: 'xml', type: 'object'}
			]);

EDYRA.components.EventComponent= Ext.extend(Object, {
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
		this.log = ctx.getAttribute('Logger');
		this.proxy = ctx.getAttribute('EventHandler');
		this.renderTargetId = ctx.getAttribute('renderTargetId');
		this.title = 'Event Editor';
		this.height = 425;
		this.width = 500;
		this.locale = 'en';
		
		this.log.debug('[EventEditor] Initializing...');
		this.xmlUtils= ctx.getAttribute("XMLUtilities");
		
		this.event= {
			name: null,
			begin: null,
			end: null,
			description: null,
			location: null,
			address: null,
			primaryRoute: null,
			alternativeRoues: null
		};
	},
	
	/**
	 * Obligatory method to dispose this UI-Component
	 * @function
	 * @public
	 * @return void
	 */
	dispose: function(){
		if (this.panel) {
			this.panel.destroy();
			delete this.panel;
		}
		if (this.dateSelect){
			this.dateSelect.destroy();
			delete this.dateSelect;
		}
		delete this.event;
	},
	/**
	 * Create the grid panel
	 * @function
	 * @return void
	 */
	createPanel: function(){
		if (null === this.panel) {
			this.log.debug('[EventComponent] creating the panel with title "' + this.title + '" width "' + this.width + '" and height "' + this.height + '"');
			
			var isDe= this.locale=="de";
			this.dateSelect= new Ext.ensible.cal.DateRangeField({
	            width: this.width-200,
				toText: isDe? "bis":"to",
				singleLine: false,
				allDayText: isDe ? "Ganztägig" : "All day",
				fieldLabel: isDe ? "Wann" : 'When',
	        });

			function isNonEmpty(value){
				if (value==undefined||value==null||value.length==0){
					return "This field is obligatory.";
				}else
					return true;
			};

			var _w= this.width - 130;
			var bs= 'padding-right:5px;padding-left:5px;';
			
			
			this.panel = new Ext.Panel({
					width: this.width,
					border: true,
					layout: 'form',
					height: this.height,
					autoScroll: true,
					bubbleEvents: ['mousedown','mouseup'],// required for DnD
					items: [{
		                    xtype: 'textfield',
		                    fieldLabel: isDe ? "Bezeichnung" : 'Name',
		                    bodyStyle: bs,
							width: _w,
							validator: isNonEmpty,
							validateOnBlur: true,
		                    id: this.renderTargetId+'ec_name'
		                },
						this.dateSelect,
						{
		                    xtype: 'textarea',
							height: 50,
							width: _w,
		                    id: this.renderTargetId+'ec_description',
							bodyStyle: bs,
		                    fieldLabel: isDe ? "Beschreibung" : 'Description'
		                }, new EDYRA.components.LocationField({
		                	hidden: true,
							width: _w,
							bodyStyle: bs,
							height: 40,
							id: this.renderTargetId+"ec_location",
							fieldLabel: isDe ? "Ort" : 'Location'
						}),new Ext.Panel({
							id: this.renderTargetId+"ec_location_info",
							autoHeigth: true,
							autoWidth: true,
							border: false,
							listeners: {
					        	'afterrender': {
					        		fn: function(v){
					        			var that= this;
					    		        v.dragZone = new Ext.dd.DragZone(v.body, {
					    		                getDragData: function(e) {
					    		                    var sourceEl = e.getTarget(v.itemSelector, 10);

					    							this.proxy.dropAllowed = '';
					    							this.proxy.dropNotAllowed = '';
					    							
					    		                    if (sourceEl) {
					    		                        d = sourceEl.cloneNode(true);
					    		                        d.id = Ext.id();
					    		                        
					    		                        return {
					    		                            ddel: d,
					    		                            sourceEl: sourceEl,
					    		                            repairXY: Ext.fly(sourceEl).getXY()
					    		                        };
					    		                    }
					    		                },
					    		                endDrag: function(e){
					    		            	},
					    		                getRepairXY: function() {
					    		                    return this.dragData.repairXY;
					    		                }
					    		            });
					    			},
					        		scope: this
					        	}
					        },
//							bodyStyle: bs,
							layout : {
								type : 'hbox',
								defaultMargins : {
									top : 5,
									right : 5,
									bottom : 5,
									left : 0
								}
							},
							items:[{
									border: false,
									width: 100,
									html: '<div><font size="2" face="tahoma,arial,helvetica,sans-serif">'+(isDe ? "Ort" : 'Location')+': </font></div>'
								},
								new Ext.form.Label({
									id: this.renderTargetId+"ec_location_info_text",
									width: _w,
									html: '<div id="'+this.renderTargetId+"ec_location_info_textFoo"+'"><font size="1" face="tahoma,arial,helvetica,sans-serif">This option needs a geographic position from a other component (for example the map).</font></div>',
									listeners: {
										"afterrender": {
											scope: this,
											fn: function(v){
												// we have to manually listen on and relay mouse events of the DOM element rather than the Ext-Label
												v.el.on("mousedown", function(e){
													this.panel.fireEvent("mousedown", e);
												}, this);
											}
										}
									}
								})
								/*{
									id: this.renderTargetId+"ec_location_info_text",
									border: false,
									width: _w,
									bubbleEvents: ['mousedown','mouseup'],
									html: '<div id="'+this.renderTargetId+"ec_location_info_textFoo"+'"><font size="1" face="tahoma,arial,helvetica,sans-serif">This option needs a geographic position from a other component (for example the map).</font></div>'
								}*/]
							//title: 'test',
//							html: '<div id="informationPanelDiv"><font size="2" face="tahoma,arial,helvetica,sans-serif">This option needs a geographic position from a other component (for example the map).</font></div>'
							
						}),
						
						/*new Ext.ensible.cal.RecurrenceField({
			                name: Ext.ensible.cal.EventMappings.RRule.name,
			                fieldLabel: isDe?"Wiederholung":"Recurrence",
							id: "ec_recurrence",
							width: _w,
			                anchor: '100%'
			            }),*/
						new Ext.grid.GridPanel({
							id: this.renderTargetId+"ec_routeList",
							fieldLabel: isDe? "Verbindungen":"Routes",
							columns: [{id: 'startName', header: (isDe?"Startort":"Start location"), width: 120, dataIndex: 'startName'},
							          {id: 'startTime', header: (isDe?"Abfahrt":"Departure" ), width: 100, dataIndex: 'startTime'}, 
							          {id: 'destTime', header: (isDe?"Ankunft":"Arrival"), width: 100, dataIndex: 'destTime'}
							         ],
							sm : new Ext.grid.RowSelectionModel({singleSelect:true}),
							store: new Ext.data.SimpleStore({
								autoDestroy: true,
								fields: [
								         {name: 'startName', type: 'string'},
								         {name: 'startTime', type: 'string'},
								         {name: 'destTime', type: 'string'}
								],
								sortInfo: {field:'startTime', direction:'ASC'}
							}),
							tbar:[{
					            text: isDe?"Verbindung anzeigen" : 'Show route',
					            iconCls:'add',
								id: this.renderTargetId+"ec_showRoute",
								disabled: true,
								iconCls:'silk-map',
								listeners: {
									'click': {
										fn: function(){
											var route= this.panel.findById(this.renderTargetId+"ec_routeList").getSelectionModel().getSelections()[0];
											if (route != null) {
												var msg = new Ext.cruise.client.Message();
												msg.setName('showRoute');
												msg.appendToBody('route', this.map2XSD('route', route.data.xml));
							                   	this.proxy.publish(msg);
											}
										},
										scope: this
									}
								}
					        }, '-', {
					            text: isDe? "Ist prim&aumlre Route":'Set as primary',
					            iconCls:'option',
								id: this.renderTargetId+"ec_setPrimaryRoute",
								disabled: true,
								listeners: {
									'click': function(){
										var route= this.panel.findById(this.renderTargetId+"ec_routeList").getSelectionModel().getSelections()[0];
										if (route != null && route.data != null) {
											if (this.event.primaryRoute != null) {
												if (this.event.alternativeRoutes==null)
													this.event.alternativeRoutes= [];
												this.event.alternativeRoutes.push(this.event.primaryRoute);
											}
											this.event.primaryRoute = route;
											this.event.alternativeRoutes.remove(route);
										}
										this.highlight(route);
									},
									scope: this
								}
					        },'-',
					        {
					            text: isDe? "Route l&oumlschen":'Delete route',
							            iconCls:'option',
										id: this.renderTargetId+"ec_delRoutes",
										//disabled: true,
										listeners: {
											'click': function(){
												var route= this.panel.findById(this.renderTargetId+"ec_routeList").getSelectionModel().getSelections()[0];
												if (route != null){
													var routelist= this.panel.findById(this.renderTargetId+"ec_routeList");
													routelist.getStore().remove(route);
													//routelist.getStore().removeAll();
												}
												
											},
											scope: this
										}
							        }
					        ],
        					columnLines: true,
					        width: _w,
					        height: 105,
					        frame: false,
							header: false,
							border: true,
							listeners: {
								rowclick : {
									fn : function(grid, rowIndex, event){
										var rlist= this.panel.findById(this.renderTargetId+'ec_routeList');
										if (!rlist) return false;
										var tbar= rlist.getTopToolbar();
										if (!tbar) return false;
										if (rlist.getSelectionModel().getCount() > 0){
											tbar.findById(this.renderTargetId+"ec_showRoute").enable();
											tbar.findById(this.renderTargetId+"ec_setPrimaryRoute").enable();
											tbar.findById(this.renderTargetId+"ec_delRoutes").enable();
										}else {
											tbar.findById(this.renderTargetId+"ec_showRoute").disable();
											tbar.findById(this.renderTargetId+"ec_setPrimaryRoute").disable();
											tbar.findById(this.renderTargetId+"ec_delRoutes").disable();
										}
									},
									scope: this
								}
							}
						}),
						new Ext.grid.GridPanel({
							id: this.renderTargetId+"ec_personList",
							fieldLabel: isDe? "Teilnehmer":"Participants",
							sm : new Ext.grid.RowSelectionModel({singleSelect:true}),
							store: new Ext.data.SimpleStore({
						        autoDestroy: true,
					            fields: [
						                {name: 'surname', type: 'string'},
						                {name: 'forename', type: 'string'},
						                {name: 'email', type: 'string'}
						        ],
						        sortInfo: {field:'surname', direction:'ASC'}
						    }),
							columns: [{id: 'surname', header:(isDe?"Nachname":"Surname"), width: 120, dataIndex: 'surname', menuDisabled:false},
					          {id: 'forename', header:(isDe?"Vorname":"First name"), width: 100, dataIndex: 'forename', menuDisabled:false} 
							],
							columnLines: true,
					        width: _w,
					        height: 105,
					        frame: false,
							header: false,
							border: true,
							listeners: {
								rowclick : {
									fn : function(grid, rowIndex, event){
										var plist= this.panel.findById(this.renderTargetId+'ec_personList');
										if (!plist) return false;
										var tbar= plist.getTopToolbar();
										if (!tbar) return false;
										if (plist.getSelectionModel().getCount() > 0){
											tbar.findById(this.renderTargetId+"ec_disinviteParticipant").enable();
										}else {
											tbar.findById(this.renderTargetId+"ec_disinviteParticipant").disable();
										}
									},
									scope: this
								}
							},
							tbar:[{
					            text: isDe? "Ausladen" : 'Disinvite',
					            iconCls:'remove',
					            id: this.renderTargetId+"ec_disinviteParticipant",
								disabled: true,
								iconCls:'silk-user',
								listeners: {
									'click': {
										fn: function(){
											var pl= this.panel.findById(this.renderTargetId+"ec_personList");
											if (pl==null) return;
											var participant= pl.getSelectionModel().getSelections()[0];
											if (participant!= null) {
												pl.getStore().remove(participant);
												var msg = new Ext.cruise.client.Message();
												msg.setName('contactRequired');
												msg.appendToBody('person', this.map2XSD("person", participant.data.xml));
									            this.proxy.publish(msg);
											}
										},
										scope: this
									}
								}
					        }
					        ],
						})],
						// panel's bottom toolbar
						bbar: [{
							xtype: 'button',
							width: 100,
							iconCls: 'icon-save',
							id: this.renderTargetId+'ec_saveEvent',
							text: isDe ? "Bearbeiten beenden" : 'Finish'
						}
					]
				});
		}
		
		var bbar= this.panel.getBottomToolbar();
		
		// register handlers for button clicks 
		bbar.findById(this.renderTargetId+'ec_saveEvent').addListener('click', function(){
			this.applyValues();
			var val= this.validateEvent();
			if (!val.isValid) {
				Ext.Msg.alert("Invalid event", val.msg);
				return;
			}
			var msg = new Ext.cruise.client.Message();
			msg.setName('eventReady');
			msg.appendToBody('event', this.map2XSD("event", this.event));
            this.proxy.publish(msg);
		}, this);
	},
	
	highlight: function(route){
		var store= this.panel.findById(this.renderTargetId+"ec_routeList").getStore();
		var view = this.panel.findById(this.renderTargetId+"ec_routeList").getView();
		for(var ik=0; ik < store.getCount(); ++ik){
			if (store.getAt(ik)===route){
				view.getRow(ik).style["backgroundColor"] = "#adff2F";
			}else {
				view.getRow(ik).style["backgroundColor"] = "#FFFFFF";
			}
		}
	},
	
	validateEvent: function(){
		var valid= true;
		var msg= "";
		
		if (this.event.name==undefined||this.event.name==null||this.event.name.length==0){
			valid= false;
			msg+= "- a name has to be entered\n";
		}
		if (this.event.begin==undefined||this.event.begin==null||this.event.begin.length==0){
			valid= false;
			msg+= "- no start is stated\n";
		}
		if (this.event.end==undefined||this.event.end==null||this.event.end.length==0){
			valid= false;
			msg+= "- the event's end time is missing\n";
		}
		
		return {
			isValid: valid, 
			msg: msg
		};
	},
  
	/**
	* Obligatory method to render the component
	* @function
	* @public
	* @return void
	*/
	show: function() {
		if (this.panel==null){
			this.createPanel();
		}
		if (!this.panel.rendered) {
			this.log.debug('[EventComponent] The panel is not rendered, rendering it to the div "' + this.renderTargetId + '"');
			this.panel.render(this.renderTargetId);
			
			// update form fields
			this.fillForm();
		}
		if (!this.panel.isVisible()) {
			this.panel.show();
		}
	},
	
	enable: function(){
		if (this.panel!=null){
			this.panel.enable();
		}
	},
	
	disable: function(){
		if (this.panel!=null){
			this.panel.disable();
		}
	},
	
	/**
	* Obligatory method to hide the component
	* @public
	* @function
	*/
	hide: function() {
		if (this.panel.isVisible()) {
			this.panel.hide();
		}
	},
	
	applyValues: function(){
		var val= this.dateSelect.getValue();
		
		var name = this.panel.findById(this.renderTargetId+"ec_name").getValue();
		var begin = val[0].format("Y-m-d\\TH:i:sP");
		var end = val[1].format("Y-m-d\\TH:i:sP");
		var desc = this.panel.findById(this.renderTargetId+"ec_description").getValue();		
		this.event.location= this.panel.findById(this.renderTargetId+"ec_location").getValue();
		this.event = Ext.apply(this.event, {
			name: name,
			begin: begin,
			end: end,
			description: desc
			//TODO
			/*,
			location: null,
	 		address: null,
	 		participants: null,
	 		primaryRoute: null,
	 		alternativeRoues: null*/
		});
	},
	
	fillForm: function(){
		this.panel.findById(this.renderTargetId+"ec_name").setValue(this.event.name);
		this.panel.findById(this.renderTargetId+"ec_description").setValue(this.event.description);
		this.dateSelect.setValue([
			new Date(this.event.begin),
			new Date(this.event.end),
			false
		]);
		if (this.event.location) {
			this.panel.findById(this.renderTargetId+"ec_location").setValue(this.event.location);
		} else {
			this.panel.findById(this.renderTargetId+"ec_location").setValue(null);
		}
		var pstore= this.panel.findById(this.renderTargetId+"ec_personList").getStore();
		pstore.removeAll();
		Ext.each(this.event.participants, function(a){
			pstore.add(a);
		});
		delete this.event.participants;
		if(this.updateNecessary){
			pstore.data.each(this.needActualContactInformation, this);
			this.updateNecessary = false;
		}
		
		var rstore= this.panel.findById(this.renderTargetId+"ec_routeList").getStore();
		rstore.removeAll();
		this.panel.findById(this.renderTargetId+"ec_routeList").getTopToolbar().findById(this.renderTargetId+"ec_showRoute").disable();
		this.panel.findById(this.renderTargetId+"ec_routeList").getTopToolbar().findById(this.renderTargetId+"ec_setPrimaryRoute").disable();
		this.panel.findById(this.renderTargetId+"ec_routeList").getTopToolbar().findById(this.renderTargetId+"ec_delRoutes").disable();
		if (this.event.primaryRoute ) {
			rstore.add(this.event.primaryRoute);
		}
		Ext.each(this.event.alternativeRoutes, function(a){
			rstore.add(a);
		});
		this.highlight(this.event.primaryRoute);
	},
	clearForm: function(){
		this.panel.findById(this.renderTargetId+"ec_name").reset();
		this.panel.findById(this.renderTargetId+"ec_description").reset();
		this.dateSelect.setValue([
		              			new Date(),
		              			new Date(),
		              			false
		              		]);
		this.panel.findById(this.renderTargetId+"ec_location").setValue(null);
		var pstore= this.panel.findById(this.renderTargetId+"ec_personList").getStore();
		pstore.removeAll();
		var rstore= this.panel.findById(this.renderTargetId+"ec_routeList").getStore();
		rstore.removeAll();
		this.event.primaryRoute= null;
		this.event.alternativeRoutes= null;
		
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
		var instance= data;
		if (typeof data == "string"){
			instance= this.xmlUtils.parseXMLFromString(data);
		}
		if ('location' === xsdType){
			try {
				var name = instance.getElementsByTagName('name')[0].firstChild.nodeValue;
				var lat = instance.getElementsByTagName('latitude')[0].firstChild.nodeValue;
	            var lng = instance.getElementsByTagName('longitude')[0].firstChild.nodeValue;
	            var location_text_field = Ext.get(this.renderTargetId+"ec_location_info_text");
	            location_text_field.update('<div id="'+this.renderTargetId+"ec_location_info_textFoo"+'"><font size="2" face="tahoma,arial,helvetica,sans-serif">' + name + '</font></br><font size="1" face="tahoma,arial,helvetica,sans-serif">'+ 'Lat.: ' + lat + ' , Lng.: ' + lng +'</font></div>');
	            return {
					name: name,
					lat: lat,
					lng: lng
				};
			} catch (e) {
				return null;
			}
		}
		if ('event' === xsdType){
			var id=null;
			try{
				var list= instance.getElementsByTagName("id");
				if (list.length>0 && list[0].firstChild!=null)
					id= list[0].firstChild.nodeValue;
			}catch(e){alert(e);}
			

			var now= new Date().format("Y-m-d\\TH:i:sP");
			var name="new event", begin=now, end=now, loca= null, desc="", iteration="", pr= null, ar= null, parts= null;
			
			list= instance.getElementsByTagName("location");
			if (list.length==1){
				loca= this.map2Internal('location', list[0]);
			}
			
			list= instance.getElementsByTagName("description");
			if (list.length>0 && list[0].firstChild!=null)
				desc= list[0].firstChild.nodeValue;
			
			list= instance.getElementsByTagName("recurrence");
			if (list.length>0 && list[0].firstChild!=null)
				iteration= list[0].firstChild.nodeValue;

			list= instance.getElementsByTagName("name");
			if (list.length>0 && list[0].firstChild!=null)
				name= list[0].firstChild.nodeValue;

			list= instance.getElementsByTagName("begin");
			if (list.length>0 && list[0].firstChild!=null)
				begin= list[0].firstChild.nodeValue;

			list= instance.getElementsByTagName("end");
			if (list.length>0 && list[0].firstChild!=null)
				end= list[0].firstChild.nodeValue;

			list= instance.getElementsByTagName("participants");
			if (list.length>0 && list[0].firstChild!=null)
				parts= this.map2Internal("participants", list[0]);

			list= instance.getElementsByTagName("alternativeRoutes");
			if (list.length>0){
				var altls= list[0].getElementsByTagName("route");
				
				ar= [];
				for (var sd=0; sd < altls.length; ++sd){
					var ritem= this.map2Internal("route", altls[sd]);
					if (ritem!=undefined && ritem != null ){
						ar.push(ritem);
					}
				}
			}

			list= instance.getElementsByTagName("primaryRoute");
			if (list.length>0){
				// TODO avoid route element as an extra child
				pr= this.map2Internal('route', list[0].firstElementChild);
			}


			return {
				id: id,
				name: name,
				begin: begin,
				end: end,
				description: desc,
				recurrence: iteration,
				location: loca,
				participants: parts,
				primaryRoute: pr,
				alternativeRoutes: ar
			};
		}
		if ('route' === xsdType){
			try {
				return new EDYRA.ECRouteRecord({
					startName: instance.getElementsByTagName("startName")[0].firstChild.nodeValue,
					startTime: instance.getElementsByTagName("startTime")[0].firstChild.nodeValue,
					destTime: instance.getElementsByTagName("destTime")[0].firstChild.nodeValue,
					xml: instance
				});
			}catch(e){
				return null;
				this.log.error('[EventComponent] map2Internal - route: ' + e);
			}
		}
		if ('routelist' === xsdType){
			try{
				var rlists= instance.getElementsByTagName("routeList")[0];
				if (rlists.length==0) return null;

				var r= [];
				var entries = rlists.getElementsByTagName("route");
				for (var idx=0; idx < entries.length; ++idx){
					r.push(this.map2Internal('route', rlists.getElementsByTagName("route")[idx]));
				}
				return r;
			}catch(e){
				return null;
				this.log.error('[EventComponent] map2Internal - routelist: ' + e);
			}
			
		}
		if ('person' === xsdType){
			try {
				var personRecord = new EDYRA.ECPersonRecord({
					surname: instance.getElementsByTagName("surname")[0].firstChild.nodeValue,
					forename: instance.getElementsByTagName("forename")[0].firstChild.nodeValue,
					email: instance.getElementsByTagName("email")[0].firstChild.nodeValue,
					xml: instance
				});
				//try a update of the contact information
				var surname = instance.getElementsByTagName("surname")[0].firstChild.nodeValue;
				var forename = instance.getElementsByTagName("forename")[0].firstChild.nodeValue;
				var email = instance.getElementsByTagName("email")[0].firstChild.nodeValue;
				if(forename.length <= 1 || surname.indexOf("@") != -1){
					this.updateNecessary = true;
					//this.needActualContactInformation(email);
				}
				return personRecord;
			}catch(E){log.error(E);return null;}		
		}
		if ("participants" ===xsdType){
			var re= [];
			var p_entries = instance.getElementsByTagName("person");
			for (var idx=0; idx < p_entries.length; ++idx){
				re.push(this.map2Internal('person', p_entries[idx]));
			}
			return re;
		}
		if ('personList' ===xsdType){
			var plists= instance.getElementsByTagName("personlist");
			if (plists.length==0) return null;
			
			var re= [];
			var p_entries = plists[0].getElementsByTagName("person");
			for (var idx=0; idx < p_entries.length; ++idx){
				re.push(this.map2Internal('person', p_entries[idx]));
			}
			return re;
		}
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
		if (instance==undefined || instance==null) return "";
		if ('location' === xsdType){
			return "<location><name>"+instance.name+"</name><coordinates><latitude>"+instance.lat+"</latitude><longitude>"+instance.lng+"</longitude></coordinates></location>";
		}
		if ('event' ===xsdType){
			if (!instance.id){
				instance.id= +new Date();
			}
			var event= "<event><id>"+instance.id+"</id><name>"+(instance.name||"new event")+"</name>";
			event+="<begin>"+instance.begin+"</begin>";
			event+="<end>"+instance.end+"</end>";
			event+="<recurrence>"+instance.recurrence+"</recurrence>";
			event+="<description>"+instance.description+"</description>";
			event+=this.map2XSD('location', instance.location);
			
			
			var persStore= this.panel.findById(this.renderTargetId+"ec_personList").getStore();
			if (persStore.getCount()>0){
				event+="<participants>";
				for (var pidx=0; pidx < persStore.getCount(); ++pidx){
					var p= persStore.getAt(pidx);
					event+= this.map2XSD('person', p.data.xml);
				}
				event+="</participants>";
			}else {
				event+="<participants />";
			}

			if (instance.primaryRoute) {
				event += "<primaryRoute>" + this.map2XSD('route', instance.primaryRoute.data.xml) + "</primaryRoute>";
			} else 
				event += "<primaryRoute/>";
			
			//alternative routes
			event+="<alternativeRoutes>";
			if (Ext.isArray(instance.alternativeRoutes))
			for (var fd= 0 ; fd < instance.alternativeRoutes.length; ++fd){
				var _route= instance.alternativeRoutes[fd];
				event+= this.map2XSD('route', _route.data.xml);
			}

			event+="</alternativeRoutes></event>";
			
			this.log.debug("[EventComponent] m2e.event",event);
			return event;
		}
		if ('route' === xsdType){
			//TODO
			var route = this.xmlUtils.serializeXML(instance);
			if (route != undefined && route != null){
				route= this.xmlUtils.removeNamespaceDeclarations(route);
			}
			return route;
		}
		if ('routelist' ===xsdType){
			var rl= instance.getElementsByTagName("routeList");
			var r= [];
			for (var idx=0; idx < rl.length; ++idx){
				var route= rl[idx];
				r.push(this.map2Internal('route',route));
			}
			return r;
		}
		if ('person' === xsdType){
			var person = this.xmlUtils.serializeXML(instance);
			if (person != undefined && person != null)
				person= this.xmlUtils.removeNamespaceDeclarations(person);
			return person;
		}
  	},

	/*
	 SETTERs for properties
	*/
	setWidth: function(value){
		this.width = value;
		if (this.panel) {
			this.panel.setWidth(value);
		}
	},
	
	setHeight: function(value){
		this.height = value;
		if (this.panel) {
			this.panel.setHeight(value);
		}
	},
	setTitle: function(value){
		this.title = value;
		if (this.panel) {
			this.panel.setTitle(value);
		}
	},
	
	getProperty: function(name){
		if (name==="width"){
			return this.width;
		}
		if (name==="height"){
			return this.height;
		}
		if (name==="title"){
			return this.title;
		}
		if (name==="currentEvent"){
			try {
				this.applyValues();
				return this.map2XSD("event", this.event);
			}catch(exe){}
			return null;
		}
	},
	
	setProperty: function(name, value) {
		if (name==="width"){
			this.log.debug('[EventComponent] Setting width of "' + value + '" to the width property');
			this.setWidth(parseInt(value));
		}
		if (name==="height"){
			this.log.debug('[EventComponent] Setting height of "' + value + '" to the height property');
			this.setHeight(parseInt(value));
		}
		if (name==="title"){
			this.log.debug('[EventComponent] Setting title "' + value + '" to the title property');
			this.setTitle(value);
		}
		if (name==="currentEvent"){
			this.setEvent(this.map2Internal("event", value));
		}
	},
	
	isDirty: function(){
		//TODO
		return false;
	},
	
	invokeOperation: function(name, msg){
		var args= msg.getBody();
		
		if (name==="setEvent"){
			this.clearForm();
			this.setEvent(this.map2Internal("event", args['event']));
		}
		if (name==="setLocation"){
			var loc= this.map2Internal('location', args['location']);
			this.event.location= loc;
			if (this.panel) {
				this.panel.findById(this.renderTargetId+"ec_location").setValue(loc);
			}
			this.fireChangeEvent();
		}
		if (name==="setRoutes"){
			var routes= this.map2Internal('routelist',args['routes']);
			var routelist= this.panel.findById(this.renderTargetId+"ec_routeList");
			if (Ext.isArray(routes)) {
				for (var idx = 0; idx < routes.length; ++idx) {
					routelist.getStore().add(routes[idx]);
					if (this.event.alternativeRoutes==null)
						this.event.alternativeRoutes= [];
					this.event.alternativeRoutes.push(routes[idx]);
				}
				this.fireChangeEvent();
			} else {
				routelist.getTopToolbar().findById(this.renderTargetId+"ec_showRoute").disable();
				routelist.getTopToolbar().findById(this.renderTargetId+"ec_setPrimaryRoute").disable();
				routelist.getTopToolbar().findById(this.renderTargetId+"ec_delRoutes").disable();
			}
		}
		if (name==="setPersons"){
			var persons= this.map2Internal('personList',args['persons']);
			
			var personlist= this.panel.findById(this.renderTargetId+"ec_personList");
			if (personlist==null) return;
			var personstore= personlist.getStore();
			if (Ext.isArray(persons)) {
				for (var i = persons.length - 1; i >= 0; --i) {
					var person = persons[i];
					var email = person.data.email;
					//new version
					// email address is id - if the email is in store - remove old entry  
					var idx = personstore.find("email", email);
					if(idx != -1){
						personstore.removeAt(idx);
						personstore.insert(idx, person);
					}else{
						personstore.add(person);
					}
					
					this.fireChangeEvent();
					
					/* old version
					var known = false;
					for (var j = personstore.getCount() - 1; j >= 0; --j) {
						var exPerson= personstore.getAt(j);
						if (person.data.surname === exPerson.data.surname && person.data.forename == exPerson.data.forename) {
							known = true;
							break;
						}
					}
					if (!known)
						personstore.add(person);
					*/
				}
			} else {
				personlist.getTopToolbar().findById(this.renderTargetId+"ec_disinviteParticipant").disable();
			}
		}
	},
	
	fireChangeEvent: function(){
		var msg= new Ext.cruise.client.Message();
		msg.setName("currentEventChanged");
		msg.appendToBody("currentEvent", this.map2XSD('event', this.event));
		
		this.proxy.publish(msg);
	},
	
	getDragData: function(){
		var location= this.panel.findById(this.renderTargetId+"ec_location").getValue();
		
    	var message = new Ext.cruise.client.Message();
    	message.appendToBody('event', this.map2XSD("location", location));
    	message.setName('dndEvent');
    	return message;
	},
	
	setEvent: function(incomingEvent){
		if (incomingEvent.id != this.event.id && this.isDirty()){
			Ext.Msg("Save event?","The event you are editing currently has not been saved and will be overriden with the one selected right now. Do you want to save the current event first?");
			return;
		}
		
		this.event= incomingEvent;
		
		if (this.panel!=null && this.panel.rendered){
			this.fillForm();
		}
//		this.fireChangeEvent();
	},
	needActualContactInformation: function(Record, Store){
		var email = Record.data.xml.getElementsByTagName('email')[0].firstChild.nodeValue;
		var msg = new Ext.cruise.client.Message();
		msg.setName('needActualContactInformation');
		msg.appendToBody('email',email);
		this.proxy.publish(msg); 
	}
});