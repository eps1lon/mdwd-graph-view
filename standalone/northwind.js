(function (window) {
    'use strict';

    const DEFAULTS = {
        'uri': 'defaultURI',
        'string': 'defaultString'
    }

    // northwind abox to schema
    window.northwind = new SchemaFactory({
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

                schema.label = data['nw:hasTitle'] || `instance of ${schema.type} is not a Thing`;

                if (data.hasOwnProperty('nw:hasDescription')) {
                    schema.description = data['nw:hasDescription']
                }

                schema.relatedArtefacts = [];

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
                schema.name = data['ia:hasClusterID'];
                schema.label = data['rdfs:label']['@value'];
                schema.concepts = data['ia:containsIndividual'];

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
                schema.name = jsonld['dc:title'];
                schema.fileType = 'not given in nw';

                schema.label = jsonld['dc:identifier'];

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
                console.warn("Klass.build not implemented")

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

        return 'Artefact'
    })
})(this)