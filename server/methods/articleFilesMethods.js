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
	allArticlesFilesAudit: function(){
		var result = {};
		var allArticles = articles.find({},{_id : 1, files : 1}).fetch();
		var articlesWithoutPmc = articles.find({'ids.pmc' : {$exists:false}},{_id : 1}).fetch();
		var articlesWithoutPmid = articles.find({'ids.pmid' : {$exists:false}},{_id : 1}).fetch();
		var pdfList = articles.find({'files.pdf' : {$exists:true}},{_id : 1}).fetch();
		var xmlList = articles.find({'files.xml' : {$exists:true}},{_id : 1}).fetch();
		result.articles = allArticles.length;
		result.articles_without_pmc = articlesWithoutPmc.length;
		result.articles_without_pmid = articlesWithoutPmid.length;
		result.pdf = pdfList.length;
		result.xml = xmlList.length;
		return result;
	}
});