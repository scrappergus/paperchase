Meteor.organize = {
    arrDiff: function(a1,a2){
        // Find anything different b/w arrays
        var a=[], diff=[];
        for(var i=0 ; i < a1.length ; i++){
            a[a1[i]]=true;
        }
        for(var i=0 ; i<a2.length; i++){
            if(a[a2[i]]) delete a[a2[i]];
            else a[a2[i]]=true;
        }
        for(var k in a){
            diff.push(k);

        }
        return diff;
    },
    getIssueArticlesByID: function(id){
        // console.log('getIssueArticlesByID');
        var issueArticles = articles.find({'issue_id' : id},{sort : {page_start:1}}).fetch();
        issueArticles = Meteor.organize.groupArticles(issueArticles);
        return issueArticles;
    },
    groupArticles: function(articles) {
        // organize for issue and add file links
        // console.log('groupArticles');
        var grouped = [],
            types = {};

        types = Meteor.organize.articleTypesById(articles);

        for(var i = 0 ; i < articles.length ; i++){
            // type organization
            // ---------
            var type = ''; //for articles without a type
            if(articles[i].article_type){
                type = articles[i].article_type.short_name;
            }

            if(!grouped[type]){
                grouped[type] = [];
                articles[i].start_group = true;
                if(articles[i].article_type._id && types[articles[i].article_type._id].count > 1){
                    articles[i].article_type.pluralize = true;
                }
            }

            // files
            // ---------
            articles[i] = Meteor.impact.hideFullText(articles[i]);
            if(articles[i].files){
                articles[i].files = Meteor.article.linkFiles(articles[i].files, articles[i]._id);
            }

            // Abstract hiding
            // ---------
            // certain paper types should not display abstract buttons
            var hiddenAbstractPaperTypeIds = Meteor.impact.getCommentariesAndEditorialTypeIds();
            if( articles[i].article_type && articles[i].article_type._id &&  hiddenAbstractPaperTypeIds.indexOf(articles[i].article_type._id) != -1){
                articles[i].abstract = null;
            }

            if(articles[i].ids.doi && _.isString(articles[i].ids.doi)) {
                articles[i].ids.doi = articles[i].ids.doi.replace(/http:\/\/dx\.doi\.org\//,""); // TODO: remove link part from DB
            }

            var typeIds = Meteor.impact.getCommentariesAndEditorialTypeIds();

            if(articles[i] && articles[i].article_type && articles[i].article_type._id && (articles[i].articleJson !== undefined || articles[i].advanceContent !== undefined)) {
                if( typeIds.indexOf(articles[i].article_type._id) == -1 ) {
                    articles[i].showCrawledText = true;
                }
            }
        }
        return articles;
    },
    articleTypesById: function(articles) {
        var result = {};
        articles.forEach(function(article){
            if(article.article_type._id && !result[article.article_type._id]){
                result[article.article_type._id] = article.article_type;
                result[article.article_type._id].count = 1;
                if(!result[article.article_type._id].plural){
                    result[article.article_type._id].plural = result[article.article_type._id].name;
                }
            }else if(article.article_type._id){
                result[article.article_type._id].count++;
            }
        });
        return result;
    }
};


Meteor.impact = {
    getCommentariesAndEditorialTypeIds: function() {
        return ['PxXCzMrRgnm4LJfz9','GZwKzxk2PgcKycbNF','DtafcmBcwi5RKtfi6','SQJkMnvsWEBYzKQBr', 'jxHErCBv4iEQRd8nY', 'dSRSmvMuYaX6tmBD7'];
    },
    hideAccepted: function(article) {
        var typeIds = Meteor.impact.getCommentariesAndEditorialTypeIds();
        if( article && article.history && article.article_type && article.article_type._id ){
            // Commentaries and Editorials, Commentary, Editorial, Editorial Comment, Editorial Interview, Letter to the Editor
            if( typeIds.indexOf(article.article_type._id) != -1 ){
                var filteredHistory = {};
                for(var key in article.history){
                    if( key != 'accepted' ){
                        filteredHistory[key] = article.history[key];
                    }
                }
                article.history = filteredHistory;
            }
        }

        return article;
    },
    hideFullText: function(article) {
        var typeIds = Meteor.impact.getCommentariesAndEditorialTypeIds();
        if( article && article.article_type && article.article_type._id && article.files && article.files.xml && article.files.xml.file ){
            if( typeIds.indexOf(article.article_type._id) != -1 ){
                article.files.xml.display = false;
            }
        }

        return article;
    },
    limitedTocForPaperTypes: function(article, fullText) {
        if( article && article.article_type && article.article_type._id ){
            if( article.article_type._id === 'zBhBSXX5HTpDN2Wyb' || article.article_type._id === 'quAmLJarW5DBMWXXB'){
                if(fullText.sections){
                    fullText.sections.forEach(function(section){
                        var titleDisplayPattern = /(Acknowledgements|Conflict of Interests Statement|References)/;
                        if(section.title && !section.title.match(titleDisplayPattern)){
                            section.hideTitleInToc = true;
                        }
                    });
                }
            }
        }

        return fullText;
    },
    showToc: function(articleData){
        if(articleData && articleData.article_type) {
            if(['research_paper', 'review', 'research_perspective', 'priority_research_paper'].indexOf(articleData.article_type.short_name) > -1) {
                return true;
            }
        }
        return;
    },
    altInstance: function(){
        if(Meteor.settings.public && Meteor.settings.public.alt === true){
            return true;
        }
        return false;
    },
    redirectForAlt: function() {
        // For instances that are only using alt search page
        if(Meteor.settings.public && Meteor.settings.public.alt === true){
            Router.go('/search-alt');
        }
    }
};

Meteor.article = {
    readyData: function(article){
        var typesToHide;

        if(!article.volume && article.issue_id){
            // for display purposes
            var issueInfo = issues.findOne();
            article.volume = issueInfo.volume;
            article.issue = issueInfo.issue;
        }
        if(!article.vi && article.volume && article.issue){
            article.vi = 'v' + article.volume + 'i' + article.issue;
        }

        if(article.files){
            article.files = Meteor.article.linkFiles(article.files, article._id);
        }

        if(article.ids && article.ids.doi && _.isString(article.ids.doi)) {
            article.ids.doi = article.ids.doi.replace(/http:\/\/dx\.doi\.org\//,"");
        }

        // Abstract
        // ------------
        // certain paper types should not display abstract on 'abstract' page, this is just a landing page for LinkOut
        if( article.article_type && article.article_type._id){
            typesToHide = Meteor.impact.getCommentariesAndEditorialTypeIds();
            if(typesToHide.indexOf(article.article_type._id) != -1 ){
                article.abstract = null;
            }
        }

        // Dates/History
        // ---------------
        article = Meteor.impact.hideAccepted(article);

        // Full Text
        article = Meteor.impact.hideFullText(article);

        // Authors
        // ---------------
        var availableLabels = ['*','#'];
        for(authIdx=0; authIdx < article.authors.length; authIdx++) {
            // If no affiliation_numbers saved for author and there is only 1 affiliation
            if(article.affiliations && article.affiliations.length === 1 && !article.authors[authIdx].affiliations_numbers) {
                article.authors[authIdx].affiliations_numbers = [0];
            }
            else if(article.affiliations && article.affiliations.length === 1 && article.authors[authIdx].affiliations_numbers && article.authors[authIdx].affiliations_numbers.length === 0){
                article.authors[authIdx].affiliations_numbers = [0];
            }

            // Author Notes
            if(article.authors[authIdx].author_notes_ids && article.author_notes) {
                article.authors[authIdx].author_notes = [];
                for(var authorNoteIdx=0; authorNoteIdx<article.authors[authIdx].author_notes_ids.length;authorNoteIdx++) {
                    for(var noteIdx=0; noteIdx<article.author_notes.length;noteIdx++) {
                        var note = article.author_notes[noteIdx];
                        if(note.id == article.authors[authIdx].author_notes_ids[authorNoteIdx]) {
                            var indexPos = availableLabels.indexOf(note.label);
                            if(indexPos >= 0) {
                                availableLabels.splice(indexPos, 1);
                            }

                            article.authors[authIdx].author_notes.push({
                               'id': note.id,
                               'label': note.label
                            });
                        }
                    }
                }
            }
        }
        for(authIdx=0; authIdx < article.authors.length; authIdx++) {
            if(article.authors[authIdx].equal_contrib === true) {
                article.equal_contribs = availableLabels[0];
                article.authors[authIdx].equal_contrib = availableLabels[0];
            }
        }

        return article;
    },
    linkFiles:function(files, articleMongoId){
        if(journalConfig.findOne({})){
            if(files === undefined) {
                files = {};
            }

            for(var file in files){
                if(files[file] !== null){
                    if(files[file].file){
                        files[file].url =  journalConfig.findOne({}).assets + file + '/' + files[file].file;
                    }else if(file === 'supplemental'){
                        for(var f in files[file]){
                            if(files[file][f].file)
                            files[file][f].url =  journalConfig.findOne({}).assets_supplemental + '/' + files[file][f].file;
                        }
                    }else if(file === 'figures' || file === 'tables'){
                        for(var f in files[file]){
                            if(files[file][f].file)
                            files[file][f].url =  journalConfig.findOne({}).assets_figures + '/' + files[file][f].file;
                        }
                    }
                }
            }
            files.journal = journalConfig.findOne({}).journal.short_name;
            files._id = articleMongoId;
        }
        return files;
    },
    pageTitle: function(articleId){
        var articleTitle = '',
            articleTitlePlain = '',
            article,
            tmp;
        article = articles.findOne({'_id': articleId});
        if(article){
            articleTitle = article.title;
            tmp = document.createElement('DIV');
            tmp.innerHTML = articleTitle;
            articleTitlePlain = tmp.textContent || tmp.innerText || '';
        }
        return articleTitlePlain;
    },
    affiliationsNumbers: function(article){
        if(article.authors){
            var authorsList = article.authors;
            var affiliationsList = article.affiliations;
            for(var i = 0 ; i < authorsList.length ; i++){
                if(article.authors[i].affiliations_numbers){
                    article.authors[i].affiliations_numbers = [];
                    var authorAffiliations = article.authors[i].affiliations;
                    for(var a = 0 ; a < authorAffiliations.length ; a++){
                        article.authors[i].affiliations_numbers.push(parseInt(affiliationsList.indexOf(authorAffiliations[a]) + 1));
                    }
                }
            }
        }
        return article;
    },
    subscribeModal: function(e){
        e.preventDefault();
        $("#subscribe-modal").openModal();
        var mongoId = $(e.target).data('id');
        var articleData = articles.findOne({'_id':mongoId});
        Session.set('articleData',articleData);
    },
    setFullTextVariable: function(article, result){
        var mongoId = article._id;
        Session.set('article-text', null);
        Meteor.call('getFilesForFullText', mongoId, function(error, xmlResult) {
            result = xmlResult.convertedXml || {};
            if(xmlResult && xmlResult.lastModified){
                Session.set('article-text-modified', xmlResult.lastModified);
            }

            result.abstract = article.abstract;
            if(article.advanceContent) {
                result.advanceContent = Spacebars.SafeString(article.advanceContent).string;
            }

            result = Meteor.impact.limitedTocForPaperTypes(article, result);

            Session.set('article-text', result);
        });
    },
    readyFullText: function(mongoId){
        // console.log('...readyFullText',mongoId);
        var result = {};
        var article = articles.findOne({
            '_id': mongoId
        });
        var files;
        var xmlUrl;

        if(article){
            if(article.articleJson) {
                Session.set('article-text', null);
                result = article.articleJson;
                result.abstract = article.abstract;
                if(result && result.sections) {
                    var casePattern = /(INTRODUCTION|RESULTS|DISCUSSION|METHODS|CONCLUSION)/;
                    var suppCasePattern = /(SUPPLEMENTAL|SUPPLEMENTARY|Supplementary|Supplemental|SUPPLEMETAL)/;

                    for(var idx=0; idx < result.sections.length; idx++) {
                        str = result.sections[idx].title;
                        if(str){
                            if(str.match(/MATERIALS AND METHOD(S*)/)){
                                str = 'Materials and Methods';
                            }
                            else if(str.match(casePattern)){
                                str = str.toLowerCase();
                                str = str.charAt(0).toUpperCase() + str.slice(1);
                            }
                            else if(str.match(suppCasePattern)){
                                str = 'Supplementary Materials';
                            }
                            else if(str.match(/EXPERIMENTAL PROCEDURES/i)){
                                str = 'Materials and Methods';
                            }
                            else if(str.match(/ACKNOWLEDGEMENTS/i)){
                                str = 'Acknowledgements';
                            }

                        }

                        result.sections[idx].title = str;
                    }
                }

                Session.set('article-text', result);
            } else {
                if(Session.get('article-text') && Session.get('article-text').mongo && Session.get('article-text').mongo != mongoId || !Session.get('article-text')){
                    // Will SET full text session variable and article-text-modified session variable
                    // this conditional checks if the session variable for full text matches the request, if not then reparse XML OR session variable for full text does not exist
                    Meteor.article.setFullTextVariable(article, result);
                } else if(Session.get('article-text') && Session.get('article-text').mongo && Session.get('article-text').mongo === mongoId){
                    // Will SET full text session variable and article-text-modified session variable ONLY IF last-modified date has changed
                    // this conditional is for when the request matches the exisiting session variable for full text.
                    // Now make sure that the last-modified date has not changed, if so then reset session variable

                    // option 1: use DB last_update
                    // use the last_update property in the article doc to determine if we should reparse. This will get reset when new XML is uploaded. possible problem - timezone

                    // option 2: Go directly to XML to get last-modified
                    if(article.files && article.files.xml){
                        files = Meteor.article.linkFiles(article.files, mongoId);
                        if(files && files.xml && files.xml.url){
                            xmlUrl = files.xml.url;
                            // if(mongoId === 'MHpmpbTNuNqLnCN9g'){
                            //     xmlUrl = 'https://s3-us-west-1.amazonaws.com/paperchase-aging/test/101047-p.xml';
                            // }
                            Meteor.http.get( xmlUrl,function(getXmlError, xmlRes){
                                // just check header for modified date
                                if(xmlRes && xmlRes.headers['last-modified'] && xmlRes.headers['last-modified'] != Session.get('article-text-modified')){
                                    Meteor.article.setFullTextVariable(article, result);
                                }
                            });
                        }
                    }
                    // option 3: add last-modified property to xml in article doc
                } else {
                    // requested matches exting session variable for full text
                }
            }
        }

    },
    breadcrumbParent: function(data) {
        if(data && data.article && data.article.advance === true) {
           return 'Advance';
        }else{
           return 'Issue';
        }
    }
};

Meteor.formActions = {
    saving: function(message){
        Session.set('statusModalAction','Saving');
        Session.set('statusModalDetails',message);

        // inline messages
        $('.save-btn').addClass('hide');
        $('.saving').removeClass('hide');
        $('.success').addClass('hide');
        $('.error').addClass('hide');
        //sending and saving forms have shared class names

        // invalid notification
        $('fieldset').removeClass('invalid');


        //fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').addClass('hide');
            $('#fixed-save-btn').find('.show-wait').removeClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').addClass('hide');
            $('#save-btn').find('.show-wait').removeClass('hide');
        }


        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }
        if($('#saving-modal').length){
            $('#saving-modal').openModal({
                dismissible: false
            });
        }


        //reset
        Session.set('errorMessages',null);
        $('input').removeClass('invalid');
        $('textarea').removeClass('invalid');
        $('input').removeClass('valid');
        $('textarea').removeClass('valid');
    },
    processing: function(message){
        Session.set('statusModalAction','Processing');
        Session.set('statusModalDetails',message);

        // inline messages
        $('.save-btn').addClass('hide');
        $('.saving').removeClass('hide');
        $('.success').addClass('hide');
        $('.error').addClass('hide');
        //sending and saving forms have shared class names

        // invalid notification
        $('fieldset').removeClass('invalid');


        //fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').addClass('hide');
            $('#fixed-save-btn').find('.show-wait').removeClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').addClass('hide');
            $('#save-btn').find('.show-wait').removeClass('hide');
        }


        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }

        if($('#saving-modal').length){
            $('#saving-modal').openModal({
                dismissible: false
            });
        }


        //reset
        Session.set('errorMessages',null);
        $('input').removeClass('invalid');
        $('textarea').removeClass('invalid');
        $('input').removeClass('valid');
        $('textarea').removeClass('valid');
    },
    updating: function(message){
        Session.set('statusModalAction','Updated');
        Session.set('statusModalDetails',message);

        // inline messages
        $('.save-btn').addClass('hide');
        $('.saving').removeClass('hide');
        $('.success').addClass('hide');
        $('.error').addClass('hide');
        //sending and saving forms have shared class names

        // invalid notification
        $('fieldset').removeClass('invalid');


        //fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').addClass('hide');
            $('#fixed-save-btn').find('.show-wait').removeClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').addClass('hide');
            $('#save-btn').find('.show-wait').removeClass('hide');
        }

        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }

        if($('#saving-modal').length){
            $('#saving-modal').openModal({
                dismissible: false
            });
        }

        //reset
        Session.set('errorMessages',null);
        $('input').removeClass('invalid');
        $('textarea').removeClass('invalid');
        $('input').removeClass('valid');
        $('textarea').removeClass('valid');
    },
    searching: function(message){
        Session.set('statusModalAction','Searching');
        Session.set('statusModalDetails',message);

        // inline messages
        $('.save-btn').addClass('hide');
        $('.saving').removeClass('hide');
        $('.success').addClass('hide');
        $('.error').addClass('hide');
        //sending and saving forms have shared class names

        // invalid notification
        $('fieldset').removeClass('invalid');


        //fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').addClass('hide');
            $('#fixed-save-btn').find('.show-wait').removeClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').addClass('hide');
            $('#save-btn').find('.show-wait').removeClass('hide');
        }

        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }

        if($('#saving-modal').length){
            $('#saving-modal').openModal({
                dismissible: false
            });
        }

        //reset
        Session.set('errorMessages',null);
        $('input').removeClass('invalid');
        $('textarea').removeClass('invalid');
        $('input').removeClass('valid');
        $('textarea').removeClass('valid');
    },
    invalid: function(invalidData){
        var invalidString = '';
        for(var i=0 ; i < invalidData.length ; i++){
            $('#' + invalidData[i].fieldset_id).addClass('invalid');

            invalidString += invalidData[i].message + '    ';
            if(i === 0){
                var scrollToEl = 'body';
                if(invalidData[i].fieldset_id && $('#' + invalidData[i].fieldset_id).length > 0){
                    scrollToEl = '#' + invalidData[i].fieldset_id; // I believe this is deprecated, but lets leave it here for now and check for existence
                }else if(invalidData[i].input_id && $('#' + invalidData[i].input_id).length > 0){
                    scrollToEl = '#' + invalidData[i].input_id;
                }
                // console.log('scrollToEl = ', scrollToEl);
                $('html, body').animate({
                    scrollTop: $(scrollToEl).position().top - 50
                }, 500);
            }
        }

        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').addClass('hide');
        $('.error').removeClass('hide');

        // fixed save button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // save button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        Session.set('statusModalAction','Invalid');
        Session.set('statusModalDetails',invalidString);
    },
    invalidMessage: function(message, invalidList){
        Session.set('statusModalAction','<i class="material-icons">&#xE000;</i> Error');
        Session.set('statusModalDetails',message);

        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').addClass('hide');
        $('.error').removeClass('hide');

        // add message to template
        $('.error-message').html(message);

        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        // add invalid to inputs
        invalidList.forEach(function(invalidObj){
            var className = '',
                keySplit;
            if(invalidObj.name.indexOf('.') != -1){
                // nested object is invalid
                keySplit = invalidObj.name.split('.');
                className = keySplit[1]; // 2nd item in array will be the nested key
            }else{
                className = invalidObj.name;
            }
            $('.form-' + className).addClass('invalid');
        });

        // modals
        if($('#saving-modal').length){
            $('#saving-modal').closeModal();
        }
        if($('#error-modal').length){
            $('#error-modal').openModal({
                dismissible: true
            });
        }
    },
    error: function(){
        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').addClass('hide');
        $('.error').removeClass('hide');

        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }
    },
    errorMessage: function(message){
        Session.set('statusModalAction','<i class="material-icons">&#xE000;</i> Error');
        Session.set('statusModalDetails',message);

        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').addClass('hide');
        $('.error').removeClass('hide');

        // add message to template
        $('.error-message').html(message);

        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        // modals
        if($('#saving-modal').length){
            $('#saving-modal').closeModal();
        }
        if($('#error-modal').length){
            $('#error-modal').openModal({
                dismissible: true
            });
        }
    },
    success: function(){
        // inline messages
        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').removeClass('hide');
        $('.error').addClass('hide');


        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        // modals
        if($('#success-modal').length){
            $('#success-modal').openModal({
                dismissible: true
            });
        }
        if($('#saving-modal').length){
            $('#saving-modal').closeModal();
        }
    },
    resultMessage: function(message){
        Session.set('statusModalAction','Result');
        Session.set('statusModalDetails',message);
        // inline messages
        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').removeClass('hide');
        $('.error').addClass('hide');

        $('.success-message').text(message);

        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        // modals
        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }
        if($('#saving-modal').length){
            $('#saving-modal').closeModal({
                complete: function(){
                    if($('#success-modal').length){
                        $('#success-modal').openModal({
                            ready: function(){
                            }
                        });
                    }
                }
            });
        }else if($('#success-modal').length){
            $('#success-modal').openModal();
        }
    },
    successMessage: function(message){
        Session.set('statusModalAction','<i class="material-icons">&#xE86C;</i> Saved');
        Session.set('statusModalDetails',message);
        // inline messages
        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').removeClass('hide');
        $('.error').addClass('hide');

        $('.success-message').text(message);

        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        // modals
        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }
        if($('#saving-modal').length){
            $('#saving-modal').closeModal({
                complete: function(){
                    if($('#success-modal').length){
                        $('#success-modal').openModal({
                            ready: function(){
                            }
                        });
                    }
                }
            });
        }else if($('#success-modal').length){
            $('#success-modal').openModal();
        }
    },
    updatedMessage: function(message){
        Session.set('statusModalAction','<i class="material-icons">&#xE86C;</i> Updated');
        Session.set('statusModalDetails',message);
        // inline messages
        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').removeClass('hide');
        $('.error').addClass('hide');

        $('.success-message').text(message);

        // fixed saved button
        if($('#fixed-save-btn').length){
            $('#fixed-save-btn').find('.show-save').removeClass('hide');
            $('#fixed-save-btn').find('.show-wait').addClass('hide');
        }
        // saved button
        if($('#save-btn').length){
            $('#save-btn').find('.show-save').removeClass('hide');
            $('#save-btn').find('.show-wait').addClass('hide');
        }

        // modals
        if($('#status-modal').length){
            $('#status-modal').openModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }
        if($('#saving-modal').length){
            $('#saving-modal').closeModal({
                complete: function(){
                    if($('#success-modal').length){
                        $('#success-modal').openModal({
                            ready: function(){
                            }
                        });
                    }
                }
            });
        }else if($('#success-modal').length){
            $('#success-modal').openModal();
        }
    },
    removePastedStyle: function(e){
        e.preventDefault();
        // console.log('..removePastedStyle');
        // for Wysiwyg
        //remove styling. paste as plain text. avoid problems when pasting from word or with font sizes.
        var bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
        document.execCommand('insertText', false, bufferText);
    },
    closeModal: function(){
        $('.save-btn').removeClass('hide');
        $('.saving').addClass('hide');
        $('.success').removeClass('hide');
        $('.error').addClass('hide');
        if($('#status-modal').length){
            $('#status-modal').closeModal({
                complete: function() {
                    $('.lean-overlay').remove();
                }
            });
        }
    }
};

