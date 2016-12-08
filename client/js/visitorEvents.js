// Home
// ------------
Template.Home.events({
    'click .view-all-top-home': function(e){
        Meteor.googleAnalytics.sendEvent('View All - Via Homepage',e);
    }
});

// News
// ------------
Template.LatestNews.events({
    'click .almetric-news-link': function(e){
        Meteor.googleAnalytics.sendEvent('Almetric News Link',e);
    }
});

// Recommend
// -------
Template.Recommend.events({
    'submit form': function(e,t){
        e.preventDefault();
        Meteor.formActions.saving();
        var inputs = {};
        var errors = [];

        inputs['user_id'] = $('#user_id').val();
        inputs['name_first'] = $('#name_first_input').val();
        inputs['user_email'] = $('#email_input').val();
        inputs['name_last'] = $('#name_last_input').val();
        inputs['institution'] =  $('#institution_input').val();
        inputs['position'] =  $('#position_input').val();
        inputs['lib_email'] = $('#lib_email_input').val();
        inputs['message'] =  $('#message_input').val();

        //get checkboxe recommendations
        var recommendations = [];
        $('.checkbox-recommend').each(function(i){
            if($(this).prop('checked')){
                var checkbox_id = $(this).attr('id');
                var text = $('label[for="'+checkbox_id+'"]').text();
                recommendations.push(text);
            }
        });
        if(recommendations.length > 0){
            inputs['recommendations'] = recommendations;
        }


        // check required
        if(!inputs['institution']){
            errors.push('Institution' + ' Required');
            $('#institution_input').addClass('invalid');
        }

        if(errors.length === 0 ){
            //submit form
            Meteor.call('addRecommendation', inputs, function(error,result){
                if(error){
                    console.log('ERROR - addRecommendation');
                    console.log(error);
                }else{
                    Meteor.formActions.success();
                }
            });
        }else{
            //show errors
            Meteor.formActions.error(); //update dom for user
            Session.set('errorMessages',errors); //reactive template variable for ErrorMessages will loop through these
        }
    }
});

// Menus
// -------
Template.Visitor.events({
    // todo: move this into a separate function
    'click .sidebar-toggle': function(e){
        e.preventDefault();
        $('.sub-nav').toggleClass('sidebar-open');
        $('.content').toggleClass('no-sidebar');
        $('.sidebar').toggleClass('hidden');
    },
    'click .sidebar-toggle-mobile': function(e){
        e.preventDefault();
        $(e.target).toggleClass('icon-close');
        $(e.target).toggleClass('icon-menu');

        $('.content').toggleClass('no-sidebar');
        $('.sidebar').toggleClass('mobile-show');
    },
    'click ul.nav-links li a': function(e){
        $('.sidebar-toggle-mobile').removeClass('icon-close');
        $('.sidebar-toggle-mobile').addClass('icon-menu');
        $('.sidebar').removeClass('mobile-show');
    },
    'click #mobile-search': function(e){
        Router.go('Search');
    }
});

// Subscribe
// -------
Template.Subscribe.events({
    'click button': function(e){
        e.preventDefault();
    }
});


// General search field
// -------
Template.Visitor.events({
    'click .searchbox-button': function(e){
        Meteor.search.bounceTo({terms:$('.searchbox-field').val()});
    },
    'keypress .searchbox-field': function (evt, template) {
    if (evt.which === 13) {
        Meteor.search.bounceTo({terms:$('.searchbox-field').val()});
    }
  }
});


// Issue
// -------
Template.Issue.events({
    'click .modal-trigger': function(e) {
        Meteor.article.subscribeModal(e);
    },
    'click .anchor': function(e) {
        Meteor.general.scrollAnchor(e);
    },
    'click .issue-change': function(e) {
        Session.set('issue',null);
        Session.set('issueParams',null);
        Session.set('issueMeta',null);
    }
});


// Section
// -------
Template.SectionPapers.events({
    'click .anchor': function(e) {
        Meteor.general.scrollAnchor(e);
    }
});


// Article
// -------
Template.Article.events({
    'click .modal-trigger': function(e) {
        Meteor.article.subscribeModal(e);
    }
});
Template.ArticleButtons.events({
    'click .download-pdf': function(e){
        Meteor.googleAnalytics.sendEvent('Full Text - PDF',e);
    },
    'click .view-lens': function(e){
        Meteor.googleAnalytics.sendEvent('Full Text - Lens',e);
    },
    'click .view-html': function(e){
        Meteor.googleAnalytics.sendEvent('Full Text - HTML',e);
    }
});
Template.ArticleSidebar.events({
    'click .download-pdf': function(e){
        Meteor.googleAnalytics.sendEvent('Full Text - PDF',e);
    },
    'click .view-lens': function(e){
        Meteor.googleAnalytics.sendEvent('Full Text - Lens',e);
    },
    'click .view-html': function(e){
        Meteor.googleAnalytics.sendEvent('Full Text - HTML',e);
    }
});
Template.ArticleFullText.events({
    'click .anchor': function(e) {
        Meteor.general.scrollAnchor(e);
    }
});


// Advance
// -------
Template.Advance.events({
    'click .modal-trigger': function(e) {
        Meteor.article.subscribeModal(e);
    },
    'click .download-pdf': function(e) {
        Meteor.article.downloadPdf(e);
    }
});


// For Authors
// -------
Template.ForAuthors.events({
    'click .anchor': function(e) {
        Meteor.general.scrollAnchor(e);
    }
});


// Search
// ------
Template.Search.events({
        'submit #search-terms': function(e) {
            Meteor.search.searchLoad(e);
        }
});

Template.SearchAlt.events({
    'submit #search-terms': function(e) {
        Meteor.search.searchLoad(e);
    }
});

// Scrollspy
// ------
Template.scrollspyCard.events({
    'click .anchor': function(e){
        Meteor.general.scrollAnchor(e);
    }
});

// Footer
// ------
Template.Footer.events({
    'click .previous-site-link': function(e){
        ga('send', 'event', 'Archive Site');
    }
});
