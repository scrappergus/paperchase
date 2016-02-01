Meteor.methods({
	articleAssests: function(mongoId){
		console.log('... articleAssests: Mongo ID ', mongoId);
		var article = articles.findOne({_id : mongoId});
		var assets = {};
		if(article.ids.paperchase_id){
			var paperchaseId = article.ids.paperchase_id;
			// console.log('paperchaseId',paperchaseId);
			// XML
			var xmlAsset = xmlCollection.findOne({'ids.paperchase_id' : paperchaseId});
			if(xmlAsset && xmlAsset.xml_url){
				assets.xml_url = xmlAsset.xml_url;
			}
			// PDF
			var pdfAsset = pdfCollection.findOne({'ids.paperchase_id' : paperchaseId});
			if(pdfAsset && pdfAsset.pdf_url){
				assets.pdf_url = pdfAsset.pdf_url;
			}
		}
		// console.log(assets);
		return assets;
	},
	assetExistsOnS3: function(url){
		var fut = new future();
		Meteor.http.get(url , function(error,result){
			if(error){
				console.error('Asset Check Error: ',error);
				fut['return'](false);
			}else if(result){
				console.log(url + ' Exists');
				fut['return'](true);
			}
		});
		return fut.wait();
	},
	updateAssetDoc: function(assetType, articleMongoId, assetData){
		// console.log('..updateAssetDoc',assetType, articleMongoId, assetData);
		// var collection = global[assetType];
		// if (collection instanceof Meteor.Collection) {
		// 	console.log('..updateAssetDoc: ', assetType, paperchaseId );
		// 	collection.update({'ids.paperchase_id' : paperchaseId},assetData, {upsert:true}, function(updateError,updateRes){
		// 		if(updateError){
		// 			console.error('updateError',updateError);
		// 			return;
		// 		}else if(updateRes){
		// 			return updateRes;
		// 		}
		// 	});
		// }else{
		// 	console.log('not a collection');
		// }
		//TODO: Get above to work, using variable name as collection
		if(assetType == 'pdf'){
			pdfCollection.update({'ids.mongo_id' : articleMongoId},assetData, {upsert:true}, function(updateError,updateRes){
				if(updateError){
					console.error('updateError',updateError);
					return;
				}else if(updateRes){
					return updateRes;
				}
			});
		}else if(assetType == 'xml'){
			xmlCollection.update({'ids.mongo_id' : articleMongoId},assetData, {upsert:true}, function(updateError,updateRes){
				if(updateError){
					console.error('updateError',updateError);
					return;
				}else if(updateRes){
					return updateRes;
				}
			});
		}
	}
});