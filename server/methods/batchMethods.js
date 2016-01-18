Meteor.methods({
	batchProcessXml: function(){
		console.log('..batchProcessXml');
		var journalInfo = journalConfig.findOne();
		var journalShortName = journalInfo.journal.short_name;
		var articlesList = articles.find().fetch();
		// console.log(articlesList);
		var missingPii = [];
		var xmlUrl = 'https://s3-us-west-1.amazonaws.com/paperchase-' + journalShortName + '/xml/'
		for(var a=0; a<articlesList.length ; a++){
			if(articlesList[a]['ids']['pii']){
				// console.log('-- PII: ' + articlesList[a]['ids']['pii']);
				// get XML and update DB
				var articleXML = xmlUrl + articlesList[a]['ids']['pii'] + '.xml';
				Meteor.call('fileExistsOnS3', articleXML, function(errExists,exists){
					if(errExists){
						console.error('File Does Not Exist', errExists);
					}else if(exists){
						Meteor.call('parseXmlAfterUpload',articleXML, function(error,result){
							if(error){
								console.error('parseXmlAfterUpload',error);
							}else if(result){
								// maintain PII when batch updating via XML
								var articleInfo = articles.findOne(articlesList[a]['_id']);
								if(articleInfo.ids && articleInfo.ids.pii){
									result.ids.pii = articleInfo.ids.pii;
								}
								Meteor.call('updateArticle',articlesList[a]['_id'], result,function(articleUpdateError,articleUpdate){
									if(articleUpdateError){
										console.error('Could not update article doc: ' + articlesList[a]['_id'], articleUpdateError);
									}else{
										console.log('  '+articlesList[a]['_id'] + ' Updated');
									}
								})
							}
						});
					}
				});
			}else{
				missingPii.push(articlesList[a]['_id']);
			}
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
	allArticlesAddPaperchaseId: function(){
		var articlesList = articles.find().fetch();
		for(var a=0 ; a<articlesList.length ; a++){

			if(articlesList[a]['ids']['pii']){
				articlesList[a]['ids']['paperchase_id'] = articlesList[a]['ids']['pii'];
			}else if(articlesList[a]['ids']['doi']){
				articlesList[a]['ids']['paperchase_id'] = articlesList[a]['ids']['doi'];
			}

			if(articlesList[a]['ids']['paperchase_id']){
				Meteor.call('updateArticle',articlesList[a]['_id'],{'ids' : articlesList[a]['ids']},function(e,r){
					if(e){
						console.error('ERROR. Update Article',e);
					}else if(r){
						console.log('UPDATED');
					}
				});
			}else{
				console.log('..missing IDS. Cannot add paperchase ID: ' + articlesList[a]['_id']);
			}
			// console.log(articlesList[a]['ids']);

		}
	}
});