Meteor.ip = {
    dot2num: function(dot){
        var d = dot.split('.');
        return ((((((+d[0])*256)+(+d[1]))*256)+(+d[2]))*256)+(+d[3]);
    },
    num2dot: function(num) {
        var d = num%256;
        for (var i = 3; i > 0; i--) {
            num = Math.floor(num/256);
            d = num%256 + '.' + d;
        }
        return d;
    }
};

Meteor.clean = {
    cleanString: function(string){
        if(string){
            string = string.replace(/<italic>/g,'<i>').replace(/<\/italic>/g,'</i>');
            string = string.replace(/(\r\n|\n|\r)/gm,''); // line breaks
            if(string.charAt(string.length - 1) === '.'){
                string = string.substring(0, string.length-1);
            }
            string = string.trim();
        }
        return string;
    },
    cleanWysiwyg: function(input){
        return input.replace(/&nbsp;/g,' ').replace(/<br>/g,'').replace(/<p[^>]*>/g,'').replace(/<\/p[^>]*>/g,'').trim();
    },
    removeSpaces: function(string){
        return string.replace(/\s+/g,'');
    },
    removeExtraSpaces: function(string){
        return string.replace(/\s\s+/g, ' ');
    },
    newLinesToSpace: function(string){
        return string.replace(/(\r\n|\n|\r)/gm,' ');
    },
    removeNewLines: function(string){
        return string.replace(/(\r\n|\n|\r)/gm,'');
    },
    dashesToUnderscores: function(string){
        return string.replace(/-/g,'_');
    },
    removeEndPeriod: function(string){
        if(string){
            if(string.charAt(string.length - 1) === '.'){
                string = string.substring(0, string.length-1);
            }
        }
        return string;
    }
};

