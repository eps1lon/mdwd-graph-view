(function ($window) {
    var $ = $window.jQuery

    $window.GraphVisualizer = function (jqueryContext) {
        var $dom = jqueryContext

        var $minimap = $('#graphMinimap', $dom)
        var $graph = $('#domainGraph', $dom)

        // the graphlayout TODO: different layouts as constants
        var layout = null

        this.showGraph = function (graph) {
            //
            $('*', $graph).remove()

            var ht = new $jit.Hypertree({
                injectInto: 'domainGraph',
                height: $graph.height(),
                width: $graph.width(),
                Node: {
                    dim: 9,
                    color: "#f00"
                },
                Edge: {
                    lineWidth: 2,
                    color: "#088"
                },
                onCreateLabel: function(domElement, node){
                    domElement.innerHTML = node.name;
                },
                onPlaceLabel: function(domElement, node){
                    var style = domElement.style;
                    style.display = '';
                    style.cursor = 'pointer';
                    if (node._depth <= 1) {
                        style.fontSize = "0.8em";
                        style.color = "#ddd";

                    } else if(node._depth == 2){
                        style.fontSize = "0.7em";
                        style.color = "#555";

                    } else {
                        style.display = 'none';
                    }

                    var left = parseInt(style.left);
                    var w = domElement.offsetWidth;
                    style.left = (left - w / 2) + 'px';
                }
            })

            var json = {
                'id': 'all_domains',
                'name': 'Domains',
                'children': graph.map(d => {
                    return {
                        'id': d.id,
                        'name': d.human,
                        'children': []
                    }
                })
            }

            console.log(json)
            ht.loadJSON(json)

            ht.refresh();
        }
    }
})(this)