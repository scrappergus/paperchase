// News
// --------------------
Template.AdminNewsForm.events({
    'click .submit': function(e){
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
        newTag = Meteor.clean.cleanWysiwyg(newTag);
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
