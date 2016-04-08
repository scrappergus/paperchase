Meteor.methods({
    intiateArticleCollection: function(){
        // console.log('..intiateArticleCollection');
        //for initiating articles collection. PII/PMID/Title sent from crawler
        // first make sure there are 0 docs
        if(articles.find().fetch().length == 0){
            var requestURL =  journalConfig.findOne().api.crawler + '/initiate_articles_collection/' + journalConfig.findOne().journal.short_name;
            Meteor.http.get(requestURL, function(error,result){
                if(error){
                    console.error(error);
                    throw new Meteor.Error(503, 'ERROR: DOI Registered Check' , error);
                }else if(result){
                    // combine with articles DB
                    var articlesList = JSON.parse(result.content);
                    for(var a=0 ; a<articlesList.length ; a++){
                        Meteor.call('addArticle',articlesList[a],function(addError,articleAdded){
                            if(addError){
                                console.error('addError: ' + articlesList[a]['pii'], addError);
                            }else if(articleAdded){
                                console.log('added: '+ articleAdded);
                            }
                        });
                    }
                }else{
                    console.error('Could Not Initiate Articles Collection');
                }
            });
        }
    },
    getAllArticlesDoiStatus: function(){
        // console.log('..getAllArticlesDoiStatus');
        var fut = new future();
        var journalShortName = journalConfig.findOne().journal.short_name;
        var requestURL =  journalConfig.findOne().api.crawler + '/doi_status/' + journalShortName;
        var registerURL = journalConfig.findOne().api.doi;
        // console.log('requestURL = ' + requestURL);
        Meteor.http.get(requestURL, function(error,result){
            if(error){
                console.error(error);
                fut['throw'](error);
                throw new Meteor.Error(503, 'ERROR: DOI Registered Check' , error);
            }else if(result){
                // combine with articles DB
                // console.log('articles',result.content);
                var articlesDoiList = JSON.parse(result.content);

                for(var a=0 ; a<articlesDoiList.length ; a++){
                    articlesDoiList[a]['paperchase'].doiRegisterUrl = registerURL + journalShortName + '/';
                }
                fut['return'](articlesDoiList);
            }
        });

        return fut.wait();
    },
    getAllArticlesPmcXml: function(){
        // console.log('..getAllArticlesPmcXml');
        var fut = new future();
        var requestURL =  journalConfig.findOne().api.crawler + '/crawl_xml/' + journalConfig.findOne().journal.short_name;

        Meteor.http.get(requestURL, function(error,result){
            if(error){
                console.error('getAllArticlesPmcXml',error);
                throw new Meteor.Error(503, 'ERROR: XML to S3' , error);
            }else if(result){
                // console.log('All XML Saved',result);
                // Loop through all articles in response and update the article docs
                articlesList = result.data;
                // console.log('articlesList',articlesList);
                if(articlesList.length > 0){
                    // All article processed on crawler. Now update the article doc and add XML to files.
                    for(var i=0 ; i<articlesList.length ; i++){
                        var updateObj = {};
                        var updateWhere = 'files.xml';
                        updateObj[updateWhere] = articlesList[i]._id + '.xml';
                        Meteor.call('updateArticle',articlesList[i]._id, updateObj, function(updateError,updateResult){
                            if(updateError){
                                console.error(updateError);
                            }else if(updateResult){
                                // console.log('updateResult',updateResult);
                                if(i == parseInt(articlesList.length -1)){
                                    fut['return'](articlesList.length);
                                }
                            }
                        });
                        // updated = xmlCollection.update({'ids.mongo_id': articlesList[i]._id},{$set:articlesList[i]},{upsert: true});
                    }
                }else{
                    // No articles were updated
                    console.error('No article XML was updated in crawl');
                    fut['return'](true);
                }
            }
        });
        return fut.wait();
    },
    getLegacyEpub: function(){
        // use crawler to return JSON of article epub dates from legacy DB
        // then update the articles collection in the paperchase DB
        // console.log('..getLegacyEpub');
        var requestURL =  journalConfig.findOne().api.crawler + '/articles_epub_legacy/' + journalConfig.findOne().journal.short_name;
        // console.log(requestURL);
        Meteor.http.get(requestURL, function(error,articlesListRes){
            if(error){
                console.error(error);
                throw new Meteor.Error(503, 'ERROR: XML to S3' , error);
            }else if(articlesListRes){
                articlesList = articlesListRes.data;
                // console.log('articles = ',articlesList.length);
                for(var i=0 ; i<articlesList.length ; i++){
                    if(articlesList[i]['published']){
                        var pii = articlesList[i]['idarticles'].toString();
                        var epubDate = new Date(articlesList[i]['published'] + ' 00:00:00.0000');
                        // console.log(pii + ': ' + articlesList[i]['published'] + ' : ' + epubDate);
                        articles.update({'ids.pii' : pii},{$set: {'dates.epub' :epubDate}});
                    }
                }
            }
        });
    },
    getCrossRefEpub: function(){
        console.log('..getCrossRefEpub');
        var fut = new future();
        Meteor.call('getAllArticlesDoiStatus',function(error,articlesList){
            if(error){
                console.error('getCrossRefEpub/getAllArticlesDoiStatus', error);
            }else if(articlesList){
                for(var i=0 ; i<articlesList.length ; i++){
                    if(articlesList[i]['crossref_epub_date']){
                        // console.log(articlesList[i]['crossref_epub_date']);
                        // see if Paperchase DB is missing Epub, if so add this date.
                        var articleInfo = articles.findOne(articlesList[i]['paperchase']['_id']);
                        if(articleInfo && articleInfo['dates'] && !articleInfo['dates']['epub']){
                            console.log('MISSING DATE');
                            var convertedDate = Meteor.dates.dashedToDate(articlesList[i]['crossref_epub_date']);
                            // console.log('Update : ' + articlesList[i]['paperchase']['_id'] + ' / ' + convertedDate);
                            articles.update({_id : articlesList[i]['paperchase']['_id']}, {$set: {'dates.epub' : convertedDate}},function(e,r){
                                if(e){
                                    console.error('Update Article Error',e);
                                }else if(r){
                                    console.log(r);
                                }
                            });
                        }else if(articleInfo && articleInfo['dates']){
                            var convertedDate = Meteor.dates.dashedToDate(articlesList[i]['crossref_epub_date']);
                            console.log('Update : ' + articlesList[i]['paperchase']['_id'] + ' / ' + convertedDate);
                            articles.update({_id : articlesList[i]['paperchase']['_id']}, {$set: {'dates.epub' : convertedDate}},function(e,r){
                                if(e){
                                    console.error('Update Article Error',e);
                                }else if(r){
                                    console.log(r);
                                }
                            });
                        }
                    }
                }
            }
        });
        return fut.wait();
    },
    getAllPmcPdf: function(){
        // use crawler to get PDF from PMC, save to S3, does not update db
        console.log('..getAllPmcPdf');
        var fut = new future();
        var crawlPdfUrl = journalConfig.findOne().api.crawler + '/crawl_pdf/' + journalConfig.findOne().journal.short_name;
        // var crawlPdfUrl = 'http://localhost:4932/'+ 'crawl_pdf/' + journalConfig.findOne().journal.short_name;
        // console.log('crawlPdfUrl',crawlPdfUrl);

        var missingInPaperchase = [];
        Meteor.http.get(crawlPdfUrl, function(error,result){
            if(error){
                console.error(error);
                throw new Meteor.Error(503, 'ERROR: PDF to S3' , error);
            }else if(result){
                fut['return'](true);
            }
        });
        return fut.wait();
    },
    fillInViaPubMed: function(){
        console.log('..fillInViaPubMed');
        var fut = new future();
        var requestURL =  journalConfig.findOne().api.crawler + '/fill_in_articles_from_pubmed/' + journalConfig.findOne().journal.short_name;
        // var requestURL =  'http://localhost:4932' + '/fill_in_articles_from_pubmed/' + journalConfig.findOne().journal.short_name;

        Meteor.http.get(requestURL, function(error,result){
            if(error){
                console.error('fillInViaPubMed',error);
                throw new Meteor.Error(503, 'ERROR: fillInViaPubMed' , error);
            }else if(result){
                missingInDb = result.data.missingInPaperchase;
                inDbUpdate = result.data.paperchaseUpdatePmid; // No PMID saved but matched via PII
                inDbMissingPmid = result.data.paperchaseWithoutPmid;
                console.log('missingInDb',missingInDb.length);
                console.log('inDbUpdate',inDbUpdate.length);
                console.log('inDbMissingPmid',inDbMissingPmid);
                if(missingInDb.length > 0){
                    for(var i=0 ; i<missingInDb.length ; i++){
                        if(missingInDb[i]){ // need to check for existence because could be null when object move to inDbUpdate array in crawler
                            if(missingInDb[i].dates && missingInDb[i].dates.epub){
                                missingInDb[i].dates.epub = new Date(missingInDb[i].dates.epub);
                            }
                            Meteor.call('addArticle',missingInDb[i],function(addError,articleAdded){
                                if(addError){
                                    console.error('addError: ', addError);
                                }else if(articleAdded){
                                    console.log('added: '+ articleAdded);
                                }
                            });
                        }
                    }
                }
                if(inDbUpdate.length > 0){
                    inDbUpdate.forEach(function(articleToUpdate){
                        var updateObj = {};
                        // console.log(articleToUpdate.ids);
                        updateObj['ids.pmid'] = articleToUpdate.ids.pmid;
                        if(articleToUpdate.ids.pmc){
                            updateObj['ids.pmc'] = articleToUpdate.ids.pmc;
                            console.log(updateObj);
                            Meteor.call('updateArticle', articleToUpdate.ids.mongo_id, updateObj,function(updateError,articleUpdated){
                                if(updateError){
                                    console.error('updateError: ' + inDbUpdate[i].pmid, inDbUpdate);
                                }else if(articleUpdated){
                                    console.log('updated: '+ articleUpdated);
                                }
                            });
                        }
                    });
                }
            }
        });
        return fut.wait();
    },
    pubMedAndPmcAudit: function(){
        // console.log('..pubMedAndPmcAudit');
        var fut = new future();
        var journalShortName = journalConfig.findOne().journal.short_name;
        var baseRequestUrl =  journalConfig.findOne().api.crawler + '/ncbi/article_count';
        // console.log(baseRequestUrl);
        var result = {};
        var baseRequestUrlPubMed = baseRequestUrl + '/pubmed/' + journalShortName;
        var baseRequestUrlPmc = baseRequestUrl + '/pmc/' + journalShortName;
        Meteor.http.get(baseRequestUrlPubMed, function(pubMedError,pubMedResult){
            if(pubMedError){
                throw new Meteor.Error(503, 'pubMedAndPmcAudit PubMed' , pubMedError);
            }else if(pubMedResult){
                result.pubmed = pubMedResult.content;
                Meteor.http.get(baseRequestUrlPmc, function(pmcError,pmcResult){
                    if(pmcError){
                        throw new Meteor.Error(503, 'pubMedAndPmcAudit PMC' , pmcError);
                    }else if(pmcResult){
                        result.pmc = pmcResult.content;
                        fut['return'](result);
                    }
                });
            }
        });
        return fut.wait();
    },
    doiRegisteredCheck: function(mongoId, pii){
        var fut = new future();
        var journalShortName = journalConfig.findOne().journal.short_name;
        var requestUrl = journalConfig.findOne().api.crawler + '/article/' + journalShortName + '/' + pii + '/doi_status';

        Meteor.http.get(requestUrl, function(error,result){
            if(error){
                throw new Meteor.Error('doiRegisteredCheck' , pii, error);
            }else if(result){
                if(result.data.registered == 'Registered'){
                    Meteor.call('updateArticle', mongoId, {'ids.doi' : result.data.doi}, function(error,result){
                        if(result){
                            fut['return']('Registered');
                        }else if(error){
                            fut['return'](error);
                        }
                    });
                }else{
                    fut['return']('Not Registered');
                }
            }
        });
        return fut.wait();
    }
});