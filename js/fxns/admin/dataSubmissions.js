Meteor.dataSubmissions = {
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
