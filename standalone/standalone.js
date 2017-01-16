(function (window) {
    'use strict';
    // brower context
    const document = window.document;
    const $ = window.jQuery;

    // func
    const aboxQuery = window.aboxQuery;

    // components
    const DomainSelector = window.DomainSelector;
    const GraphVisualizer = window.GraphVisualizer;

    $(document).ready(function () {
        /**
         * available domains as promise because we have to query them
         * values later available as []<ConceptCluster>
         * @type {Promise}
         */
        const domains = window.northwind.byType('ia:ConceptCluster');

        const domain_selector = new DomainSelector($('#domainSelector'));

        const graph_vis = new GraphVisualizer();

        graph_vis.init($('#graphVis'), window.northwind);

        // handle communication between domainSelector and graph vis
        domain_selector.addChangeListener(function (domains) {
            graph_vis.showDomain(domains)
        });

        graph_vis.addConceptsSelectedListener(function (concepts) {
            // detailView.showDetails(concepts)
            $('#detailView').text(JSON.stringify(concepts, null, 4))
        });

        domains.then(domains => {
            domain_selector.displayDomains(domains.content.map(d => {
                const concept_cluster = northwind.fromJsonld(d);
                concept_cluster.sourceGraph = domains.id;
                return concept_cluster;
            }));

            //* TODO select first for testing
            $('#availableDomains li:visible:first input[type=checkbox]')
                .prop('checked', true)
                .trigger('change');//*/

        });

        // northwind graph TODO testing
        //$('#search').text('Anzeige von Objekten mit Typ x und assoziierten dokumente')
        aboxQuery([{
            "@embed": "@always",
            //"@type": "nw:OrderDetails",
            "@id": "nwa:OrderDetails0"
        }]).then(graph => {
            //graph_vis.showGraph(graph)
        })
    })

})(this);