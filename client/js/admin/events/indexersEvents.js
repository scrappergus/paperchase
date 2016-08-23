// Indexers
// ----------------
Template.AdminDataSubmissions.events({
    'click .clear': function(e){
        e.preventDefault();
        // Session.set('submission_list',null);
        Meteor.subscribe('articles-submission',null,null); //just subscribe to nothin to clear the list

        Session.set('error',false);
        $('.data-submission-pii').remove();
        $('.saving').addClass('hide');
    },
    'click #download-set-xml': function(e){
        e.preventDefault();
        Meteor.dataSubmissions.validateXmlSet();
    },
    'click #register-doi-set': function(e){
        e.preventDefault();
        // var submissionList = Session.get('submission_list');
        var submissionList = articles.find().fetch();
        var piiList = '';
        var missingPiiList = [];

        for(var i = 0 ; i < submissionList.length ; i++){
            if(submissionList[i].ids.pii){
                piiList += submissionList[i].ids.pii + ',';
            }else{
                missingPiiList.push(submissionList[i].title);
            }
        }

        if(missingPiiList.length > 0){
            Session.set('missingPii',missingPiiList);
        }
        if(piiList.length > 0){
            Meteor.call('registerDoiSet', piiList, function(error,result){
                if(error){
                    console.log('ERROR - registerDoiSet');
                    console.log(error);
                    alert('Could not register DOIs');
                }
                if(result){
                    Meteor.formActions.success();
                }
            });
        }
    },
    'click .edit-article': function(e){
        e.preventDefault();
        // disable other edit buttons
        $('.edit-article').addClass('hide');
        $(e.target).closest('button').removeClass('hide');
        var articleId = $(e.target).closest('button').attr('id').replace('edit-','');
        Meteor.call('preProcessArticle',articleId,function(error,result){
            if(error){
                console.log('ERROR - preProcessArticle');
                console.log(error);
            }
            if(result){
                Session.set('article-form',result);
            }
        });
        // var articleIndex = $(e.target).closest('.collection-item').index();
        // var article = Session.get('submission_list')[articleIndex];
        // var article =  articles.findOne({'_id' : articleId});

        Session.set('article-id',articleId);
        // Session.set('preprocess-article',true);
        // Session.set('article',article);

        $('#edit-' + articleId).removeClass('hide');
        $('#overview-' + articleId).addClass('hide');
    },
    'click .cancel-article':function(e){
        var articleId = $(e.target).closest('button').attr('id').replace('cancel-','');
        Session.set('article-id',null);
        $('#edit-' + articleId).addClass('hide');
        $('#overview-' + articleId).removeClass('hide');
        $('.edit-article').removeClass('hide');
    }
});

Template.DataSubmissionsSearchForms.events({
    'keydown input': function(e,t){
        var tag = '<div class="chip">Tag<i class="material-icons">close</i></div>';
        if(e.which == 13) {
            e.preventDefault();
            var pii = $(e.target).val();

            //first check if already present
            var piiList = Meteor.dataSubmissions.getPiiList();

            if(piiList.indexOf(pii) === -1){
                $('#search_pii_list').append('<span class="data-submission-pii chip grey lighten-2 left" id="chip-' + pii + '" data-pii="' + pii + '">' + pii + ' <i class="material-icons" data-pii="' + pii + '">&#xE5CD;</i></span>');
            }else{
                alert('PII already in list');
            }
        }
    },
    'submit .form-pii': function(e,t){
        e.preventDefault();
        console.log('CLICK PII Form');
        var piiList = Meteor.dataSubmissions.getPiiList();

        //check if there's anything to add to the array of pii
        if($('#submissions_search_pii').val()){
            var addPii = $('#submissions_search_pii').val();
            //do not add if already present
            if(piiList.indexOf(addPii) === -1){
                piiList.push(addPii);
            }
        }
        if(piiList.length === 0){
            alert('no PII to search');
        }

        //get articles
        var queryType = 'pii',
            queryParams = piiList;

        Meteor.dataSubmissions.getArticles(queryType,queryParams);
    },
});

Template.DataSubmissionsSearchFormIssue.events({
    'submit .form-issue': function(e,t){
        e.preventDefault();
        var issueId = $('#submissions_search_issue').val();

        //get articles
        var queryType = 'issue',
            queryParams = issueId;
        Meteor.dataSubmissions.getArticles(queryType,queryParams);
    }
});
