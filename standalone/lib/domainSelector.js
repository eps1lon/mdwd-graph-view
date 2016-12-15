(function (window) {
    var $ = window.jQuery

    /**
     * creates a W3C conform dom id from an uri
     * @param uri
     * @returns {string}
     */
    var domId = function (uri) {
        return uri.replace(':', '_')
    }

    // export pattern
    window.DomainSelector = function (jqueryContext) {
        // []<ConceptCluster>
        var domains = []

        // callbacks
        var change_listeners = []

        // display dom container
        var $dom = jqueryContext

        // closure
        var that = this

        // hook change handle
        $('#availableDomains .template .domainCheckbox', $dom).change(function () {
            that.domainsSelected()
        })

        /*
         * fire callback with new domains
         */
        this.domainsSelected = function () {
            console.log('domains selected!')
            var selected_domains = domains.filter(d => $("#" + d.id, $dom).is(':checked'))

            for (var i = 0; i < change_listeners.length; ++i) {
                change_listeners[i].call(this, selected_domains)
            }
        }

        /**
         *  if u want to be signaled on domainsSelected hook here!
         * @param cb(selected_domains: []<ConceptCluster>)
         */
        this.addChangeListener = function (cb) {
            change_listeners.push(cb)
        }


        this.displayDomains = function (new_domains) {
            domains = new_domains

            var $list = $('#availableDomains', $dom)

            $('li:not(.template)', $list).remove()

            for (var i = 0; i < domains.length; ++i) {
                let concept_cluster = domains[i]
                // clone(withChangeHandles?)
                var $container = $('.template', $list).clone(true)
                $container.removeClass('template')

                var dom_id = domId(concept_cluster.uri)

                $('.domainCheckbox', $container).attr('id', dom_id)
                $('.domainCheckbox', $container).attr('value', dom_id)
                $('.domainLabel', $container).attr('for', dom_id)
                $('.domainLabel', $container).text(concept_cluster.label)

                $container.contextmenu(function () {
                    $('#detailView').text(JSON.stringify(concept_cluster, null, 4))

                    return false
                })

                $list.append($container)
            }

            // call change listeners
            this.domainsSelected()
        }
    }
})(this)