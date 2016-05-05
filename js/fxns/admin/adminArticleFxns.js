Meteor.adminArticle = {
    updateAffiliationsOrder: function(newIndex){
        var originalIndex = Session.get('affIndex');
        var article = Session.get('article-form');

        // update the order of affiliations in the author objects
        for(var a = 0; a < article.authors.length ; a++){
            var affs = article['authors'][a]['affiliations_list'];
            var movedAff = affs[originalIndex];
            affs.splice(originalIndex,1);
            affs.splice(newIndex, 0, movedAff);
            article['authors'][a]['affiliations_list'] = affs;
        }

        Session.set('article-form',article);
    },
    addDateOrHistory: function(dateType,e){
        e.preventDefault();
        var article = Session.get('article-form');
        var type = $(e.target).attr('id').replace('add-','');
        if(!article[dateType]){
            article[dateType] = {};
        }
        article[dateType][type] = new Date();
        article[dateType][type].setHours(0,0,0,0);
        Session.set('article-form',article);

        $('#add-article-' + dateType).closeModal();
        $('.lean-overlay').remove();
    },
    removeKeyFromArticleObject: function(articleKey,e){
        e.preventDefault();
        var article = Session.get('article-form');
        var objectKey = $(e.target).attr('id').replace('remove-',''); //the key of the object in the article doc
        delete article[articleKey][objectKey]; //the key in the object of the article doc
        Session.set('article-form',article);
    },
    articleListOptions: function(articleKey){
        // console.log('..articleListOptions');
        var allListOptions;
        var addListOptions = {};
        if(articleKey === 'history'){
            allListOptions = dateTypeDateList
        }else if(articleKey === 'dates'){
            allListOptions = pubTypeDateList;
        }else if(articleKey === 'ids'){
            allListOptions = pubIdTypeList;
        }

        if(Session.get('article-form') && articleKey){
            var article = Session.get('article-form');
            var current = article[articleKey]; // what the article has saved
            for(var d in allListOptions){
                if(!current || current[d] === undefined){ // do not test for empty string, adding a new ID type will add empty string to articles session variable
                    addListOptions[d] = allListOptions[d]; // add the other available options
                }
            }
            return addListOptions;
        }
    },
    articleListButton: function(type){
        // console.log('..articleListButton = ' + type);
        if($('.add-article-' + type).hasClass('hide')){
            // console.log('SHOW');
            $('.add-article-' + type).removeClass('hide');
            $('#add-' + type).html('<i class="material-icons">&#xE15C;</i>');
        }else{
            // console.log('HIDE');
            $('.add-article-' + type).addClass('hide');
            $('#add-' + type).html('<i class="material-icons">&#xE147;</i>');
            $('#add-' + type).removeClass('expanded');
        }
    },
    readyArticleForm: function(){
        // console.log('..readyArticleForm');

        // title
        // ------
        $('.article-title').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview']]
            ]
        });

        // abstract
        // ------
        $('.article-abstract').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview']]
            ]
        });

        // dates
        // ------
        // Initiated on partial template rendering, templateAdmin.js

        // issue, article type
        // ------
        // selects
        $('#article-issue').material_select();
        $('#article-type').material_select();;
        $('#article-section').material_select();;
        $('#article-pub-status').material_select();

        // modals
        // ------
        $('#success-modal').leanModal();
    },
    initiateAuthorsSortable: function(){
        $('.authors-list').sortable();
    },
    initiateAffiliationsSortable: function(){
        $('.affiliations-list').sortable({
            start: function( event, ui ) {
                Session.set('affIndex',ui.item.index());
            },
            update: function( event, ui ) {
                var newIndex = ui.item.index();
                Meteor.adminArticle.updateAffiliationsOrder(newIndex);
            },
        });
    },
    urlViaPiiOrMongo: function(articleId,articleRoute){
        Session.set('article',null);
        // determine ID type used in the URL of article pages
        var articleExistsExists = articles.findOne({'_id': articleId});
        if(!articleExistsExists){
            // if the mongo id search found nothing, search by pii
            var articlePii = String(articleId);
            var articleByPii = articles.findOne({'ids.pii': articlePii});
            // check if :_id is a pii and not Mongo ID
            if(articleByPii){
                Router.go(articleRoute, {_id: articleByPii._id});
            }else{
                Session.set('admin-not-found',true);
                // Router.go('AdminArticleAdd');
            }
        }else{
            Session.set('article',articleExistsExists);
        }
    },
    cleanTitle: function(title){
        // for cleaning title input
        return string.replace(/<p>|<br>/g,'').replace(/<\/p>/g,'').trim();
    },
    authorAffiliationIndexToWords: function(authorAffiliations,allAffiliations){
        return authorAffiliations.map(function(affIdx){
            return allAffiliations[affIdx];
        });
    }
}

