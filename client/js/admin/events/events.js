Template.Admin.events({
    'click .edit-btn': function(e){
        e.preventDefault();
        $('.overview').addClass('hide');
        $('.edit').removeClass('hide');
    }
});

// Site Control
// ----------------
Template.AdminSiteControl.events({
    'submit form': function(e){
        Meteor.adminSite.formGetData(e);
    }
});

// DOI Status
// --------------------
Template.piiFilter.events({
   'keyup .pii-filter-input, input .pii-filter-input': function (e, template) {
        var input = $(e.target).val();
        // console.log('input',input);
        template.filter.set(input);
    }
});

// Editorial Board
// ----------------
Template.AdminEditorialBoardForm.events({
    'submit form': function(e){
        Meteor.adminEdBoard.formGetData(e);
    }
});

// News
// --------------------
Template.AdminNewsForm.events({
    'click .submit': function(e){
        console.log('save!');
        Meteor.formActions.saving();
        Meteor.adminNews.formGetData(e);
    },
    'click .add-news-tag': function(e){
        Meteor.adminNews.showAddNewTag(e);
    },
    'click .cancel-news-tag': function(e){
        Meteor.adminNews.hideAddNewTag(e);
    },
    'click .add-to-tags': function(e){
        e.preventDefault();
        var newTag = $('.news-tag-input').code();
        newTag = Meteor.formActions.cleanWysiwyg(newTag);
        var newsData = Session.get('newsData');
        if(!newsData){
            newsData = {};
        }
        if(!newsData.tags){
            newsData.tags = [];
        }
        newsData.tags.push(newTag);
        Session.set('newsData',newsData);
        $('.news-tag-input').code('');
        Meteor.adminNews.hideAddNewTag(e);
    }
});

// Volume
// ----------------
Template.AdminVolume.events({
    'submit form': function(e,t){
        e.preventDefault();
        Meteor.formActions.saving();
        var issueOrder = [];
        var volumeId = Session.get('volume')._id;
        $('#volume-issues-list li').each(function(){
            issueOrder.push($(this).attr('id'));
        });
        Meteor.call('updateVolume',volumeId,{$set:{'issues':issueOrder}},function(updateError,updateRes){
            if(updateError){
                console.error('updateVolume ERROR', updateError);
                Meteor.formActions.error();
            }else if(updateRes){
                Meteor.formActions.success();
            }
        });
    }
});

// Indexers
// ----------------
Template.AdminDataSubmissions.events({
    'keydown input': function(e,t){
        var tag = '<div class="chip">Tag<i class="material-icons">close</i></div>'
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
    'click .zmdi-close-circle-o': function(e,t){
        e.preventDefault();
        var pii = $(e.target).attr('data-pii');
        pii = pii.trim();
        $('#chip-'+pii).remove();
    },
    'submit .form-pii': function(e,t){
        e.preventDefault();

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
    'submit .form-issue': function(e,t){
        e.preventDefault();
        var issueId = $('#submissions_search_issue').val();

        //get articles
        var queryType = 'issue',
            queryParams = issueId;
        Meteor.dataSubmissions.getArticles(queryType,queryParams);
    },
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
            if(submissionList[i]['ids']['pii']){
                piiList += submissionList[i]['ids']['pii'] + ',';
            }else{
                missingPiiList.push(submissionList[i]['title']);
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
})

// Recommend
// ----------------
Template.AdminRecommendationUpdate.events({
    'submit form': function(e,t){
        e.preventDefault();
        Meteor.formActions.saving();
        var inputs = {};
        if(!$('#institution_contact').prop('disabled')){
            inputs['contacted'] = $('#institution_contact').prop('checked');
        }

        inputs['correspondence_notes'] = $('#correspondence_notes').val();

        Meteor.call('updateRecommendation', inputs, this._id, function(error, result){
            if(error){
                console.log('ERROR - updateRecommendation');
                console.log(error);
            }else{
                console.log(result);
                Meteor.formActions.success();
            }
        });
    }
});
