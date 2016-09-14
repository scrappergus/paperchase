// Indexers
// ----------------
Template.AdminDataSubmissions.events({
    'click .clear': function(e, template){
        e.preventDefault();
        Meteor.dataSubmissions.resetPage(template);
    },
    'click #submit-set-xml': function(e, template){
        e.preventDefault();
        Meteor.dataSubmissions.validatePubMedXmlSet(template);
    },
    'click .edit-article': function(e){
        e.preventDefault();
        Session.set('article-form', null);
        // disable other edit buttons
        $('.edit-article').addClass('hide');
        $(e.target).closest('button').removeClass('hide');
        var articleId = $(e.target).closest('button').attr('id').replace('edit-','');
        Session.set('articleId',articleId);
        Meteor.call('preProcessArticle',articleId,function(error,result){
            if (error){
                console.error('ERROR - preProcessArticle', error);
            } else if (result){
                Session.set('article-form',result);
            }
        });

        $('#edit-' + articleId).removeClass('hide');
        $('#overview-' + articleId).addClass('hide');
    },
    'click .cancel-article':function(e){
        Meteor.dataSubmissions.closeEditView();
    },
    'keydown input': function(e, template){
        var tag = '<div class="chip">Tag<i class="material-icons">close</i></div>';
        if(e.which == 13) {
            e.preventDefault();
            var pii = $(e.target).val();
            Meteor.dataSubmissions.addPiiToList(pii);
        }
    },
    'click #add-pii': function(e){
        e.preventDefault();
        var pii = $('#submissions_search_pii').val();
        Meteor.dataSubmissions.addPiiToList(pii);
    },
    'submit .form-pii': function(e, template){
        e.preventDefault();
        template.processing.set(true);
        template.queried.set(true);

        var piiList = Meteor.dataSubmissions.getPiiList();

        //check if there's anything to add to the array of pii
        if ($('#submissions_search_pii').val()){
            var addPii = $('#submissions_search_pii').val();
            //do not add if already present
            if (piiList.indexOf(addPii) === -1){
                piiList.push(addPii);
            }
        }
        if (piiList.length === 0){
            alert('no PII to search');
        }

        var queryType = 'pii',
            queryParams = piiList;

        template.queryType.set('pii');
        template.queryParams.set(piiList);
        template.queryForDisplay.set('PII: ' + piiList);
    },
    'submit .form-issue': function(e, template){
        e.preventDefault();

        var issueId = $('#submissions_search_issue').val();

        if(issueId !== '0'){
            template.processing.set(true);
            template.queried.set(true);

            //get articles
            var queryType = 'issue',
                queryParams = issueId;

            template.queryType.set('issue');
            template.queryParams.set(issueId);
            template.queryForDisplay.set('Issue: ' + $('#submissions_search_issue option:selected').text());
        } else{
            alert('Please select an issue');
        }
    }
});

// Template.RegisterDoiSet.events({
    // 'click #register-doi-set': function(e){
    //     e.preventDefault();
    //     // var submissionList = Session.get('submission_list');
    //     var submissionList = articles.find().fetch();
    //     var piiList = '';
    //     var missingPiiList = [];
    //
    //     for(var i = 0 ; i < submissionList.length ; i++){
    //         if(submissionList[i].ids.pii){
    //             piiList += submissionList[i].ids.pii + ',';
    //         }else{
    //             missingPiiList.push(submissionList[i].title);
    //         }
    //     }
    //
    //     if(missingPiiList.length > 0){
    //         Session.set('missingPii',missingPiiList);
    //     }
    //     if(piiList.length > 0){
    //         Meteor.call('registerDoiSet', piiList, function(error,result){
    //             if(error){
    //                 console.log('ERROR - registerDoiSet');
    //                 console.log(error);
    //                 alert('Could not register DOIs');
    //             }
    //             if(result){
    //                 Meteor.formActions.success();
    //             }
    //         });
    //     }
    // },
// });
