fs = Meteor.npmRequire('fs');
parseString = Meteor.npmRequire('xml2js').parseString;
Meteor.methods({
	processXML: function(fileName){
		var j, 
			xml;
		var filePath = '/Users/jl/sites/paperchase/uploads/xml/';//TODO: add paths
		var file = filePath + fileName;
		fs.exists(file, function(fileok){
			if(fileok){
				fs.readFile(file, function(error, data) {
					xml = data.toString();
					parseString(xml, function (err, result) {
						j = result;
						console.log(j);
						return j;
					});
				});
			}else{
				console.log('file not found');
			}
		});
	}
})

