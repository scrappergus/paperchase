Template.Admin.events({
    'click .edit-btn': function(e){
        e.preventDefault();
        $('.overview').addClass('hide');
        $('.edit').removeClass('hide');
    }
});

// Dashboard
// ---------------
Template.ArticleDatesCsvForm.events({
    'submit form': function(e){
        e.preventDefault();
        Meteor.formActions.processing();

        var piiList,
            cleanedPii;

        piiList = $('#articles-pii').val();
        piiList = piiList.split(',');

        if(piiList && piiList.length > 0){
            cleanedPii = piiList.map(function(pii){
                return Meteor.general.cleanString(pii);
            });

            Session.set('processing-pii',cleanedPii);

            Router.go('csvArticleDates', {pii : cleanedPii});

            Meteor.formActions.closeModal();

            Session.set('processing-pii',null);

        }else{
            Meteor.formActions.errorMessage('Please enter comma separted list of PII');
        }
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
