Meteor.organize = {
    arrDiff: function(a1,a2){
        // Find anything different b/w arrays
        var a=[], diff=[];
        for(var i=0 ; i < a1.length ; i++){
            a[a1[i]]=true;
        }
        for(var ii=0 ; ii<a2.length ; ii++){
            if(a[a2[ii]]) delete a[a2[ii]];
            else a[a2[ii]]=true;
        }
        for(var k in a){
            diff.push(k);

        }
        return diff;
    },
    arrayDuplicates: function(arr) {
        var len=arr.length,
            out=[],
            counts={};

        for (var i=0;i<len;i++) {
            var item = arr[i];
            counts[item] = counts[item] >= 1 ? counts[item] + 1 : 1;
            if (counts[item] === 2) {
                out.push(item);
            }
        }
        return out;
    },
    getIssueArticlesByID: function(id){
        // console.log('getIssueArticlesByID');
        var issueArticles = articles.find({'issue_id' : id},{sort : {page_start:1}}).fetch();
        issueArticles = Meteor.organize.groupArticles(issueArticles);
        return issueArticles;
    },
    groupArticles: function(articles) {
        var grouped = [];
        for(var i = 0 ; i < articles.length ; i++){
            var type = ''; //for articles without a type
            if(articles[i].article_type){
                type = articles[i].article_type.short_name;
            }

            if(!grouped[type]){
                grouped[type] = [];
                articles[i].start_group = true;
            }
            //grouped[type].push(articles[i]);
        }
        return articles;
    },
    articlesByMongoId: function(articles) {
        var articlesObj = {};
        articles.forEach(function(article){
            articlesObj[article._id] = article;
        });
        return articlesObj;
    }
};