Meteor.adminArticleFormGet = {
    abstract: function(){
        var abstract = $('.article-abstract').code();
        abstract = Meteor.formActions.cleanWysiwyg(abstract);
        return abstract;
    },
    advance: function(){
        if($('#advance-checkbox').prop('checked')){
            return true;
        }else{
            return false;
        }
    },
    affiliations: function(){
        var affiliations = [];
        $('.article-affiliation').each(function(idx,obj){
            affiliations.push($(this).val());
        });
        return affiliations;
    },
    correspondence: function(){
        var correspondence = [];
        $('.correspondence-row').each(function(idx,obj){
            var corresp = {
                'text' : $(this).find('input.correspondence-text').val(),
                'email' : $(this).find('input.correspondence-email').val()
            };
            correspondence.push(corresp);
        });
        return correspondence;
    },
    articleType: function(){
        var article_type = {};
        if($('#article-type').val() != ''){
            article_type.short_name = $('#article-type').val();
            article_type.nlm_type = $('#article-type option:selected')[0].dataset.nlm;
            article_type.plural = $('#article-type option:selected')[0].dataset.plural;
            article_type.id = $('#article-type option:selected')[0].dataset.id;
            article_type.name = $('#article-type option:selected').text();
        }
        return article_type;
    },
    authors: function(){
        var authors = [];
        $('.author-row').each(function(idx,obj){
            var author = {
                'name_first' : $(this).find('input[name="name_first"]').val(),
                'name_middle' : $(this).find('input[name="name_middle"]').val(),
                'name_last' : $(this).find('input[name="name_last"]').val(),
                'ids' : {},
                'affiliations_numbers' : []
            };
            var authorIds = $(this).find('.author-id').each(function(i,o){
                author.ids[$(o).attr('name')] = $(o).val();
            });
            $(this).find('.author-affiliation').each(function(i,o){
                if($(o).prop('checked')){
                    author.affiliations_numbers.push(parseInt(i));
                }
            });
            authors.push(author);
        });
        return authors;
    },
    dates: function(type){
        var dates = {};
        $('.datepicker.' + type).each(function(i){
            var key = $(this).attr('id');
            dates[key] = new Date($(this).val());
        });
        return dates;
    },
    display: function(){
        if($('#display-checkbox').prop('checked')){
            return true;
        }else{
            return false;
        }
    },
    feature: function(){
        if($('#feature-checkbox').prop('checked')){
            return true;
        }else{
            return false;
        }
    },
    ids: function(){
        var ids = {};
        $('.article-id').each(function(i) {
            var k = $(this).attr('id'); //of the form, article-id-key
            k = k.split('-');
            k = k[2];
            ids[k] = $(this).val();
        });
        return ids;
    },
    issueId: function(){
        if($('#article-issue').val() != ''){
            return $('#article-issue').val();
        }
    },
    keywords: function(){
        var keywords = [];
        $('.kw').each(function(i){
            keywords.push($(this).val());
        });
        return keywords;
    },
    pageEnd: function(){
        if($('#page_end').val()){
            return parseInt($('#page_end').val());
        }
    },
    pageStart: function(){
        if($('#page_start').val()){
            return parseInt($('#page_start').val());
        }
    },
    section: function(){
        if($('#article-section').val() != ''){
            return $('#article-section').val();
        }
    },
    status: function(){
        if($('#article-pub-status').val() != ''){
            return $('#article-pub-status').val();
        }
    },
    title: function(){
        var articleTitle = $('.article-title').code();
        articleTitle = Meteor.formActions.cleanWysiwyg(articleTitle);
        return articleTitle;
    },
    all: function(){
        var articleUpdateObj = {};

        // articleUpdateObj.page_start; // integer
        // articleUpdateObj.page_end; // integer
        // articleUpdateObj.article_type = {}; // Object of name, short name, nlm type
        // articleUpdateObj.section = ''; // Mongo ID
        // articleUpdateObj.pub_status = ''; // NLM status


        // site
        // -------
        articleUpdateObj.feature = Meteor.adminArticleFormGet.feature();
        articleUpdateObj.advance = Meteor.adminArticleFormGet.advance();
        articleUpdateObj.display = Meteor.adminArticleFormGet.display();

        // meta
        // -------
        articleUpdateObj.title = Meteor.adminArticleFormGet.title();
        articleUpdateObj.page_start = Meteor.adminArticleFormGet.pageStart();
        articleUpdateObj.page_end = Meteor.adminArticleFormGet.pageEnd();
        articleUpdateObj.ids = Meteor.adminArticleFormGet.ids();
        articleUpdateObj.abstract = Meteor.adminArticleFormGet.abstract();

        // select options
        articleUpdateObj.issue_id = Meteor.adminArticleFormGet.issueId();
        articleUpdateObj.article_type = Meteor.adminArticleFormGet.articleType();
        articleUpdateObj.section = Meteor.adminArticleFormGet.section();
        articleUpdateObj.status = Meteor.adminArticleFormGet.status();

        // authors and affiliations
        articleUpdateObj.affiliations = Meteor.adminArticleFormGet.affiliations();
        articleUpdateObj.authors =  Meteor.adminArticleFormGet.authors();
        articleUpdateObj.correspondence =  Meteor.adminArticleFormGet.correspondence();

        // Dates and History
        // -------
        articleUpdateObj.dates =  Meteor.adminArticleFormGet.dates('dates');

        articleUpdateObj.history =  Meteor.adminArticleFormGet.dates('history');


        // Keywords
        // -------
        articleUpdateObj.keywords = Meteor.adminArticleFormGet.keywords();

        return articleUpdateObj;
    }
}