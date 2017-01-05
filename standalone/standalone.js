(function (window) {
    'use strict'
    // brower context
    var document = window.document
    var $ = window.jQuery

    // func
    var aboxQuery = window.aboxQuery
    var createData = window.createData

    // components
    var DomainSelector = window.DomainSelector
    var GraphVisualizer = window.GraphVisualizer

    $(document).ready(function () {
        /**
         * available domains as promise because we have to query them
         * values later available as []<ConceptCluster>
         * @type {Promise}
         */
        var domains = window.northwind.byType('ia:ConceptCluster')

        var domain_selector = new DomainSelector($('#domainSelector'))
        var graph_vis = new GraphVisualizer($('#graphVis'))

        // handle communication between domainSelector and graph vis
        domain_selector.addChangeListener(function (domains) {
            graph_vis.showDomain(domains)
        })

        graph_vis.addConceptsSelectedListener(function (concepts) {
            // detailView.showDetails(concepts)
            $('#detailView').text(JSON.stringify(concepts, null, 4))
        })

        domains.then(domains => {
            domain_selector.displayDomains(domains)

            //* TODO select first for testing
            $('#availableDomains li:visible:first input[type=checkbox]')
                .prop('checked', true)
                .trigger('change')//*/

        })

        // northwind graph TODO testing
        //$('#search').text('Anzeige von Objekten mit Typ x und assoziierten dokumente')
        abox_query([{
            "@embed": "@always",
            //"@type": "nw:OrderDetails",
            "@id": "nwa:OrderDetails0"
        }]).then(graph => {
            //graph_vis.showGraph(graph)
        })
    })

})(this)