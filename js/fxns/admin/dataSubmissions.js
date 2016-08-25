Meteor.dataSubmissions = {
    getPiiList: function(){
        var piiList = [];
        $('.data-submission-pii').each(function(){
            var pii = $(this).attr('data-pii');
            piiList.push(pii);
        });
        return piiList;
    },
    getArticles: function(){
        var articlesList,
            result;

        Session.set('processingQuery', true);
        Session.set('piiNotFound', null);
        Session.set('queryResults', []);

        var queryType = Session.get('queryType');
        var queryParams = Session.get('queryParams');

        if(queryType === 'reset'){
            Meteor.dataSubmissions.resetPage();
            return;
        } else if(queryType && queryParams){
            Session.set('queried', true);
            Meteor.subscribe('submissionSet', queryType, queryParams, {
                onReady: function () {
                    Meteor.dataSubmissions.updateResults();
                }
            });
        }
    },
    updateResults: function(){
        var articlesResult;
        var articlesProcessedResult = [];
        var query = {};
        var piiNotFound = [];
        var articlesByPii = {};

        if (Session.get('queryType') === 'issue'){
            query.find = {issue_id:  Session.get('queryParams')};
        } else if (Session.get('queryType') === 'pii'){
            query.find = {'ids.pii':{'$in': Session.get('queryParams')}};
        }

        query.options = {sort : {page_start:1}};

        articlesResult =articles.find(query.find, query.options).fetch();

        articlesResult.forEach(function(article){
            // @TODO move readydata to collection transform
            articlesProcessedResult.push(Meteor.article.readyData(article));
            if(article.ids.pii){
                articlesByPii[article.ids.pii] = true; // used to check if any PII queried for were not found, below
            }
        });

        if(articlesProcessedResult.length > 0){
            Session.set('queryResults', articlesProcessedResult);
        }

        // check for if any PII not found
        if (Session.get('queryType') === 'pii' && articlesProcessedResult.length != Session.get('queryParams').length){
            Session.get('queryParams').forEach(function(pii){
                if(!articlesByPii[pii]){
                    piiNotFound.push(pii);
                }
            });
        }
        if(piiNotFound.length > 0){
            Session.set('piiNotFound',piiNotFound);
        }

        Session.set('processingQuery', false);
    },
    resetPage: function(){
        Session.set('submission_list',null);
        Session.set('articleId', null);
        Session.set('queried', null);
        Session.set('queryType',null);
        Session.set('queryParams',null);
        Session.set('processingQuery', false);
        Session.set('queryResults', null);
        Session.set('queryForDisplay', null);
        Session.set('piiNotFound', null);
    },
    closeEditView: function(){
        var articleId = Session.get('articleId');
        Session.set('articleId',null);
        $('#edit-' + articleId).addClass('hide');
        $('#overview-' + articleId).removeClass('hide');
        $('.edit-article').removeClass('hide');
    },
    validateXmlSet: function(){
        var submissionList = articles.find().fetch();
        Meteor.call('articleSetCiteXmlValidation', submissionList, Meteor.userId(), function(error,result){
            if(error){
                console.error('ERROR - articleSetXmlValidation',error);
            } else if(result === 'invalid'){
                alert('XML set invalid');
            } else{
                //all the articles are valid, now do the download
                window.open('/xml-cite-set/' + result);
            }
        });
    }
};
