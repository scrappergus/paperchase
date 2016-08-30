Meteor.dataSubmissions = {
    addPiiToList: function(pii){
        // console.log('..addPiiToList', pii);
        if(pii){
            //first check if already present
            var piiList = Meteor.dataSubmissions.getPiiList();

            if(piiList.indexOf(pii) === -1){
                $('#search_pii_list').append('<span class="data-submission-pii chip grey lighten-2 left" id="chip-' + pii + '" data-pii="' + pii + '">' + pii + ' <i class="material-icons" data-pii="' + pii + '">&#xE5CD;</i></span>');
            }else{
                alert('PII already in list');
            }
        }else{
            alert('Please enter a PII');
        }
    },
    ppubAlreadySubmitted: function(template){
        var articlesList = Meteor.dataSubmissions.getArticles(template);
        var ppubAlreadySubmitted = [];
        articlesList.forEach(function(article){
            if(article.pub_status && article.pub_status === 'ppublish' && article.submissions && article.submissions[article.submissions.length - 1].pub_status === 'ppublish'){
                ppubAlreadySubmitted.push(article);
            }
        });
        return ppubAlreadySubmitted;
    },
    articleOkToSubmit: function(template){
        // all articles with a pub status and without previously submitted ppub
        var articlesList = Meteor.dataSubmissions.getArticles(template);
        var okToSubmit = [];
        articlesList.forEach(function(article){
            if(article.pub_status && article.pub_status === 'ppublish' && article.submissions && article.submissions[article.submissions.length - 1].pub_status === 'ppublish'){
            } else if(article.pub_status){
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
        Session.set('creatingXml', true);
        var submissionList = Meteor.dataSubmissions.articleOkToSubmit(template);
        Meteor.call('pubMedArticleSetXml', submissionList, Meteor.user(), function(error,result){
            if(error){
                console.error('ERROR - articleSetXmlValidation',error);
            } else if(result === 'invalid'){
                template.processing.set(false);
                alert('XML set invalid');
            } else{
                //all the articles are valid, now send the file
                Session.set('creatingXml', false);
                Meteor.call('dataSubmissionsNotifyByEmail', result.submissionId, Meteor.user());
                alert('Submission Sent. Please check your email for a download link of the XML.');
            }
        });
    }
};
