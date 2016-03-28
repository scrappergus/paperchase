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
	// articleAssests: function(mongoId){
	// 	// console.log('... articleAssests: Mongo ID ', mongoId);
	// 	var article = articles.findOne({_id : mongoId});
	// 	var baseAssetsUrl = journalConfig.findOne().assets;
	// 	var assets = {};
	// 	// XML
	// 	var xmlAsset = xmlCollection.findOne({'ids.mongo_id' : mongoId});
	// 	if(xmlAsset && xmlAsset.file){
	// 		assets.xml = xmlAsset;
	// 		assets.xml.url = baseAssetsUrl + 'xml/' + xmlAsset.file;
	// 		// assets.xml_settings = xmlAsset.settings;
	// 	}
	// 	// PDF
	// 	var pdfAsset = pdfCollection.findOne({'ids.mongo_id' : mongoId});
	// 	if(pdfAsset && pdfAsset.file){
	// 		assets.pdf = pdfAsset;
	// 		assets.pdf.url = baseAssetsUrl + 'pdf/' +  pdfAsset.file;
	// 		// assets.pdf_settings = pdfAsset.settings;
	// 	}
	// 	// Figures
	// 	var figureAssets = figCollection.findOne({'ids.mongo_id' : mongoId});
	// 	if(figureAssets && figureAssets.figures.length > 0){
	// 		var figs = figureAssets.figures;
	// 		figs.forEach(function(fig){
	// 			fig.url = baseAssetsUrl + 'paper_figures/' + fig.file;
	// 		});
	// 		assets.figures = figureAssets.figures;
	// 	}
	// 	assets.article_mongo_id = mongoId;
	// 	// console.log(assets);
	// 	return assets;
	// },
	assetExistsOnS3: function(url){
		var fut = new future();
		Meteor.http.get(url , function(error,result){
			if(error){
				// console.error('Asset Check Error: ',error);
				fut['return'](false);
			}else if(result){
				if(result.headers['content-length'] == '15739'){
					fut['return'](false);
					// these are not real PDFs, they failed to upload, so do not add these filenames to the article doc
				}else{
					fut['return'](true);
				}
			}
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