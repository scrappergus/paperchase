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
		var baseAssetsUrl = journalConfig.findOne().assets;
		var assets = {};
		// XML
		var xmlAsset = xmlCollection.findOne({'ids.mongo_id' : mongoId});
		if(xmlAsset && xmlAsset.file){
			assets.xml_url = baseAssetsUrl + 'xml/' + xmlAsset.file;
			// var xmlPathPieces = xmlAsset.filename.split('/');
			// assets.xml_filename = xmlPathPieces[parseInt(xmlPathPieces.length - 1)];
		}
		// PDF
		var pdfAsset = pdfCollection.findOne({'ids.mongo_id' : mongoId});
		if(pdfAsset && pdfAsset.file){
			assets.pdf_url = baseAssetsUrl + 'pdf/' +  pdfAsset.file;
			// var pdfPathPieces = pdfAsset.filename.split('/');
			// assets.pdf_filename = pdfPathPieces[parseInt(pdfPathPieces.length - 1)];
		}
		// Figures
		var figureAssets = figCollection.findOne({'ids.mongo_id' : mongoId});
		if(figureAssets && figureAssets.figures.length > 0){
			assets.figures = figureAssets.figures;
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
		console.log('..updateAssetDoc',assetType, articleMongoId, assetData);
		// NOTE: update query is failing with nested ID. So query for asset mongo ID first.

		var fut = new future();
		if(assetType == 'pdf'){
			var assetDoc = pdfCollection.findOne({'ids.mongo_id' : articleMongoId});
			var assetDocId;
			if(assetDoc){
				assetDocId = assetDoc._id;
			}
			pdfCollection.update({_id : assetDocId},assetData, {upsert:true}, function(updateError,updateRes){
				if(updateError){
					console.error('updateError',updateError);
					return;
				}else if(updateRes){
					fut['return']('PDF');
				}
			});
		}else if(assetType == 'xml'){
			var assetDoc = xmlCollection.findOne({'ids.mongo_id' : articleMongoId});
			var assetDocId;
			if(assetDoc){
				assetDocId = assetDoc._id;
			}
			xmlCollection.update({_id : assetDocId},assetData, {upsert:true}, function(updateError,updateRes){
				if(updateError){
					console.error('updateError',updateError);
					return;
				}else if(updateRes){
					fut['return']('XML');
				}
			});
		}
		return fut.wait();
	},
	renameArticleAsset: function(folder, originalFileName, articleMongoId){
		// console.log('renameArticleAsset')
		var fut = new future();
		var newFileName = articleMongoId + '.' + folder;
		var source = folder + '/' + originalFileName;
		var dest = folder + '/' + newFileName;
		S3.knox.copyFile(source, dest, function(err, res){
			if(err){
				console.error('renameArticleAsset',err);
				// fut['throw'](err);
			}else if(res){
				// console.log(res.statusCode);
				// return newFileName;
				fut['return'](newFileName);
			}
		});
		return fut.wait();
	}
});