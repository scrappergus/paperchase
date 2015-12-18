Meteor.methods({
	piiFromXmlFileNameCheck: function(filename){
		var article;
		// console.log('...piiFromXmlFileNameCheck : ' + filename);
		// Versioning is based on file name, which is based on PII. Make sure filename is PII.xml
		var pii = filename.replace('.xml','');
		article = articles.findOne({'ids.pii' : pii});
		if(article){
			// console.log('article = ' + article._id);
			return article._id;
		}else{
			// console.log('NO PII');
			throw new Meteor.Error(500, 'Error 500: Not found', 'the PII is not found');
		}
	},
	parseXmlAfterUpload: function(url,mongoId){
		// console.log('..parseXmlAfterUpload : ' + mongoId + ', xml: ' + url);
		var fut = new future();
		var xmlString;
		// after uploading XML to S3, parse some info to add to DB
		// TODO: update DB after uploaded to S3. Look into lambda fxns on aws
		Meteor.http.get(url,function(error, result) {
			if(error){
				throw new Meteor.Error(500, 'XML file not found', 'The URL did not return a file: ' + url);
			}
			if(result){
				// console.log(result.content);
				xmlString = result.content.toString();
				// console.log(xmlString);
				Meteor.call('processXmlString',xmlString,function(err,processedArticle){
					if(err){
						// throw new Meteor.Error(500, 'Could not process XML - ' + url,err);
						console.error('error');
						console.error(err);
						fut['throw'](err.error);
					}
					if(processedArticle){
						// Update the DB
						Meteor.call('updateArticle', mongoId, processedArticle, function(e,dbUpdated){
							if(e){
								throw new Meteor.Error(500, 'Could not update DB', mongoId);
							}
							if(dbUpdated){
								fut['return'](true);
							}
						});
					}
				});
			}
		});
		return fut.wait();
	}
});