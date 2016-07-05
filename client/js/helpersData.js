// General
// -------------
Template.Visitor.helpers({
    bannerLogo: function(){
        var journalSettings = journalConfig.findOne();
        if(journalSettings){
            return journalSettings['journal']['logo']['banner'];
        }
    },
    issn : function(){
        var journalSettings = journalConfig.findOne();
        if(journalSettings){
            return journalSettings['journal']['issn'];
        }
    },
    submitLink : function(){
        var journalSettings = journalConfig.findOne();
        if(journalSettings){
            return journalSettings['submission']['url'];
        }
    },
    mainColor: function(){
        var journalSettings = journalConfig.findOne();
        if(journalSettings){
            return journalSettings['site']['spec']['color']['main_rgb'];
        }
    },
    configLoaded: function (){
        var journalSettings = journalConfig.findOne();
        if(journalSettings){
            return true;
        }
    }
});

Template.Footer.helpers({
    publisher : function(){
        var journalSettings = journalConfig.findOne();
        if(journalSettings){
            return journalSettings['journal']['publisher']['name'];
        }
    },
    issn : function(){
        var journalSettings = journalConfig.findOne();
        if(journalSettings){
            return journalSettings['journal']['issn'];
        }
    }
});

// SubNav
Template.subNav.helpers({
    issn : function(){
        var journalSettings = journalConfig.findOne();
        if(journalSettings){
            return journalSettings['journal']['issn'];
        }
    }
});

Template.ErrorMessages.helpers({
    errors: function(){
        return Session.get('errorMessages');
    }
});
Template.SubscribeModal.helpers({
    article: function(){
        return Session.get('articleData');
    }
});

// Navigation
// -------------
Template.LeftNav.helpers({
    links: function(){
        if(Session.get('journal')){
            return Session.get('journal').site.side_nav;
        }
    },
    sectionsLinks: function(){
        return Session.get('sectionNav');
    }
});
Template.MobileMenu.helpers({
    links: function(){
        if(Session.get('journal')){
            return Session.get('journal').site.side_nav;
        }
    },
    sectionsLinks: function(){
        return Session.get('sectionNav');
    }
});
Template.scrollspyItems.helpers({
    topSection: function() {
        return this.headerLevel == 1;
    },
    // headerLevel: function() {
    //     return this.headerLevel;
    // }
});

// Home
// -------------
Template.Home.helpers({
    latestIssue: function() {
        return issues.findOne({current:true});
    }
});

// Contact
// -------------
Template.Contact.helpers({
    submitLink : function(){
        var journalSettings = journalConfig.findOne();
        if(journalSettings){
            return journalSettings['submission']['url'];
        }
    }
});
// Archive
// -------------
Template.Archive.helpers({
    volumes: function(){
        return Session.get('archive');
    },
    archiveReady: function() {
        if(Session.get('archive')) {
            return true;
        }
        return false;
    },
    items: function(){
        // Todo: update this static helper
        var volumes = [
            { title: 'Volume 8' },
            { title: 'Volume 7' },
            { title: 'Volume 6' },
            { title: 'Volume 5' },
            { title: 'Volume 4' },
            { title: 'Volume 3' },
            { title: 'Volume 2' },
            { title: 'Volume 1' },
        ];
        return volumes;
    }
});
// Editorial Board
// -------------
Template.EdBoard.helpers({
    journalName: function(){
        var journalSettings = journalConfig.findOne();
        if(journalSettings){
            return journalSettings['journal']['name'];
        }
    }
});

// Article
// -------
Template.ArticleText.helpers({
    fullText: function(){
        return Session.get('article-text');
    }
});
Template.Article.helpers({
    fullText: function(){
        return Session.get('article-text');
    }
});

Template.ArticleSidebar.helpers({
    fullTextView: function(){
        if(Router.current().route.getName() === 'ArticleText'){
            return true;
        }
        return;
    },
    abstractView: function(){
        if(Router.current().route.getName() === 'Article'){
            return true;
        }
        return;
    },
    showToc: function() {
        var articleData = Template.parentData(1).article;
        return Meteor.impact.showToc(articleData);
    },
    fullTextReady: function(){
        if(Session.get('article-text')) {
            return true;
        }
        return;
    },
    fullTextAvailable: function() {
        var articleData = Template.parentData(1).article;
        if(articleData.files && articleData.files.xml && articleData.files.xml.url && articleData.files.xml.display) {
            return true
        }
        if(articleData.articleJson) {
            return true
        }

        return;
    },
    items: function() {
        if(Session.get('article-text')){
            var articleSections = Session.get('article-text').sections;
            var footnotes = Session.get('article-text').footnotes;
            var acks = Session.get('article-text').acks;
            var references = Session.get('article-text').references;
            var sections = [];

            if(articleSections){
                for ( i = 0; i < articleSections.length; i++ ) {
                    if ( articleSections[i].headerLevel && articleSections[i].headerLevel === 1 ) {
                        if( !articleSections[i].hideTitleInToc ){
                            var sectionTitle = '';
                            sectionTitle = articleSections[i].title;
                            sectionTitle = sectionTitle.replace(/<a\b[^>]*>(.*?)<\/a>/i,'').replace('[]','');
                            sections.push( { title: sectionTitle } );
                        }
                    }
                }
            }

            if (Session.get('article-text').glossary) {
                sections.push( { title: 'Abbreviations'} );
            }

            if ( acks ) {
                for ( i = 0; i < acks.length; i++ ) {
                    sections.push( { title: acks[i].title} );
                }
            }

            if ( footnotes ) {
                for ( i = 0; i < footnotes.length; i++ ) {
                    sections.push( { title: footnotes[i].title} );
                }
            }

            if ( references ) {
                sections.push( { title: 'References'} );
            }

            return sections;
        }
    }
});

Template.AuthorAffsAndNotes.helpers({
    tooltipAffiliation: function() {
        var articleData = Template.parentData(2);
        var authorData = Template.parentData(1);
        var num = parseInt(this);
        if(articleData.affiliations) {
            return articleData.affiliations[num];
        }
        else {
            return '';
        }
    }
})

// Issue
// ------
Template.Issue.helpers({
    issueData: function(){
        return Session.get('issue');
    },
    items: function() {
        var articles,
            articleTypes,
            sections = [];

        articles = Session.get('issue').articles;
        articleTypes = Meteor.organize.articleTypesById(articles);

        for( var type_id in articleTypes ){
            if(articleTypes[type_id].count > 1){
                sections.push( { title: articleTypes[type_id].plural } );
            }else{
                sections.push( { title: articleTypes[type_id].name } );
            }
        }

        return sections;
    }
});

// Sections
Template.SectionPapers.helpers({
    articles: function(){
        return Session.get('article-list');
    }
})

// Sections
Template.Search.helpers({
    searchLoading: function(){
        return Session.get('searchLoading');
    },
    searchLoaded: function() {
        return Session.get('searchLoaded');
    },
    queryResults: function() {
        return Session.get("queryResults");
    }

});
