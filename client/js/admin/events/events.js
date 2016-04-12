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
