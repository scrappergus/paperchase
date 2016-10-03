Meteor.methods({
    getAltmetricTopHundred : function(){
        var fut = new future();
        var altmetricApi = 'https://www.altmetric.com/api/v1/citations/at';
        var queryParams = '?num_results=100&key=' + Meteor.settings.altmetric.key + '&journals=' + Meteor.settings.altmetric.journalId + '&citation_type=news%2Carticle%2Cclinical_trial_study_record%2Cdataset%2Cgeneric&order_by=at_score';
        var altmetricUrl = altmetricApi + queryParams;
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
                        fut.return(processingResult);
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
    processAltmetricResponse: function(articles) {
        return articles.map(function(article){
            var aReturn = {};
            aReturn.score = article.score;
            aReturn.details_url = article.details_url;
            aReturn.title = article.title;
            aReturn.url = '';
            if (article.doi) {
                if(article.doi.indexOf('http') != -1){
                    aReturn.url += 'http://dx.doi.org/';
                }
                aReturn.url += article.doi;
            } else if (article.url) {
                aReturn.url = article.url;
            }
            aReturn.images = article.images;
            return aReturn;
        });
    }
});
