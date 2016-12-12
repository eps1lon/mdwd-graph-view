(function ($window) {
	'use strict'
    // brower context
	var document = $window.document
	var $ = $window.jQuery

	// components
	var DomainSelector = $window.DomainSelector
	var GraphVisualizer = $window.GraphVisualizer

	$(document).ready(function () {
		// static daten
		var domains = [
			{id: 'northwind-abox', human: 'Wirtschaft'},
            {id: 'domain2', human: 'Geographie'},
            {id: 'domain3', human: 'Recht'},
            {id: 'domain4', human: 'KfZ'}
		]

		var domain_selector = new DomainSelector($('#domainSelector'))
		var graph_vis = new GraphVisualizer($('#graphVis'))

        // handle communication between domainSelector and graph vis
        domain_selector.addChangeListener(function (domains) {
            //graph_vis.showGraph(domains)
        })

        domain_selector.displayDomains(domains)

        // northwind graph TODO static
        $('#search').text('Anzeige von Objekten mit Typ x (hier Territorium) und assoziierten dokumente')
        abox_query([{
            "@embed": "@always",
            "@type": "nw:Territory",
            "ia:associatedTo": {
                "@embed": "@always",
                "@type": "ia:Document"
            }
        }]).then(graph => {
            graph_vis.showGraph(graph)
        })
    })
	
})(this)