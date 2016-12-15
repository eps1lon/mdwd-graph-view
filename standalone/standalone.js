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
		var domains = new Promise((fulfill, reject) => {
		    abox_query([{
                "@embed": "@always",
                "@type": "ia:ConceptCluster"
            }]).then(graph => {
                fulfill(graph.map(node => {
                    // ConceptCluster extends Artefact
                    var concept_cluster = createData('ConceptCluster')

                    console.log(node)

                    // fill in data from abox
                    concept_cluster.uri = node['@id']
                    concept_cluster.name = node['ia:hasClusterID']
                    concept_cluster.type = node['@type']
                    concept_cluster.label = node['rdfs:label']['@value']

                    return concept_cluster
                }))
            })
        })

		var domain_selector = new DomainSelector($('#domainSelector'))
		var graph_vis = new GraphVisualizer($('#graphVis'))

        // handle communication between domainSelector and graph vis
        domain_selector.addChangeListener(function (domains) {
            //graph_vis.showGraph(domains)
        })

        domains.then(domains => {
            domain_selector.displayDomains(domains)
        })

        // northwind graph TODO static
        $('#search').text('Anzeige von Objekten mit Typ x (hier Territorium) und assoziierten dokumente')
        abox_query([{
            "@embed": "@always",
            "@type": "nw:Territory"
        }]).then(graph => {
            graph_vis.showGraph(graph)
        })
    })
	
})(this)