Meteor.general = {
    navHeight: function(){
        return $('.navigation').height() + $('.sub-nav').height() + 80;
    },
    footerHeight: function(){
        return $('footer').height();
    },
    scrollAnchor: function(e){
        e.preventDefault();
        var anchor = $(e.target).closest('a').attr('href');
        if(anchor){
            anchor = anchor.replace('#','');
            Meteor.general.scrollTo(anchor);
        }
    },
    scrollTo: function(anchorId){
        var navTop = Meteor.general.navHeight();
        $('html, body').animate({
            scrollTop: $('#' + anchorId).position().top - navTop - 25
        }, 500);
    },
    scrollToPosition: function(position){
        $('html, body').animate({
            scrollTop: position
        }, 500);
    },
    isStringEmpty: function(string){
        // console.log('isStringEmpty',string);
        string = string.replace(/\r?\n|\r(^\s+|\s+$)+/g,'').replace(/\s/g, '');
        if(string === ''){
            return true;
        }else{
            return false;
        }
    },
    cleanString: function(string){
        if(string){
            string = string.replace(/<italic>/g,'<i>').replace(/<\/italic>/g,'</i>');
            string = string.replace(/(\r\n|\n|\r)/gm,''); // line breaks
            string = string.replace(/\s+/g,' '); // remove extra spaces
            if(string.charAt(string.length - 1) === '.'){
                string = string.substring(0, string.length-1);
            }
        }

        return string;
    },
    affix: function() {
        var sticky = $('.fixed-scroll-card');
        if (sticky.length > 0) {
            var stickyHeight = sticky.height();
            var sidebarTop = parseInt(sticky.offset().top - 10) ;
        }

        // on scroll affix the sidebar
        $(window).scroll(function () {
            if (sticky.length > 0) {
                var scrollTop = $(window).scrollTop() + 190;

                if (sidebarTop < scrollTop) {
                    sticky.addClass('fixed-active');
                }
                else {
                    sticky.removeClass('fixed-active');
                }
            }
        });

        $(window).resize(function () {
            if (sticky.length > 0) {
                stickyHeight = sticky.height();
            }
        });
    },
    scrollspy: function() {
        var lastId,
        menu = $(".scrollspy"),
        navHeight = 250,

        // All list items
        menuItems = menu.find("a"),

        // Anchors corresponding to menu items
        scrollItems = menuItems.map(function(){
          var item = $($(this).attr("href"));
          if (item.length) { return item; }
        });

        // Bind to scroll
        $(window).scroll(function(){
           // Get container scroll position
           var fromTop = $(this).scrollTop() + navHeight;

           // Get id of current scroll item
           var cur = scrollItems.map(function(){
             if ($(this).offset().top < fromTop)
               return this;
           });
           // Get the id of the current element
           cur = cur[cur.length-1];
           var id = cur && cur.length ? cur[0].id : "";

           if (lastId !== id) {
               lastId = id;
               // Set/remove active class
               menuItems
                 .parent().removeClass("active")
                 .end().filter("[href='#"+id+"']").parent().addClass("active");
           }
        });
    },
    findLink: function(string){
        var urlRegex = /(https?:\/\/[^\s)]+)/g;
        return string.replace(urlRegex, function(url) {
            return '<a href="' + url + '" target="_BLANK">' + url + '</a>';
        });
    },
    getFirstXFromArray: function(x, array){
        return array.slice(0, x);
    },
    numberToWord: function(int) {
        //http://stackoverflow.com/questions/14766951/convert-digits-into-words-with-javascript
        if (int === 0) return 'zero';

        var ONES  = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
        var TENS  = ['','','twenty','thirty','fourty','fifty','sixty','seventy','eighty','ninety'];
        var SCALE = ['','thousand','million','billion','trillion','quadrillion','quintillion','sextillion','septillion','octillion','nonillion'];

        // Return string of first three digits, padded with zeros if needed
        function get_first(str) {
          return ('000' + str).substr(-3);
        }

        // Return string of digits with first three digits chopped off
        function get_rest(str) {
          return str.substr(0, str.length - 3);
        }

        // Return string of triplet convereted to words
        function triplet_to_words(_3rd, _2nd, _1st) {
          return (_3rd == '0' ? '' : ONES[_3rd] + ' hundred ') + (_1st == '0' ? TENS[_2nd] : TENS[_2nd] && TENS[_2nd] + '-' || '') + (ONES[_2nd + _1st] || ONES[_1st]);
        }

        // Add to words, triplet words with scale word
        function add_to_words(words, triplet_words, scale_word) {
          return triplet_words ? triplet_words + (scale_word && ' ' + scale_word || '') + ' ' + words : words;
        }

        function iter(words, i, first, rest) {
          if (first == '000' && rest.length === 0) return words;
          return iter(add_to_words(words, triplet_to_words(first[0], first[1], first[2]), SCALE[i]), ++i, get_first(rest), get_rest(rest));
        }

        return iter('', 0, get_first(String(int)), get_rest(String(int)));
    }
};

