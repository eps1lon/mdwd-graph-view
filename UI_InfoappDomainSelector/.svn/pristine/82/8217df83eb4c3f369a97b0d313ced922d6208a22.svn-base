const ucfirst = s => s.length ? s[0].toUpperCase() + s.slice(1) : '';

const example_domains = $.getJSON("http://localhost:8080/csr-client/components/mdwd/UI_InfoappDomainSelector/data/example_domains.json");

const naive_props = ['width', 'height', 'title'];

Ext.namespace("EDYRA.components");
EDYRA.components.DomainSelector = Ext.extend(Object, {
	// 
	title: null,
	height: null,
	width: null,
	renderID: null,
	// class
	log: undefined,
	proxy: undefined,
	domains: [],
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
        this.proxy = ctx.getAttribute('EventHandler');
	},
	show: function () {
		const id = this.renderID;
		const html = this.render();
		
		var div = document.getElementById(this.renderID);
		div.innerHTML = html;
		
		this.componentDidMount();
		
        // TODO remove example
		example_domains.then((domains) => {
            this.displayDomains(domains);
		});
	},
	render: function () {
		return `<h1>Domänen</h1>
			<input type="search" placeholder="Suchen...">
			<ul id="${this.generateId('availableDomains')}">
				<li class="template">
					<input type="checkbox" class="domainCheckbox" id="${this.generateId('templateDomain')}" value="templateDomain">
					<label for="${this.generateId('templateDomain')}" class="domainLabel">Template</label>
				</li>
				<li>
					StaticDomain
				</li>
			</ul>`;
	},
	componentDidMount () {
		this.hookEventListeners();
	},
	hookEventListeners: function () {
		const that = this;
		$(`#${this.generateId('availableDomains')} .template .domainCheckbox`).change(function () {
            that.publishDomainsSelected();
        });
	},
	generateId: function (id) {
        return [this.renderID, id].join('-')
    },
    uriToDomId: function (uri) {
    	return this.generateId(uri.replace(':', '_'));
    },
    displayDomains: function (new_domains) {
    	console.warn('displayDomains caught with', new_domains);
        this.domains = new_domains;

        const $list = $(`#${this.generateId('availableDomains')}`);

        $('li:not(.template)', $list).remove();

        for (const concept_cluster of this.domains) {
            // we use the scope of let here so that jquery handles can still access it
            // usage of var would lead to access of the last instantiated concept_cluster
            // look up javascript closure, var, let for further reading

            // clone(withChangeHandles?)
            const $container = $('.template', $list).clone(true);
            $container.removeClass('template');

            const dom_id = this.uriToDomId(concept_cluster.uri);

            $('.domainCheckbox', $container).attr('id', dom_id);
            $('.domainCheckbox', $container).attr('value', concept_cluster.uri);
            $('.domainLabel', $container).attr('for', dom_id);
            $('.domainLabel', $container).text(concept_cluster.label);

            $list.append($container)
        }

        // call change listeners
        this.publishDomainsSelected()
    },
    getSelectedDomains: function () {
    	return this.domains.filter(d => $(`#${this.uriToDomId(d.uri)}`).is(':checked'));
    },
    publishDomainsSelected: function () {
        var message = new Ext.cruise.client.Message();

        message.setName('domainsSelected');
        message.appendToBody('domains', this.getSelectedDomains());

        this.proxy.publish(message);
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
       case 'displyDomains':
           this.displayDomains(body.domains);
           break;
       default:
           this.log.warn(`${name} operation not defined`);
           break;
       }
	},
	publishDomainsSelected: function() {
       var message = new Ext.cruise.client.Message();

       message.setName('domainsSelected');
       message.appendToBody('concepts', this.getSelectedDomains());

       this.proxy.publish(message);
   },
});