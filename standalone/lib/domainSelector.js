(function ($window) {
    var $ = $window.jQuery

    // export pattern
    $window.DomainSelector = function (jqueryContext) {
        // []<{id: domainId, human: humanReadableString}>
        var domains = []

        // callbacks
        var change_listeners = []

        // display dom container
        var $dom = jqueryContext

        // closure
        var that = this

        // hook change handle
        $('#availableDomains .template .domainCheckbox', $dom).change(function () {
            console.log('changed')
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

        // if u want to be signaled on domainsSelected hook here!
        this.addChangeListener = function (cb) {
            change_listeners.push(cb)
        }


        this.displayDomains = function (new_domains) {
            domains = new_domains

            var $list = $('#availableDomains', $dom)

            $('li:not(.template)', $list).remove()

            for (var i = 0; i < domains.length; ++i) {
                var domain = domains[i]
                // clone(withChangeHandles?)
                var $container = $('.template', $list).clone(true)
                $container.removeClass('template')


                $('.domainCheckbox', $container).attr('id', domain.id)
                $('.domainCheckbox', $container).attr('value', domain.id)
                $('.domainLabel', $container).attr('for', domain.id)
                $('.domainLabel', $container).text(domain.human)

                $list.append($container)

            }

            // call change listeners
            this.domainsSelected()
        }
    }
})(this)