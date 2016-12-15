(function (window) {
    'use strict';
    const EXTENDS_IDENT = 'EXTENDS' // on change pls check schema definition in const schema

    const DEFAULTS = {
        'uri': 'defaultURI',
        'string': 'defaultString'
    }

    // TODO unclean object, use Map and refactor usage
    const schemas = {
        'Artefact': {
            'uri': DEFAULTS.uri,
            'type': DEFAULTS.uri,
            'label': DEFAULTS.string,
            'sourceGraph': DEFAULTS.uri,
            'description': DEFAULTS.string,
            'relatedArtefacts': [],
            'EXTENDS': undefined
        },
        'ConceptCluster': {
            'EXTENDS': 'Artefact',
            'name': DEFAULTS.string,
            'concepts': []
        }
    }

    /**
     * create a data structure from the described schema definition in
     * https://trac.mmt.inf.tu-dresden.de/CRUISe/wiki/applications/infoapp#DatenschematafürKomponentenschnittstellen
     *
     * @param {string} struct struct name from component interface
     */
    window.createData = function (struct) {
        if (struct in schemas) {
            var data = JSON.parse(JSON.stringify(schemas[struct]));

            if (data[EXTENDS_IDENT] !== undefined) {
                // merge
                Object.assign(data, createData(data[EXTENDS_IDENT]))
            }

            return data
        }
    }
})(this)