Meteor.article = {
    readyData: function(article){
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

        // Authors
        // ---------------
        var availableLabels = ['*','#'];
        if(article.authors){
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
        }
        return article;
    },
    linkFiles:function(files,articleMongoId){
        var journal = journalConfig.findOne({});
        if(files === undefined) {
            files = {};
        }

        for(var file in files){
            if(files[file] && files[file].file){
                files[file].url =  journal.assets + file + '/' + files[file].file;
            }else if(file === 'supplemental'){
                for(var f in files[file]){
                    if(files[file][f].file)
                    files[file][f].url =  journal.assets_supplemental + '/' + files[file][f].file;
                }
            }else if(file === 'figures'){
                for(var ff in files[file]){
                    if(files[file][ff].file){
                        // not optimized
                        files[file][ff].url =  journal.assets_figures + '/' + files[file][ff].file;
                    }

                    if (files[file][ff].optimized && files[file][ff].optimized_file && files[file][ff].optimized_sizes) {
                        files[file][ff].optimized_urls = {};
                        for (var size in files[file][ff].optimized_sizes) {
                            files[file][ff].optimized_urls[size] = journal.s3.domain + journal.s3.bucket + '/' + journal.s3.folders.article.figures_optimized + '/' + size + '/' + files[file][ff].optimized_file;
                        }
                    }
                }
            }
        }
        files.journal = journalConfig.findOne({}).journal.short_name;
        files._id = articleMongoId;
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
    readyFullText: function(mongoId){
        var article = articles.findOne({
            '_id': mongoId
        });

        if(article){
            if(Session.get('article-text') && Session.get('article-text').mongo && Session.get('article-text').mongo != mongoId || !Session.get('article-text')){
                Session.set('article-text', null);
                Meteor.call('getFilesForFullText', mongoId, function(error, result) {
                    result = result || {};
                    result.abstract = article.abstract;
                    result.advanceContent = Spacebars.SafeString(article.advanceContent).string;
                    Session.set('article-text', result);
                });
            }
        }

    }
};

Meteor.formActions = {
    saving: function(message){
        Session.set('statusModalAction','Saving');
        Session.set('statusModalDetails',message);
        Session.set('saving', true);

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
    doneSaving: function(){
        Session.set('saving', false);
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
        Session.set('saving', false);

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
            string = string.trim();
            string = Meteor.clean.removeExtraSpaces(string);
        }
        return string;
    },
    removeEndPeriod: function(string){
        if(string){
            if(string.charAt(string.length - 1) === '.'){
                string = string.substring(0, string.length-1);
            }
        }
        return string;
    },
    cleanWysiwyg: function(input){
        return input.replace(/&nbsp;/g,' ').replace(/<br>/g,'').trim();
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
    scrollToLastChild: function(child){
        if($('.' + child + ':last-child').length !== 0){
            $('html, body').animate({
                scrollTop: $('.' + child + ':last-child').position().top
            }, 500);
        }
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
            picker.set('select', $(this).attr('date'), { format: 'yyyy/mm/dd' });
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
    },
    pages: function(articles){
        // console.log('....pages');
        var pages = {};
        var lowestPageNum =  9999999;
        var highestPageNum = 0;
        for(var idx = 0; idx <  articles.length; idx++) {
            var art = articles[idx];
            // console.log(art.page_start, ' - ', art.page_end);
            if(art.page_start < lowestPageNum) lowestPageNum = art.page_start;
            if(art.page_end > highestPageNum) highestPageNum = art.page_end;
        }

        if(lowestPageNum < 999999) {
            pages.start = lowestPageNum;
        }
        if(highestPageNum > 0) {
            pages.end = highestPageNum;
        }

        return pages;
    }
};

Meteor.advance = {
    articlesBySection: function(articlesList){
        var articlesBySection = {};
        if (articlesList) {
            articlesList.forEach(function(article){
                // console.log(article._id, article.section_id,  article.section_name);
                if(!articlesBySection[article.section_name]){
                    articlesBySection[article.section_name] = [];
                }
                articlesBySection[article.section_name].push(article);
            });
        }

        return articlesBySection;
    },
    dataForSectionsPage: function(articles){
        var articlesBySection = [];

        if (articles) {
            var advanceSections = Meteor.advance.articlesBySection(articles);

            for(var section in advanceSections){
                articlesBySection.push({section: section, articles_count: advanceSections[section].length, articles: advanceSections[section]});
            }
        }
        return articlesBySection;
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
    },
    sortAdvanceSectionsByDate: function(sectionsOrder, articlesList){
        var newOrder = [];
        articlesList.sort(function(a,b){
            var aDate;
            var bDate;
            if(!a.dates || !a.dates.epub){
                aDate = new Date();
            } else {
                aDate = new Date(a.dates.epub);
            }

            if(!b.dates || !b.dates.epub){
                bDate = new Date();
            } else {
                bDate = new Date(b.dates.epub);
            }
            return aDate.getTime() - bDate.getTime();
        });
        articlesList.reverse();

        var articlesBySection = Meteor.advance.articlesBySection(articlesList);
        var mongoIdsBySection = {};

        for(var articleSection in articlesBySection){
            mongoIdsBySection[articleSection] = [];
            articlesBySection[articleSection].forEach(function(article){
                mongoIdsBySection[articleSection].push(article._id);
            });
        }

        sectionsOrder.forEach(function(section){
            newOrder = newOrder.concat(mongoIdsBySection[section]);
        });
        // newOrder = array of Mongo IDs
        return newOrder;
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

Meteor.db = {
    trackUpdates: function(userId, doc, fieldNames, modifier, options){
        var docUpdates = {},
            updatedBy = {};
        docUpdates.updates = [];

        // track updates
        // -------------------
        // maintain previous updates
        if(doc.doc_updates && !doc.doc_updates.updates){
            docUpdates = doc.doc_updates;
            docUpdates.updates = [];
        }
        else if(doc.doc_updates && doc.doc_updates.updates){
            docUpdates = doc.doc_updates;
        }

        // current user update
        if(userId){
            updatedBy.user = userId;
        }
        else if(modifier.$set.ojsUser){
            updatedBy.ojs_user = modifier.$set.ojsUser;
            delete modifier.$set.ojsUser;
        }

        updatedBy.date = new Date();
        docUpdates.updates.push(updatedBy);
        return docUpdates;
    }
};
