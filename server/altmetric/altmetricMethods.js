Meteor.methods({
    getAltmetricTop : function(numberToGet){
        // console.log('GET = ', numberToGet);
        var number = numberToGet ? numberToGet : 50;
        var totalToTheNearest = 5;
        var fut = new future();
        var altmetricApi = 'https://www.altmetric.com/api/v1/citations/at';
        var queryParams = '?num_results=' + number + '&key=' + Meteor.settings.altmetric.key + '&journals=' + Meteor.settings.altmetric.journalId + '&citation_type=news%2Carticle%2Cclinical_trial_study_record%2Cdataset%2Cgeneric&order_by=at_score';
        var altmetricUrl = altmetricApi + queryParams;
        var result = {};
        var total;

        Meteor.http.get(altmetricUrl , function(error, altmetricResult){
            if (error){
                console.error('Altmetric Top 100: ',error);
                fut.throw(error);
            } else if (altmetricResult && altmetricResult.statusCode === 200) {
                Meteor.call('processAltmetricArticlesResponse', altmetricResult.data.results, function(errorProcessing, processingResult){
                    if (errorProcessing){
                        console.error('errorProcessing', errorProcessing);
                        fut.throw(errorProcessing);
                    } else if(processingResult) {
                        Meteor.call('altmetricCheckForTiesAtEnd', numberToGet, processingResult, function(tieError, tieResult){
                            if (tieError) {
                                console.error(tieError);
                                fut.throw(tieError);
                            } else if(tieResult.get != numberToGet){
                                Meteor.call('getAltmetricTop', tieResult.get, function(newTopError, newTopResult){
                                    if (newTopError) {
                                        console.error(newTopError);
                                        fut.throw(newTopError);
                                    } else {
                                        fut.return(newTopResult);
                                    }
                                });
                            } else {
                                Meteor.call('removeAltmetricBelowThreshold', tieResult.articles, function(thresholdError, thresholdResult){
                                    if (thresholdError) {
                                        console.error(thresholdError);
                                        fut.throw(thresholdError);
                                    } else {
                                        total = Math.floor(thresholdResult.length/totalToTheNearest)*totalToTheNearest;
                                        fut.return(thresholdResult.slice(0, total));
                                    }
                                });
                            }
                        });
                    } else {
                        fut.throw('Cannot process');
                    }
                });
            } else if (altmetricResult) {
                fut.throw('API Status Error ' +  altmetricResult.statusCode );
            } else {
                fut.throw('API not responding');
            }
        });

        try {
            return fut.wait();
        }
        catch(error) {
            throw new Meteor.Error(error);
        }
    },
    getAltmetricForArticle: function(mongoId, doi){
        // console.log('...getAltmetricForArticle', mongoId, doi);
        var fut = new future();
        var result = {};
        result.mongo = mongoId;
        var threshold = Meteor.settings.public.journal.altmetric.threshold;
        doi = doi.indexOf('http://dx.doi.org/') !== -1 ? doi.replace('http://dx.doi.org/', '') : doi;
        var altmetricUrl = 'https://www.altmetric.com/api/v1/doi/' + doi;

        Meteor.http.get(altmetricUrl , function(error, altmetricResult){
            if (error && error.response.statusCode === 404) {
                // console.error('getAltmetricForArticle 404: ' + mongoId);
                fut.return();
            } else if (error) {
                console.error('getAltmetricForArticle', error);
                fut.throw(error);
            } else if (altmetricResult) {
                Meteor.call('processAltmetricArticleResponse', altmetricResult.data, function(processError, processResult){
                    if (processError) {
                        console.error('getAltmetricForArticle - processAltmetricResponse', processError);
                        fut.throw(processError);
                    } else if (processResult) {
                        for(var key in processResult) {
                            result[key] = processResult[key];
                        }
                        if (result.score >= threshold) {
                            fut.return(result);
                        } else {
                            fut.return();
                        }
                    }
                });
            }
        });

        try {
            return fut.wait();
        }
        catch(error) {
            throw new Meteor.Error(error);
        }
    },
    altmetricCheckForTiesAtEnd: function(count, articles) {
        var returnArticles = [];
        if (Math.ceil(articles[articles.length-1].score) === Math.ceil(articles[articles.length-2].score)) {
            count = count++;
            returnArticles = articles;
        } else{
            returnArticles = articles.slice(0, articles.length-1);
        }
        return {get: count, articles: returnArticles};
    },
    processAltmetricArticlesResponse: function(articles) {
        return articles.map(function(article){
            return Meteor.call('processAltmetricArticleResponse', article);
        });
    },
    processAltmetricArticleResponse: function(article){
        var result = {};
        result.altmetric_id = article.altmetric_id;
        result.score = article.score;
        result.details_url = article.details_url;
        result.title = article.title;
        result.url = '';
        if (article.doi) {
            if(article.doi.indexOf('http') === -1){
                result.url += 'http://dx.doi.org/';
            }
            result.url += article.doi;
        } else if (article.url) {
            result.url = article.url;
        }
        result.images = article.images;
        return result;
    },
    removeAltmetricBelowThreshold:  function(articles) {
        var threshold = Meteor.settings.public.journal.altmetric.threshold;
        var result = [];
        articles.forEach(function(article){
            if (Math.ceil(article.score) >= threshold) {
                result.push(article);
            }
        });
        return result;
    }
});
