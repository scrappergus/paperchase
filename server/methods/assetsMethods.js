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
			assets.xml = xmlAsset;
			assets.xml.url = baseAssetsUrl + 'xml/' + xmlAsset.file;
			// assets.xml_settings = xmlAsset.settings;
		}
		// PDF
		var pdfAsset = pdfCollection.findOne({'ids.mongo_id' : mongoId});
		if(pdfAsset && pdfAsset.file){
			assets.pdf = pdfAsset;
			assets.pdf.url = baseAssetsUrl + 'pdf/' +  pdfAsset.file;
			// assets.pdf_settings = pdfAsset.settings;
		}
		// Figures
		var figureAssets = figCollection.findOne({'ids.mongo_id' : mongoId});
		if(figureAssets && figureAssets.figures.length > 0){
			var figs = figureAssets.figures;
			figs.forEach(function(fig){
				fig.url = baseAssetsUrl + 'paper_figures/' + fig.file;
			});
			assets.figures = figureAssets.figures;
		}
		assets.article_mongo_id = mongoId;
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
		// NOTE: update query is failing with nested ID. So query for asset mongo ID first.

		var fut = new future();
		if(assetType == 'pdf'){
			var assetDoc = pdfCollection.findOne({'ids.mongo_id' : articleMongoId});
			var assetSettings = assetDoc.settings;
			var assetDocId;
			if(assetDoc){
				assetDocId = assetDoc._id;
			}
			if(!assetData.settings){
				assetData.settings = assetSettings; //maintain saved settings
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
			var assetSettings = assetDoc.settings;
			var assetDocId;
			if(assetDoc){
				assetDocId = assetDoc._id;
			}
			if(!assetData.settings){
				assetData.settings = assetSettings; //maintain saved settings
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
	updateAssetSettings: function(articleMongoId, pdfSettings, xmlSettings){
		// console.log('updateAssetSettings',articleMongoId);
		// console.log('pdfSettings', pdfSettings);
		// console.log('xmlSettings', xmlSettings);
		// NOTE: update query is failing with nested ID. So query for asset mongo ID first.
		var fut = new future();
		var pdfAssetDoc = pdfCollection.findOne({'ids.mongo_id' : articleMongoId});
		var pdfAssetDocId;
		if(pdfAssetDoc){
			pdfAssetDocId = pdfAssetDoc._id;
		}
		var xmlAssetDoc = xmlCollection.findOne({'ids.mongo_id' : articleMongoId});
		var xmlAssetDocId;

		if(xmlAssetDoc){
			xmlAssetDocId = xmlAssetDoc._id;
		}

		pdfCollection.update({_id : pdfAssetDocId}, {$set: {settings : pdfSettings}}, {upsert:false}, function(updateError,updateRes){
			// pdfQueried = true;
			if(updateError){
				console.error('PDF settings updateError',updateError);
				return;
			}
			xmlCollection.update({_id : xmlAssetDocId}, {$set: {settings : xmlSettings}}, {upsert:false}, function(updateError,updateRes){
				xmlQueried = true;
				if(updateError){
					console.error('XML settings updateError',updateError);
					return;
				}
				fut['return'](true);
			});
		});

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
	},
	renameArticleFigure: function(originalFileName, figureId, articleMongoId){
		// console.log('renameArticleFigure',originalFileName, figureId, articleMongoId)
		var fut = new future();
		var originalFilePieces = originalFileName.split('.');
		var fileType = originalFilePieces[parseInt(originalFilePieces.length - 1)];
		// todo fig. 1b handing, letter in id
		var newFileName = articleMongoId + '_' + figureId + '.' + fileType;
		var source = 'paper_figures/' + originalFileName;
		var dest = 'paper_figures/' + newFileName;
		// console.log('source',source);
		// console.log('dest',dest);
		S3.knox.copyFile(source, dest, function(err, res){
			if(err){
				console.error('renameArticleAsset',err);
				// fut['throw'](err);
			}else if(res){
				// console.log('status',res.statusCode);
				// return newFileName;
				fut['return'](newFileName);
			}
		});
		return fut.wait();
	},
	updateFiguresDoc: function(articleMongoId, articleFigures){
		var figMongoId;
		var articleInfo = articles.findOne({_id: articleMongoId}); //keep fig doc up to date with article doc, or if new fig then include
		var articleIds = articleInfo.ids;
		articleIds.mongo_id = articleInfo._id;
		var figInfo = figCollection.findOne({'ids.mongo_id' : articleMongoId});
		if(figInfo){
			figMongoId = figInfo._id;
		}
		return figCollection.update({_id : figMongoId},{$set: {figures: articleFigures, ids: articleIds}}, {upsert:true});
	}
});