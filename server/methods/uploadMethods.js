Meteor.methods({
	fileExistsOnS3: function(url){
		console.log('..fileExistsOnS3: ' + url);
		var fut = new future();
		Meteor.http.get(url,function(error, result) {
			if(error){
				// throw new Meteor.Error(500, 'XML file not found', 'The URL did not return a file: ' + url);
				// console.error('XML file not found',error);
				fut['return'](false);
			}else if(result){
				fut['return'](true);
			}
		});
		return fut.wait();
	},
	paperchaseIdFromXmlFileNameCheck: function(filename){
		var article;
		// console.log('...paperchaseIdFromXmlFileNameCheck : ' + filename);
		// Versioning is based on file name, which is based on PII. Make sure filename is PII.xml
		var paperchaseId = filename.replace('.xml','');
		article = articles.findOne({'ids.paperchase_id' : paperchaseId});
		if(article){
			// console.log('article = ' + article._id);
			return article._id;
		}else{
			// console.log('NO PII');
			throw new Meteor.Error(500, 'Error 500: Not found', 'PII is not found in the database');
		}
	},
	parseXmlAfterUpload: function(url){
		console.log('..parseXmlAfterUpload : ' + url);
		var fut = new future();
		var xmlString;
		// after uploading XML to S3, parse some info to add to DB
		// TODO: update DB after uploaded to S3. Look into lambda fxns on aws
		Meteor.http.get(url,function(error, result) {
			if(error){
				// throw new Meteor.Error(500, 'XML file not found', 'The URL did not return a file: ' + url);
				console.error('XML file not found');
				fut['throw'](error);
			}else if(result){
				// console.log(result.content);
				xmlString = result.content.toString();
				// console.log(xmlString);
				Meteor.call('processXmlString',xmlString,function(err,processedArticle){
					if(err){
						console.error(err);
						fut['throw'](err);
					}
					if(processedArticle){
						// return process XML string
						fut['return'](processedArticle);
					}
				});
			}
		});
		return fut.wait();
	}
});