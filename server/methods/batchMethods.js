Meteor.methods({
	batchUpdateXml: function(journal,cb){
		var fut = new future();
		console.log('..batchUpdateXml : ' + journal);
		// var xmlCrawlUrl = journalConfig.findOne().api.crawler_xml; // LIVE
		var xmlCrawlUrl = 'http://localhost:4932/crawl_xml'; // LOCAL
		var res,
			articlesList;
		res = Meteor.http.get(xmlCrawlUrl + '/' + journal);
		if(res && res.data){
			// Loop through all articles in response and update the xml collection in the DB
			articlesList = res.data;
			var updatedCount = 0;
			for(var i=0 ; i<articlesList.length ; i++){
				// console.log(JSON.stringify(articlesList[i]));
				var articleIds = articlesList[i]['ids'];

				var updated = xmlCollection.update({ids: {'$in': articleIds}},{$set:articlesList[i]},{upsert: true});

				// keep track of successful updates
				if(updated){
					updatedCount++;
				}
				if (i == parseInt(articlesList.length-1) && updatedCount == articlesList.length){
					// if last article and all succesfully updated
					console.log('LAST');
					fut['return'](true);
				}else if(i == parseInt(articlesList.length-1)){
					// if last article and not all succesfully updated
					var errorMessage = 'total = ' + articlesList.length + ', updated = ' + updated;
					console.error('ERROR : ' + errorMessage);
					throw new Meteor.Error(500, 'Error 500: Not all articles updated in database', errorMessage);
				}
			}
		}else{
			console.log('ERROR');
			fut['return'](false);
		}
		return fut.wait();
	}
})