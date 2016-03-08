Meteor.methods({
	batchDoiRegisteredCheck: function(){
		var fut = new future();
		var articlesList = articles.find({'ids.doi' : {$exists:false}}).fetch();
		var updated = 0;
		///article/:journalname/:pii/doi_status
		for(var a=0 ; a<articlesList.length ; a++){
			if(articlesList[a].ids && articlesList[a].ids.pii){
				Meteor.call('doiRegisteredCheck', articlesList[a]._id,  articlesList[a].ids.pii, function(error,result){
					if(error){
						throw new Meteor.Error('doiRegisteredCheck' , pii, error);
					}else if(result == 'Registered'){
						updated++;
						// console.log(result);
					}
					if(a == parseInt(articlesList.length -1)){
						fut['return'](updated + ' DOIs Saved'); //return string in case 0 articles updated. will be false otherwise
					}
				});
			}
		}
		return fut.wait();
	},
	batchProcessXml: function(){
		console.log('..batchProcessXml');
		var journalInfo = journalConfig.findOne();
		var journalShortName = journalInfo.journal.short_name;
		var articlesList = articles.find({}).fetch();
		// console.log(articlesList);
		var missingPii = [];
		var xmlUrl = 'https://s3-us-west-1.amazonaws.com/paperchase-' + journalShortName + '/xml/'
		for(var a=0; a<articlesList.length ; a++){
		// for(var a=0; a< 1; a++){
			console.log('-- ' + a);
			// console.log(articlesList[a]);

			// console.log('-- ' + JSON.stringify(articlesList[a]['ids']));
			// get XML and update DB
			// TODO: Use xml collection to get URL
			var articleXML = xmlUrl + articlesList[a]._id + '.xml';
			// console.log('articleXML',articleXML);
			Meteor.call('parseXmlAfterUpload',articleXML, function(error,result){
				if(error){
					console.error('parseXmlAfterUpload',error);
				}else if(result){
					// console.log('result',result);
					// maintain PII when batch updating via XML
					var articleInfo = articles.findOne(articlesList[a]['_id']);
					if(articleInfo.ids && articleInfo.ids.pii){
						result.ids.pii = articleInfo.ids.pii;
					}
					result.ids = articleInfo.ids;
					Meteor.call('updateArticle',articlesList[a]['_id'], result,function(articleUpdateError,articleUpdate){
						if(articleUpdateError){
							console.error('Could not update article doc: ' + articlesList[a]['_id'], articleUpdateError);
						}else{
							console.log('  '+articlesList[a]['_id'] + ' Updated');
						}
					});
				}
			});

			if(parseInt(articlesList.length-1) == a){
				// console.log('MISSING PII',missingPii);
			}
		}
	},
	batchUpdateXml: function(journal,cb){
		// crawl all journal XML and upload to S3
		// THIS IS DEPRECATED. Moved to crawler.
		// var fut = new future();
		// console.log('..batchUpdateXml : ' + journal);
		// var xmlCrawlUrl = journalConfig.findOne().api.crawler_xml; // LIVE
		// // console.log('xmlCrawlUrl = ' + xmlCrawlUrl);
		// // var xmlCrawlUrl = 'http://localhost:4932/crawl_xml'; // LOCAL
		// var res,
		// 	articlesList;
		// Meteor.http.get(xmlCrawlUrl + '/' + journal,function(err, res) {
		// 	if(err){
		// 		// console.error('ERROR');
		// 		// console.error(err);
		// 		fut['throw'](err);
		// 		throw new Meteor.Error(503, 'ERROR: Crawl XML' , err);
		// 	}
		// 	if(res && res.data){
		// 		// Loop through all articles in response and update the xml collection in the DB
		// 		articlesList = res.data;
		// 		var updatedCount = 0;
		// 		if(articlesList.length > 1){
		// 			for(var i=0 ; i<articlesList.length ; i++){

		// 				var updated;
		// 				if(articlesList[i]){
		// 					console.log(JSON.stringify(articlesList[i]));
		// 					// console.log()
		// 					var articleIds = articlesList[i]['ids'];
		// 					updated = xmlCollection.update({ids: {'$in': articleIds}},{$set:articlesList[i]},{upsert: true});
		// 				}
		// 				// keep track of successful updates
		// 				if(updated){
		// 					updatedCount++;
		// 				}
		// 				if (i == parseInt(articlesList.length-1) && updatedCount == articlesList.length){
		// 					// if last article and all succesfully updated
		// 					fut['return'](true);
		// 				}else if(i == parseInt(articlesList.length-1)){
		// 					// if last article and not all succesfully updated
		// 					var errorMessage = 'total = ' + articlesList.length + ', updated = ' + updated;
		// 					console.error('ERROR : ' + errorMessage);
		// 					fut['throw'](errorMessage);
		// 					throw new Meteor.Error(500, 'Error 500: Not all articles updated in database', errorMessage);
		// 				}
		// 			}
		// 		}else{
		// 			// No articles were updated
		// 			console.error('No article XML was updated in crawl');
		// 			fut['return'](true);
		// 		}

		// 	}
		// });
		// return fut.wait();
	},
	batchDoiList: function(){
		var fut = new future();
		// will query for PMID list for journal (based on ISSN). Then check if article has DOI at PubMed, if not then include in output.
		console.log('...batchDoiList');
		Meteor.call('getAllArticlesFromPubMed',function(error,articleList){
			if(error){
				throw new Meteor.Error(500, 'batchDoiList: Cannot get list of PMID from PubMed based on ISSN' , error);
			}
			if(articleList){
				fut['return'](true);
				// articlesList = pre2015Oncotarget;
				// PMID list returned. Now check if DOI at PubMed already
				var prethis2015 = [];
				var missingDoi = [];
				var missingPii = [];
				var missingDate = [];
				for(var i=0 ; i<articleList.length ; i++){
					// console.log('--- ' + i + ' : ' +articleList[i]);
					// get articles before 2015
					// Begin -------------------------
					Meteor.call('getPubDateFromPmid',articleList[i],function(err,pubDate){
						if(err){
							console.error(err);
						}
						if(pubDate){
							if(pubDate.indexOf('2015') == -1){
								prethis2015.push(articleList[i]);
							}
						}else{
							console.log('no pubdate');
							missingDate.push(articleList[i]);
						}
					});
					// End -------------------------


					// check that articles do not already have DOI
					// Begin -------------------------
					// Meteor.call('getDoiFromPmid',pre2015Oncotarget[i],function(e,doi){
					// 	if(e){
					// 		console.error(e);
					// 	}
					// 	if(doi){
					// 		console.log('DOI: ' + doi);
					// 	}else{
					// 		missingDoi.push(pre2015Oncotarget[i]);
					// 	}
					// });
					// End -------------------------

					// Get PII for tet file
					// Begin -------------------------
					// Meteor.call('getPiiFromPmid',pre2015Oncotarget[i],function(e,pii){
					// 	if(e){
					// 		console.error(e);
					// 	}
					// 	if(pii){
					// 		console.log(pre2015Oncotarget[i] + '            10.18632/oncotarget.'+ pii);
					// 	}else{
					// 		missingPii.push(pre2015Oncotarget[i]);
					// 	}
					// });
					// End -------------------------

					if(i == parseInt(articleList.length-1)){
						// console.log('prethis2015');console.log(prethis2015);
						// console.log('missingDoi');console.log(missingDoi);
						// console.log('missingPii');console.log(missingPii);
						console.log('missingDate');console.log(missingDate);

						// create output for text file
						// for(var a=0 ; a< pre2015Oncotarget.length ; a++){
						// 	console.log(pre2015Oncotarget[i] + '            ')
						// }
					}
				}
			}
		});
		return fut.wait();
	},
	checkAllArticlesAssets: function(assetType){
		console.log('..checkAllArticlesAssets : ' + assetType);
		var fut = new future();
		var journalInfo = journalConfig.findOne();
		var journalShortName = journalInfo.journal.short_name;
		var articlesList = articles.find().fetch();
		var missingAssets = [];
		var assetBaseUrl = 'http://s3-us-west-1.amazonaws.com/paperchase-' + journalShortName + '/' + assetType + '/';
		for(var i = 0 ; i < articlesList.length; i++){
		// for(var i = 0 ; i <1; i++){
			var articleMongoId = articlesList[i]._id;
			var assetUrl = assetBaseUrl + articleMongoId + '.' + assetType;
			console.log(i, articlesList[i]._id,assetUrl);
			Meteor.call('assetExistsOnS3',assetUrl,function(error,result){
				if(result){
					var assetData = {
						'ids' : articlesList[i].ids
					}
					assetData.ids.mongo_id = articleMongoId;
					assetData[assetType + '_url'] = assetUrl;
					// console.log(articleMongoId,assetData);
					Meteor.call('updateAssetDoc',assetType, articleMongoId, assetData, function(updateError,updateResult){
						if(updateError){
							console.error(updateError);
						}else if(updateResult){
							console.log('updateResult',updateResult);
						}
					});
				}else{
					missingAssets.push(articleMongoId);
				}
			});
			if(i == parseInt(articlesList.length - 1)){
				// console.log('missingAssets',missingAssets);
				fut['return'](missingAssets);
			}

		}
		return fut.wait();
	},
	batchRealXml: function(){
		console.log('..batchRealXml : ');
		var fut = new future();
		var journalInfo = journalConfig.findOne();
		var journalShortName = journalInfo.journal.short_name;
		// var articlesList = articles.find({_id : {$in: notreal}}).fetch();
		var blobCount = 0;
		var okCount = 0;
		var missingCount = 0;
		var articlesList = articles.find().fetch();
		var csvString = 'Mongo ID, PII, PMID, PMC, Volume, Issue, Status\n';
		var assetBaseUrl = 'http://s3-us-west-1.amazonaws.com/paperchase-' + journalShortName + '/xml/';
		for(var i = 0 ; i < articlesList.length; i++){
		// for(var i = 0 ; i < 10; i++){
			// if(articlesList[i].ids.pii && articlesList[i].ids.pii == '10.1177_1947601913501075'){
			var articleMongoId = articlesList[i]._id;
			var assetUrl = assetBaseUrl + articleMongoId + '.xml';
			console.log(i, articlesList[i]._id, assetUrl);
			Meteor.call('fullTextXmlReal',assetUrl,function(error,result){
				csvString += articlesList[i]._id + ',';
				if(articlesList[i].ids.pii){
					csvString += articlesList[i].ids.pii;
				}else{
					csvString += '';
				}
				csvString += ',';

				if(articlesList[i].ids.pmid){
					csvString += articlesList[i].ids.pmid;
				}else{
					csvString += '';
				}
				csvString += ',';

				if(articlesList[i].ids.pmc){
					csvString += articlesList[i].ids.pmc;
				}else{
					csvString += '';
				}
				csvString += ',';

				if(articlesList[i].volume){
					csvString += articlesList[i].volume;
				}else{
					csvString += '';
				}
				csvString += ',';

				if(articlesList[i].issue){
					csvString += 'Issue' + articlesList[i].issue; //add string so that excel does not parse dashed issues as dates
				}else{
					csvString += '';
				}
				csvString += ',';

				if(result && result.sections.length < 2){
					csvString += 'Blob'; //TODO: could just be paragraphs within body.
					blobCount++;
					// console.log(articlesList[i]._id, articlesList[i].ids.pii, ' Blob', result);
					// result is lenght of body sections. if 1 then we cannot use this xml
				}else if(result && result.sections.length >1){
					csvString += 'Ok';
					okCount++;
				}else{
					csvString += 'Missing';
					missingCount++;
				}

				csvString += '\n';
			});
			// }
			if(i == parseInt(articlesList.length - 1)){
				console.log('csvString',csvString);
				console.log('missing ',missingCount, '. ok =', okCount,'. blob =', blobCount);
				fut['return'](csvString);
			}

		}
		return fut.wait();
	},
	batcharticlesWith: function(searchFor){
		// console.log('..batcharticlesWith : ' + searchFor);
		var fut = new future();
		var journalInfo = journalConfig.findOne();
		var journalShortName = journalInfo.journal.short_name;
		var articlesList = articles.find().fetch();
		var found = [];
		var assetBaseUrl = 'http://s3-us-west-1.amazonaws.com/paperchase-' + journalShortName + '/xml/';
		for(var i = 0 ; i < articlesList.length; i++){
		// for(var i = 0 ; i < 10; i++){
			var articleMongoId = articlesList[i]._id;
			var assetUrl = assetBaseUrl + articleMongoId + '.xml';
			console.log(i, articlesList[i]._id,assetUrl);
			Meteor.call('articlesWith',assetUrl,searchFor,function(error,result){
				if(result){
					// console.log('yes');
					found.push(articleMongoId);
				}
			});
			if(i == parseInt(articlesList.length - 1)){
				// console.log('found',found);
				fut['return'](found);
			}

		}
		return fut.wait();
	},
	getMissingPmidPmcViaPii: function(){
		console.log('..getMissingPmidPmcViaPii');
		var fut = new future();
		var apiBase = journalConfig.findOne().api.crawler;
		var journalShortName = journalConfig.findOne().journal.short_name;
		var urlApi =  apiBase + '/pubmed/ids_via_pii/' + journalShortName;
		var missingIdList = articles.find({ $or: [ { 'ids.pmc' : {$exists:false} }, { 'ids.pmid' : {$exists:false} } ] }).fetch();
		// var pubMedByPii = {};

		console.log('  Paperchase missingIdList length = ',missingIdList.length);
		if(missingIdList.length > 0 ){
			// deprecated. takes too long to query entire archive  a pubmed.
			// Meteor.http.get(urlApi,{timeout : 50000}, function(error,result){
			// 	if(error){
			// 		console.error('getMissingPmidPmc',error);
			// 	}else if(result){
			// 		var pubMedList = result.data; // result = all titles and all IDs at PubMed for journal
			// 		console.log('  pubMedList length = ',pubMedList.length);
			// 		pubMedList.forEach(function(pubMedArticle) {
			// 			if(pubMedArticle.ids.pii){
			// 				pubMedByPii[pubMedArticle.ids.pii] = pubMedArticle;
			// 			}
			// 		});
			// 		missingIdList.forEach(function(article){
			// 			if(article.ids.pii && pubMedByPii[article.ids.pii]){
			// 				var updateObj = {};
			// 				if(!article.ids.pmc && pubMedByPii[article.ids.pii].ids.pmc){
			// 					updateObj['ids.pmc'] = pubMedByPii[article.ids.pii].ids.pmc;
			// 				}
			// 				if(!article.ids.pmid && pubMedByPii[article.ids.pii].ids.pmid){
			// 					updateObj['ids.pmid']= pubMedByPii[article.ids.pii].ids.pmid;
			// 				}

			// 				Meteor.call('updateArticle', article._id, updateObj, function(updateError,updateRes){
			// 					if(updateError){
			// 						console.error('PMC/PMID ID update',updateError);
			// 					}
			// 				});
			// 			}
			// 		});
			// 	}
			// });
			missingIdList.forEach(function(article){
				if(article.ids.pii){
					console.log('.. PII ' + article.ids.pii);
					var urlApiByPii = urlApi + '/' + article.ids.pii;
					Meteor.http.get(urlApiByPii, function(error,result){
						if(error){
							console.error('urlApiByPii',error);
						}else if(result){
							var pubMedArticle = result.data;
							var updateObj = {};
							if(!article.ids.pmc && pubMedArticle.ids.pmc){
								updateObj['ids.pmc'] = pubMedArticle.ids.pmc;
							}
							if(!article.ids.pmid && pubMedArticle.ids.pmid){
								updateObj['ids.pmid']= pubMedArticle.ids.pmid;
							}
							Meteor.call('updateArticle', article._id, updateObj, function(updateError,updateRes){
								if(updateError){
									console.error('PMC/PMID ID update error',updateError);
								}
							});
						}
					});
				}
			});
		}else{
			fut['return'](true);
		}
		return fut.wait();
	},
	getMissingPubMedIds: function(){
		// var fut = new future();
		var apiBase = journalConfig.findOne().api.crawler;
		var journalShortName = journalConfig.findOne().journal.short_name;
		var urlApi =  apiBase + '/pubmed/ids_via_pii/' + journalShortName;
		var missingList = articles.find({'ids.pmid' : {$exists:false},'ids.pii' : {$exists:true}},{_id : 1,ids:1}).fetch();
		for(var i=0 ; i<missingList.length ; i++ ){
			if(missingList[i].ids.pii){
				var urlApiByPii = urlApi + '/' + missingList[i].ids.pii;
				Meteor.http.get(urlApiByPii, function(error,result){
					if(error){
						console.error('Get PubMed ID error',error);
					}else if(result){
						articleData = result.data;
						if(articleData && articleData.ids.pmid){
							console.log(articleData);
							Meteor.call('updateArticleBy', {'ids.pii' : articleData.ids.pii}, {'ids.pmid': articleData.ids.pmid}, function(updateError,updateResult){
								if(updateError){
									console.error('Update Article',updateError);
								}else if(updateResult){

								}
							});
						}
					}
				});
			}

		}
		// return fut.wait();
	},
	getMissingPmcIds: function(){
		var fut = new future();
		var apiBase = journalConfig.findOne().api.crawler;
		var missingPmcList = articles.find({'ids.pmc' : {$exists:false},'ids.pmid' : {$exists:true}},{_id : 1}).fetch();
		for(var i=0 ; i<missingPmcList.length ; i++ ){
			var urlApi =  apiBase + '/article_ids_via_pmid/' + missingPmcList[i].ids.pmid;
			Meteor.http.get(urlApi, function(error,result){
				if(error){
					console.error('Get PMC ID error',error);
				}else if(result){
					articleData = result.data;
					// console.log(articleData);
					if(articleData.ids.pmc){
						Meteor.call('updateArticleByPmid', articleData.ids.pmid, {'ids.pmc': articleData.ids.pmc}, function(updateError,updateResult){
							if(updateError){
								console.error('Update Article',updateError);
							}else if(updateResult){

							}
						});
					}

				}
			});
		}
		return fut.wait();
	},
	getPubMedInfo: function(){
		// console.log('..getPubMedInfo');
		var totalUpdate = 0;
		var totalMissing = 0;
		var tracker = 0;
		var fut = new future();
		var apiBase = journalConfig.findOne().api.crawler;
		// var apiBase = 'http://localhost:4932';
		var urlApi =  apiBase + '/article_info_via_pmid/';

		var missingByMongo = {};
		var missingVolList = articles.find({volume : {$exists:false},'ids.pmid' : {$exists:true}},{_id : 1}).fetch();
		var missingIssList = articles.find({issue : {$exists:false},'ids.pmid' : {$exists:true}},{_id : 1}).fetch();

		missingVolList.forEach(function(article){
			missingByMongo[article._id] = article;
			totalMissing++;
		});
		missingIssList.forEach(function(article){
			if(!missingByMongo[article._id]){
				missingByMongo[article._id] = article;
				totalMissing++;
			}
		});

		for(mongoId in missingByMongo){
			// console.log(mongoId);
			var url = urlApi + missingByMongo[mongoId].ids.pmid;
			Meteor.http.get( url, function(error,result){
				if(result){
					// console.log(url, result);
					var articleData = JSON.parse(result.content);
					var updateObj = {};
					if(articleData.volume){
						updateObj.volume;
					}
					if(articleData.issue){
						updateObj.issue;
					}
					Meteor.call('updateArticleByPmid', articleData.ids.pmid, articleData, function(updateError,updateResult){
						if(updateError){
							console.error('Update Article',updateError);
						}else if(articleData.volume && updateResult){
							// console.log('++');
							totalUpdate++;
						}
						tracker++;
						if(tracker == totalMissing){
							var result = totalMissing + ' total articles missing Volume/Issue. ' + totalUpdate + ' Articles were updated.'
							fut['return'](result);
						}
					});
				}
			});
		}
		return fut.wait();
	},
	getMissingAssets: function(){
		console.log('..getMissingAssets');
		var articlesList = articles.find({},{_id : 1}).fetch();
		console.log('__article count = ' + articlesList.length);
		var pdfFetch = pdfCollection.find({},{'ids.mongo_id' : 1}).fetch();
		var xmlFetch = xmlCollection.find({},{'ids.mongo_id' : 1}).fetch();
		var journalShortName = journalConfig.findOne().journal.short_name;
		var crawlUrl = journalConfig.findOne().api.crawler;
		var pdfList = {};
		var xmlList = {};
		var missing = {};
		missing.pdf = [];
		missing.xml = [];
		missing.no_pmc = [];
		for(var pdfIdx=0 ; pdfIdx<pdfFetch.length ; pdfIdx++){
			pdfList[pdfFetch[pdfIdx].ids.mongo_id] = true;
		}
		for(var xmlIdx=0 ; xmlIdx<xmlFetch.length ; xmlIdx++){
			xmlList[xmlFetch[xmlIdx].ids.mongo_id] = true;
		}
		// TODO: add check for if asset on S3 but DB just does not have it. Avoid reuploading assets via PMC.
		for(var a = 0 ; a < articlesList.length ; a++){
			if(articlesList[a].ids.pmc){
				if(!pdfList[articlesList[a]._id]){
					missing.pdf.push(articlesList[a]._id);
				}
				if(!xmlList[articlesList[a]._id]){
					missing.xml.push(articlesList[a]._id);
				}
			}else{
				missing.no_pmc.push(articlesList[a]._id);
			}

			if(a == parseInt(articlesList.length-1)){
				// console.log('missing',missing);
				console.log('___Fetch XML count = ' + missing.xml.length);
				console.log('___Fetch PDF count = ' + missing.pdf.length);
				console.log('___NO PMC ID = ', missing.no_pmc.length);
				// console.log(missing.pdf);
				if(missing.xml.length > 0){
					for(var i=0 ; i<missing.xml.length ; i++){
						var xmlUrlApi = crawlUrl + '/get_article_pmc_xml/' + journalShortName + '/' + missing.xml[i];
						Meteor.http.get(xmlUrlApi , function(error,result){
							if(error){
								console.error('Asset Error: ',error);
							}else if(result){
								var assetData = result.data;
								// console.log('Uploaded',assetData);
								if(assetData && assetData.ids){
									Meteor.call('updateAssetDoc','xml', assetData.ids.mongo_id , assetData, function(updateXmlError, updateXmlRes){
										if(updateXmlError){
											console.error('updateXmlError',updateXmlError);
										}else if(updateXmlRes){

										}
									});
								}
							}
						});
					}
				}
				if(missing.pdf.length > 0){

					for(var i=0 ; i<missing.pdf.length ; i++){
						var pdfUrlApi = crawlUrl + '/get_article_pmc_pdf/' + journalShortName + '/' + missing.pdf[i];
						Meteor.http.get(pdfUrlApi , function(error,result){
							if(error){
								console.error('Asset Error: ',error);
							}else if(result){
								var assetData = result.data;
								// console.log('Uploaded',assetData);
								if(assetData && assetData.ids){
									Meteor.call('updateAssetDoc','pdf', assetData.ids.mongo_id , assetData, function(updatePdfError, updatePdfRes){
										if(updatePdfError){
											console.error('updatePdfError',updatePdfError);
										}else if(updatePdfRes){
										}
									});
								}
							}
						});
					}
				}
			}
		}
	}
});