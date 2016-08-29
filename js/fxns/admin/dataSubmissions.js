Meteor.dataSubmissions = {
    ppubAlreadySubmitted: function(template){
        var articlesList = Meteor.dataSubmissions.getArticles(template);
        var ppubAlreadySubmitted = [];
        articlesList.forEach(function(article){
            if(article.pub_status && article.pub_status === 'ppub' && article.submissions && article.submissions[article.submissions.length - 1].pub_status === 'ppub'){
                ppubAlreadySubmitted.push(article);
            }
        });
        return ppubAlreadySubmitted;
    },
    articleOkToSubmit: function(template){
        var articlesList = Meteor.dataSubmissions.getArticles(template);
        var okToSubmit = [];
        articlesList.forEach(function(article){
            if(article.pub_status && article.pub_status === 'ppub' && article.submissions && article.submissions[article.submissions.length - 1].pub_status === 'ppub'){
            } else{
                okToSubmit.push(article);
            }
        });
        return okToSubmit;
    },
    getPiiList: function(){
        var piiList = [];
        $('.data-submission-pii').each(function(){
            var pii = $(this).attr('data-pii');
            piiList.push(pii);
        });
        return piiList;
    },
    resetPage: function(template){
        Session.set('submission_list',null);
        Session.set('articleId', null);

        template.queryType.set();
        template.queryParams.set();
        template.queried.set(false);
        template.processing.set(false);
        template.queryForDisplay.set();
    },
    closeEditView: function(){
        var articleId = Session.get('articleId');
        Session.set('articleId',null);
        $('#edit-' + articleId).addClass('hide');
        $('#overview-' + articleId).removeClass('hide');
        $('.edit-article').removeClass('hide');
    },
    getArticles: function(template){
        var queryType = template.queryType.get();
        var queryParams = template.queryParams.get();

        var query = {};
        query.options = {sort: {page_start:1}};
        if (queryType === 'issue'){
            query.find = {issue_id: queryParams};
        } else if (queryType === 'pii'){
            query.find = {'ids.pii':{'$in':queryParams}};
        }

        return articles.find(query.find, query.options).fetch();
    },
    validatePubMedXmlSet: function(template){
        var submissionList = Meteor.dataSubmissions.articleOkToSubmit(template);
        Meteor.call('pubMedArticleSetXml', submissionList, Meteor.userId(), function(error,result){
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
