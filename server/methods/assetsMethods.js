Meteor.methods({
	fullTextXmlReal: function(url){
		var fut = new future();
		var xml;
		var figures = []; // just pass empty array, we are just wanting to check if the xml is real
		Meteor.http.get(url , function(error,result){
			if(error){
				// console.error('Asset Check Error: ',error);
				fut['return'](false);
			}else if(result){
				// console.log(url + ' Exists');
				xml = result.content;
				// console.log(typeof xml);
				// console.log('result',result);
				Meteor.call('fullTextToJson',xml, figures, function(convertXmlError, convertedXml){
					if(convertXmlError){
						console.error('convertXmlError',convertXmlError);
						fut['throw'](convertXmlError);
					}else if(convertedXml){
						// console.log('convertedXml',convertedXml);
						fut['return'](convertedXml);
					}else{
						fut['return'](false);// todo: handle when there is no xml
					}

				});
			}
		});
		return fut.wait();
	},
	articlesWith: function(url,searchFor){
		// console.log('url',url);
		// console.log('searchFor',searchFor);
		var fut = new future();
		var xml;
		var figures = []; // just pass empty array, we are just wanting to check if the xml is real
		Meteor.http.get(url , function(error,result){
			if(error){
				// console.error('Asset Check Error: ',error);
				fut['return'](false);
			}else if(result){
				// console.log(url + ' Exists');
				xml = result.content;
				if(xml.search(searchFor)!=-1){
					console.log(searchFor,xml.search(searchFor));
					fut['return'](true);
				}else{
					fut['return'](false);
				}
			}
		});
		return fut.wait();
	},
	articleAssests: function(mongoId){
		// console.log('... articleAssests: Mongo ID ', mongoId);
		var article = articles.findOne({_id : mongoId});
		var assets = {};
		// XML
		var xmlAsset = xmlCollection.findOne({'ids.mongo_id' : mongoId});
		if(xmlAsset && xmlAsset.xml_url){
			assets.xml_url = xmlAsset.xml_url;
		}
		// PDF
		var pdfAsset = pdfCollection.findOne({'ids.mongo_id' : mongoId});
		if(pdfAsset && pdfAsset.pdf_url){
			assets.pdf_url = pdfAsset.pdf_url;
		}
		// console.log(assets);
		return assets;
	},
	assetExistsOnS3: function(url){
		var fut = new future();
		Meteor.http.get(url , function(error,result){
			if(error){
				// console.error('Asset Check Error: ',error);
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