Meteor.sorter = {
    sort: function(unordered,order){
        // console.log('..SORT');
        // console.log(order);
        // for when we have the array of Mongo IDs and array of items to sort
        var ordered = [];
        for(var i = 0 ; i < order.length ; i++){
          // console.log(order[i]);
          for(var a = 0 ; a < unordered.length ; a++){
            if(unordered[a]._id == order[i]){
              ordered.push(unordered[a]);
            }
          }
        }
        // console.log(ordered);
        return ordered;
    }
};

Meteor.dates = {
    article: function(date){
        // console.log('Article Date:', typeof date, date);
        date = new Date(date);
        // console.log(date);
        // console.log(moment(utcDate,'ddd, DD MMM YYYY HH:mm:ss ZZ'));
        return moment(date).utc().format('MMMM D, YYYY');
    },
    articleCsv: function(date){
        date = new Date(date);
        return moment(date).utc().format('MM-D-YYYY'); // cannot use commas for csv date. they will be considered as new columns.
    },
    inputForm: function(date){
      return moment(date).utc().format('YYYY/MM/DD');
    },
    wordDate: function(date){
        return moment(date).tz('America/New_York').format('MMMM D, YYYY');
    },
    dateSpan: function( dateStart, dateEnd ){
        if( dateStart && dateEnd && dateStart.getDate() === dateEnd.getDate() ){
            return moment(dateStart).format('MMMM D, YYYY');
        }
        else if( dateStart && dateEnd && dateStart.getMonth() === dateEnd.getMonth() &&  dateStart.getYear() === dateEnd.getYear() ){
            return moment(dateStart).format('MMMM D') + ' - ' + moment(dateEnd).format('D, YYYY');
        }
        else if( dateStart && dateEnd && dateStart.getMonth() != dateEnd.getMonth() &&  dateStart.getYear() === dateEnd.getYear() ){
            return moment(dateStart).format('MMMM D') + ' - ' + moment(dateEnd).format('MMMM D, YYYY');
        }
        else if( dateStart && dateEnd && dateStart.getYear() != dateEnd.getYear() ){
            return moment(dateStart).format('MMMM D, YYYY') + ' - ' + moment(dateEnd).format('MMMM D, YYYY');
        }
        return;
        // return moment(date).tz('America/New_York').format(' D, YYYY');
    },
    dashedToWord: function(date){
        date = Meteor.dates.dashedToDate(date);
        return moment(date).tz('America/New_York').format('MMMM D, YYYY');
    },
    dashedToDate: function(date){
        var datePieces = date.split('-');
        for(var piece=0 ; piece < datePieces.length ; piece++){
            if(datePieces[piece].length == 1){
                datePieces[piece] = '0' + datePieces[piece];
            }
        }
        dateFixed = datePieces.join('-');
        var d = new Date(dateFixed + 'T06:00:00.000Z');
        return d;
    },
    initiateDatesInput: function(){
        $('.datepicker').each(function(i){
            var datePlaceholderFormat = 'mmmm d, yyyy';
            var placeholder = $(this).attr('placeholder');
            var pick = $(this).pickadate({
                format: datePlaceholderFormat
            });
            var picker = pick.pickadate('picker');
            picker.set('select', $(this).data('value'), { format: 'yyyy/mm/dd' });
        });
    },
    zeroBasedMonth: function(month){
        return parseInt(month - 1);
    }
};

