
xpath = Meteor.npmRequire('xpath');
dom = Meteor.npmRequire('xmldom').DOMParser;
Meteor.methods({
	fullTextToJson: function(xml){
		console.log('... fullTextToJson');
		var object = {};
		var doc = new dom().parseFromString(xml);
		// var body = xpath.select("//body", doc);
		// var nodes = xpath.select("//sec", doc)
		// nodes.forEach(function(node){
		//     var courses = node.getElementsByTagName('coursename')
		//     for(var i=0;i< courses.leangth;i++){
		//         console.log(node.firstChild.firstChild.nodeValue,courses[i].firstChild.nodeValue)
		//     }
		// })
		// check for <sec>. Possible that editorials are the only type without..
		// var sections = xpath.select("//sec", doc);
		// if(sections[0]){
		// 	console.log('YES');
		// 	for(var c = 0 ; c < sections[0].childNodes.length ; c++){
		// 		console.log('.. '+c);
		// 		if(sections[0].childNodes[c]['nodeValue']){
		// 			console.log(sections[0].childNodes[c]['nodeValue']);
		// 		}

		// 	}
		// }else{
		// 	// just create 1 section
		// }

		// parseString(xml, function (error, result) {
		// 	if(error){
		// 		console.log('ERROR - fullTextToJson');
		// 		console.log(error);
		// 		throw new Meteor.Error('ERROR - fullTextToJson', error);
		// 	}else{
		// 		// Process JSON for meteor templating
		// 		var articleJSON = result['pmc-articleset']['article'][0]['body'][0];

		// 		// BODY
		// 		console.log(articleJSON);
		// 	}
		// });
	},
});