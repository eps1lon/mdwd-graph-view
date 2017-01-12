(function (window) {
    const $ = window.jQuery;

    // export pattern
    window.DomainSelector = function (jqueryContext) {
        /**
         *
         * @type {Array|ConceptCluster}
         */
        let domains = [];

        // callbacks
        const change_listeners = [];

        // display dom container
        const $dom = jqueryContext;

        // closure
        const that = this;

        // hook change handle
        $('#availableDomains .template .domainCheckbox', $dom).change(function () {
            that.domainsSelected()
        });

        /**
         * TODO later provided from component context
         */
        this.renderTargetId = jqueryContext.attr('id');

        /**
         * helper to generate a unique id that doesnt collide with another instance of this component
         * @param id
         * @returns {String}
         */
        this.generateId = function (id) {
            return this.renderTargetId + id
        };

        /**
         * creates a W3C conform dom id from an uri
         * @param uri
         * @returns {string}
         */
        this.domId = function (uri) {
            return this.generateId(uri.replace(':', '_'))
        };

        /*
         * fire callback with new domains
         */
        this.domainsSelected = function () {
            const selected_domains = domains.filter(d => $("#" + this.domId(d.uri), $dom).is(':checked'));
            console.log('domainsSelected fired with', selected_domains);

            for (const change_listener of change_listeners) {
                change_listener.call(this, selected_domains);
            }
        };

        /**
         *  if u want to be signaled on domainsSelected hook here!
         * @param cb(selected_domains: []<ConceptCluster>)
         */
        this.addChangeListener = function (cb) {
            change_listeners.push(cb)
        };


        this.displayDomains = function (new_domains) {
            console.log('displayDomains caught with', new_domains);
            domains = new_domains;

            const $list = $('#availableDomains', $dom);

            $('li:not(.template)', $list).remove();

            for (let concept_cluster of domains) {
                // we use the scope of let here so that jquery handles can still access it
                // usage of var would lead to access of the last instantiated concept_cluster
                // look up javascript closure, var, let for further reading

                // clone(withChangeHandles?)
                const $container = $('.template', $list).clone(true);
                $container.removeClass('template');

                const dom_id = this.domId(concept_cluster.uri);

                $('.domainCheckbox', $container).attr('id', dom_id);
                $('.domainCheckbox', $container).attr('value', concept_cluster.uri);
                $('.domainLabel', $container).attr('for', dom_id);
                $('.domainLabel', $container).text(concept_cluster.label);

                $container.contextmenu(function () {
                    $('#detailView').text(JSON.stringify(concept_cluster, null, 4));

                    return false
                });

                $list.append($container)
            }

            // call change listeners
            this.domainsSelected()
        }
    }
})(this);