Meteor.issue = {
    urlPieces: function(vi){
        var res,
            pieces;
        if(vi){
            pieces = vi.match('v([0-9]+)i(.*)');
            if(pieces){
                res = {volume : pieces[1], issue : pieces[2]};
            }
        }

        return res;
    },
    coverPath : function(assetUrl,fileName){
        return assetUrl + 'covers/' + fileName;
    },
    linkeableIssue: function(issue){
        return issue.replace(/\//g,'_');
    },
    createIssueParam: function(volume,issue){
        return 'v' + volume + 'i' + issue;
    }
};

Meteor.advance = {
    articlesBySection: function(articlesList){
        var articlesBySection = {};
        articlesList.forEach(function(article){
            if(!articlesBySection[article.section_name]){
                articlesBySection[article.section_name] = [];
            }
            articlesBySection[article.section_name].push(article);
        });
        return articlesBySection;
    },
    dataForSectionsPage: function(){
        var sorted  = sorters.findOne({name:'advance'});
        var res = [];
        var advanceSections = Meteor.advance.articlesBySection(sorted.articles);
        for(var section in advanceSections){
            res.push({section: section, articles_count: advanceSections[section].length, articles: advanceSections[section]});
        }
        return res;
    },
    orderViaAdmin: function(){
        var order = [];
        $('.article').each(function(){
            order.push($(this).attr('data-article-id'));
        });
        return order;
    },
    getSectionsOrderViaAdmin: function(){
        var sectionsOrder = [];
        $('.advance-section').each(function(){
            sectionsOrder.push($(this).attr('data-name'));
        });
        return sectionsOrder;
    }
};

Meteor.search = {
    bounceTo: function(args) {
        Router.go("/search/?terms="+args.terms);
    }
};

Meteor.googleAnalytics = {
    // authorize: function(event){
    // not using now. might add later to get reports from GA into paperchase
    //     var CLIENT_ID = '74807910';
    //     var VIEW_ID = '123186651>';
    //     var DISCOVERY = 'https://analyticsreporting.googleapis.com/$discovery/rest';
    //     var SCOPES = ['https://www.googleapis.com/auth/analytics.readonly'];
    //     // Handles the authorization flow.
    //     // `immediate` should be false when invoked from the button click.
    //     var useImmdiate = event ? false : true;
    //     var authData = {
    //         client_id: CLIENT_ID,
    //         scope: SCOPES,
    //         immediate: useImmdiate
    //     };

    //     gapi.auth.authorize(authData, function(response) {
    //         var authButton = document.getElementById('auth-button');
    //         if (response.error) {
    //             authButton.hidden = false;
    //         } else {
    //             authButton.hidden = true;
    //             queryReports();
    //         }
    //     });
    // },
    // queryReports: function(){
    // not using now. might add later to get reports from GA into paperchase
    //     var CLIENT_ID = '74807910';
    //     var VIEW_ID = '123186651>';
    //     var DISCOVERY = 'https://analyticsreporting.googleapis.com/$discovery/rest';
    //     // Load the API from the client discovery URL.
    //     gapi.client.load(DISCOVERY
    //     ).then(function() {

    //         // Call the Analytics Reporting API V4 batchGet method.
    //         gapi.client.analyticsreporting.reports.batchGet( {
    //             reportRequests:[
    //             {
    //                 viewId:VIEW_ID,
    //                 dateRanges:[
    //                     {
    //                         startDate:"7daysAgo",
    //                         endDate:"today"
    //                     }],
    //                 metrics:[
    //                     {
    //                         expression:"ga:sessions"
    //                     }]
    //                 }]
    //             } ).then(function(response) {
    //                 var formattedJson = JSON.stringify(response.result, null, 2);
    //                 document.getElementById('query-output').value = formattedJson;
    //             })
    //         .then(null, function(err) {
    //             // Log any errors.
    //             console.log(err);
    //         });
    //     });
    // },
    sendEvent: function(fullTextCategory, event){
        // console.log('..sendEvent',fullTextCategory,event.target.href)
        ga('send', 'event', {
            eventCategory: fullTextCategory,
            eventAction: 'click',
            eventLabel: event.target.href
        });
    }
};

Meteor.ux = {
    positionSessionVariable: function(template){
        return 'position-' + template;
    },
    savePosition: function(template){
        var templateSessionVariable = Meteor.ux.positionSessionVariable(template);
        Session.set(templateSessionVariable, document.body.scrollTop);
    },
    goToSavePosition: function(template){
        var templateSessionVariable = Meteor.ux.positionSessionVariable(template);
        if( Session.get(templateSessionVariable) ){
            Meteor.general.scrollToPosition(Session.get(templateSessionVariable));
        }
    }
};
