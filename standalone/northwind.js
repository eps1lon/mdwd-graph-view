(function (window) {
    'use strict';

    const DEFAULTS = {
        'uri': 'defaultURI',
        'string': 'defaultString'
    }

    // northwind abox to schema
    window.northwind = window.northwind = new SchemaFactory({
        /*
         'ExampleType': {
         'defaults': new Map(Object.entries({})),
         'extends': undefined,
         'build': function (schema, jsonld) {

         }
         },//*/
        'Artefact': {
            'defaults': {
                'uri': DEFAULTS.uri,
                'type': DEFAULTS.uri,
                'label': DEFAULTS.string,
                'sourceGraph': DEFAULTS.uri,
                'description': DEFAULTS.string,
                'relatedArtefacts': []
            },
            'EXTENDS': undefined,
            /**
             *
             * @param schema the defaults object following the inheritance chain
             * @param data jsonld data
             * @returns {*}
             */
            'build': function (schema, data) {
                var that = this
                schema.uri = data['@id']
                schema.type = data['@type']

                schema.label = data['nw:hasTitle'] || 'entity is not a thing'

                // TODO sourceGraph

                if (data.hasOwnProperty('nw:hasDescription')) {
                    schema.description = data['nw:hasDescription']
                }

                var related = []
                switch (data['@type']) {
                    case 'nw:Product':
                        related = ['nw:hasProductCategory', 'nw:hasSupplier']
                        break;
                    case 'nw:Employee':
                        related = ['nw:hasTerritory']
                        break;
                    case 'nw:Order':
                        related = ['nw:hasEmployee', 'nw:hasCustomer', 'nw:viaShipper']
                        break;
                    case 'nw:OrderDetails':
                        related = ['nw:hasOrder', 'nw:hasProduct']
                        break;
                    // this may be obsolete if we can frame the relevance into the related artefacts
                    case 'rdf:Statement':
                        related = ['rdf:object', 'rdf:predicate', 'rdf:subject']
                        break;
                }

                schema.relatedArtefacts.push(...related.map(k => that.fromJsonld(data[k])))

                return schema
            }
        },
        'ConceptCluster': {
            'defaults': {
                'name': DEFAULTS.string,
                'concepts': []
            },
            'EXTENDS': 'Artefact',
            'build': function (schema, data) {
                var that = this
                schema.name = data['ia:hasClusterID']
                schema.label = data['rdfs:label']['@value']
                schema.concepts = data['ia:containsIndividual'].map(i => {
                    return that.fromJsonld(i)
                })

                return schema
            }
        },
        'Document': {
            'defaults': {
                'name': DEFAULTS.string,
                'fileType': DEFAULTS.string
            },
            'EXTENDS': 'Artefact',
            'build': function (schema, jsonld) {
                schema.name = jsonld['dc:title']
                schema.fileType = 'not given in nw'

                schema.label = jsonld['dc:identifier']

                return schema
            }
        },
        'Contact': {
            'defaults': {
                'firstName': DEFAULTS.string,
                'lastName': DEFAULTS.string
            },
            'EXTENDS': 'Artefact',
            'build': function (schema, jsonld) {
                console.log('TODO Contact', schema, jsonld)

                return schema
            }
        },
        'Klass': {
            'defaults': {
                'subclasses': [],
                'superclasses': [],
                'individuals': []
            },
            'EXTENDS': 'Artefact',
            'build': function (schema, jsonld) {
                if (jsonld['@type'] == 'nw:Product') {
                    schema.superclasses.push(jsonld['nw:hasProductCategory']['@id'])
                } else if (jsonld['@type'] == 'nw:ProductCategory') {
                    // TODO reference to products
                } else {
                    // console.log('TODO Klass', schema, jsonld)
                }

                if (jsonld['ia:associatedTo']) {
                    // it should be a list of objects but for whatever reason a list with only one object
                    // is passed as an object (just the object that should be in the list)
                    schema.individuals.push(...[].concat(jsonld['ia:associatedTo']).map(d => this.fromJsonld(d)))
                }


                return schema
            }
        }
    }, function (jsonld) {
        switch (jsonld['@type']) {
            case 'ia:ConceptCluster':
                return 'ConceptCluster'
            case 'ia:Document':
                return 'Document'
            case 'nw:Contact':
                return 'Contact'

        }

        return 'Klass'
    })
})(this)