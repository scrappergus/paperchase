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
                Meteor.call('processAltmetricResponse', altmetricResult.data.results, function(errorProcessing, processingResult){
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
    processAltmetricResponse: function(articles) {
        return articles.map(function(article){
            var aReturn = {};
            aReturn.altmetric_id = article.altmetric_id;
            aReturn.score = article.score;
            aReturn.details_url = article.details_url;
            aReturn.title = article.title;
            aReturn.url = '';
            if (article.doi) {
                if(article.doi.indexOf('http') === -1){
                    aReturn.url += 'http://dx.doi.org/';
                }
                aReturn.url += article.doi;
            } else if (article.url) {
                aReturn.url = article.url;
            }
            aReturn.images = article.images;
            return aReturn;
        });
    },
    removeAltmetricBelowThreshold:  function(articles) {
        var threshold = 10;
        var result = [];
        articles.forEach(function(article){
            if (Math.ceil(article.score) >= threshold) {
                result.push(article);
            }
        });
        return result;
    }
});
