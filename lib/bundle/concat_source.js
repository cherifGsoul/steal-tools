var sourceNode = require("../node/source").node;
var concat = require("../source-map-concat");
var path = require("path");

module.exports = function(bundle, sourceProp, excludePlugins){

	var output = fileName(bundle);

	var nodes = bundle.nodes.map(function(node){

		if(node.load.metadata && node.load.metadata.hasOwnProperty('bundle') && node.load.metadata.bundle === false){
			return {
				node: node,
				code: "",
				map: ""
			};
		}

		// Allow some nodes to be completely excluded
		if(node.load.excludeFromBuild) {
			return undefined;
		}

		// For plugins, only include them if they explicitly define
		// includeInBuild
		if(node.isPlugin && !node.value.includeInBuild) {
			return {
				node: node,
				code: excludePlugins ? "" : "define('"+node.load.name+"', [], function(){ return {}; });"
			};
		}

		var source = sourceNode(node, sourceProp);

		return {
			node: node,
			code: (source.code || "") + "",
			map: source.map
		};
	}).filter(truthy);

	var concatenated = concat(nodes, {
		mapPath: output + ".map",
		delimiter: "\n",
		process: prependName
	});

	var result = concatenated.toStringWithSourceMap({
		file: path.basename(output)
	});

	bundle.source = result;

	function prependName(node, file) {
		if(node.prependModuleName !== false && file.node.load.name) {
			node.prepend("/*"+file.node.load.name+"*/\n");
		}
	}
};

function fileName(bundle) {
	var name = bundle.name || bundle.bundles[0] || bundle.nodes[0].load.name;
	return name .replace("bundles/", "").replace(/\..+!/, "") + "." + bundle.buildType;
}

function truthy(x) { return !!x; }
