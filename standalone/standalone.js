(function ($window) {
	'use strict'
	// brower context
	var document = $window.document
	var $ = $window.jQuery

	// components
	var DomainSelector = $window.DomainSelector
	var GraphVisualizer = $window.GraphVisualizer

	$(document).ready(function () {
		// dummy daten
		var domains = [
			{id: 'domain1', human: 'Wirtschaft'},
            {id: 'domain2', human: 'Geographie'},
            {id: 'domain3', human: 'Recht'},
            {id: 'domain4', human: 'KfZ'}
		]

		var domain_selector = new DomainSelector($('#domainSelector'))
		var graph_vis = new GraphVisualizer($('#graphVis'))

        // handle communication between domainSelector and graph vis
        domain_selector.addChangeListener(function (domains) {
            graph_vis.showGraph(domains)
        })

		domain_selector.displayDomains(domains)


	})
	
})(this)