Meteor.admin = {
    titleInTable: function(title){
        var txt = document.createElement('textarea');
        txt.innerHTML = title.substring(0,40);
        if(title.length > 40){
            txt.innerHTML += '...';
        }
        return txt.value;
    },
}

Meteor.adminSite = {
    formGetData: function(e){
        // console.log('..adminSite formGetData');
        e.preventDefault();
        var success,
            updateObj = {};
        updateObj.side_nav = [];
        updateObj.section_side_nav = [];
        Meteor.formActions.saving();
        $('input').removeClass('invalid');

        // Main Side Navigation
        // ----------------------
        var sideNavList = []; // Rebuild entire array and objects before inserting into db. because we are using the order of objects to set the order of links when displaying.
        $('.side-nav-option').each(function(){
            var sideNavOption = {};
            // console.log($(this).attr('id'));
            var routeOptionName = $(this).attr('id').replace('-checkbox','');
            // console.log(routeOptionName);
            sideNavOption.route_name = routeOptionName;
            // console.log($('#' + routeOptionName + '-label'));
            sideNavOption.name = $('#' + routeOptionName + '-label')[0].innerText;
            if($(this).is(':checked')){
                sideNavOption.display = true;
            }else{
                sideNavOption.display = false;
            }
            updateObj.side_nav.push(sideNavOption);
        });

        // Section Side Navigation
        // ----------------------
        var sectionSideNavList = []; // Rebuild entire array and objects before inserting into db. because we are using the order of objects to set the order of links when displaying.
        $('.section-nav-option').each(function(){
            var sectionSideNavOption = {};
            // console.log($(this).attr('id'));
            sectionSideNavOption._id = $(this).attr('id');
            if($(this).is(':checked')){
                sectionSideNavOption.display = true;
            }else{
                sectionSideNavOption.display = false;
            }
            updateObj.section_side_nav.push(sectionSideNavOption);
        });

        // TODO: validation
        // console.log(updateObj);
        Meteor.call('siteControlUpdate',updateObj,function(error,result){
            if(error){
                console.log('ERROR - siteControlUpdate');
                console.log(error);
                Meteor.formActions.error();
            }
            if(result){
                Meteor.formActions.success();
            }
        });
        // success = journalConfig.update({_id : Session.get('journal')._id} , {$set: {site : updateObj}});
        // // console.log(success);
        // if(success){
        //  Meteor.formActions.success();
        // }
    },
}

Meteor.adminNews = {
    readyForm: function(){
        // Date
        // ------
        var pick = $('#news-date').pickadate();
        var picker = pick.pickadate('picker');
        picker.set('select', $('#news-date').data('value'), { format: 'yyyy/mm/dd' })

        // Content
        // ------
        $('.news-content').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview','link']]
            ]
        });

        // New Tag
        // --------
        $('.news-tag-input').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['italic','superscript','subscript']],
                ['undo', ['undo', 'redo', 'help']]
            ]
        });
    },
    formGetData: function(e){
        // console.log('..news formGetData');
        e.preventDefault();
        var invalidData = [];
        var newsObj = {},
            newsMongoId,
            success;

        newsObj.title;
        newsObj.content;
        newsObj.date;
        newsObj.youTube;
        newsObj.tags;
        newsObj.interview;
        newsObj.display;

        Meteor.formActions.saving();
        $('input').removeClass('invalid');

        newsMongoId = $('#news-mongo-id').val();

        // Title
        // ------
        newsObj.title = $('#news-title').val();

        // Content
        // ------
        var newsContent = $('.news-content').code();
        newsContent = Meteor.formActions.cleanWysiwyg(newsContent);
        if(newsContent != ''){
            newsObj.content = newsContent;
        }

        // Date
        // ------
        var newsDate = $('#news-date').val();
        if(newsDate){
            newsDate = new Date(newsDate);
            newsObj.date = newsDate;
        }

        // YouTube
        // ------
        var youTube = $('#news-youtube').val();
        if(youTube.indexOf('http') != -1){
            var invalidObj = {
                'input_id' : 'news-youtube',
                'message' : 'YouTube ID cannot include http. Please only include the ID, for ex: eEp7km4t4Qk'
            }
            invalidData.push(invalidObj);
        }else{
            newsObj.youTube = youTube;
        }

        // Tags
        // ------
        newsObj.tags = [];
        $('.news-tag-text').each(function(){
            // console.log($(this).html());
            newsObj.tags.push($(this).html());
        });

        // Interview
        // ------
        newsObj.interview = $('#news-interview').is(':checked');

        // Display
        // ------
        newsObj.display = $('#news-display').is(':checked');

        // console.log(newsObj);

        // Update/Insert/Invalid
        // ------
        if(invalidData.length > 0){
            Meteor.formActions.invalid(invalidData);
        }else{
            Meteor.adminNews.save(newsMongoId, newsObj);
        }
    },
    save: function(newsMongoId, newsObj){
        Meteor.call('realYouTubeVideo', newsObj.youTube, function(error,result){
            if(error){
                // console.error('YouTube ID check',error);
                Meteor.formActions.errorMessage('Could not save news.<br>The YouTube ID does not produce a video. Please verify that the ID is correct.');
            }else{
                if(!newsMongoId){
                    Meteor.call('addNews',newsObj,function(error,result){
                        if(error){
                            Meteor.formActions.errorMessage('Could not add news', error);
                        }else if(result){
                            Meteor.formActions.successMessage('News Added');
                        }
                    });
                }else{
                    Meteor.call('updateNews',newsMongoId, newsObj,function(error,result){
                        if(error){
                            Meteor.formActions.errorMessage('Could not update news', error);
                        }else if(result){
                            Meteor.formActions.successMessage('News Updated');
                        }
                    });
                }
            }
        });
    },
    showAddNewTag: function(e){
        e.preventDefault();
        $('#row-tag-btn').addClass('hide');
        $('#row-tag-input').removeClass('hide');
    },
    hideAddNewTag: function(e){
        e.preventDefault();
        $('#row-tag-btn').removeClass('hide');
        $('#row-tag-input').addClass('hide');
    }
}

Meteor.adminEdBoard = {
    formPrepareData: function(mongoId){
        var member = {};
        if(mongoId){
            member = edboard.findOne({_id : mongoId});
        }
        var edboardRoles = journalConfig.findOne().edboard_roles;
        var edboardRolesTemp = [];
        for(var r=0 ; r<edboardRoles.length ; r++){
            var roleObj = {
                name: edboardRoles[r]
            }
            if(member.role && $.inArray(roleObj.name, member.role) > -1){
                roleObj['selected'] = true;
            }
            edboardRolesTemp.push(roleObj);
        }
        member.roles = edboardRolesTemp.reverse(); // Reversed so that lowest ranked role is listed first in the select option in template
        // console.log(member);
        return member;
    },
    formGetData: function(e){
        // console.log('..edboard formGetData');
        e.preventDefault();
        var memberMongoId,
            success;
        Meteor.formActions.saving();
        $('input').removeClass('invalid');
        // Name
        // ------
        var member = {};
        member.name_first = $('#member-name-first').val();
        member.name_middle = $('#member-name-middle').val();
        member.name_last = $('#member-name-last').val();

        // Address
        // ------
        var memberAddress = $('.member-address').code();
        memberAddress = Meteor.formActions.cleanWysiwyg(memberAddress);
        if(memberAddress != ''){
            member.address = memberAddress;
        }

        // Bio
        // ------
        var memberBio = $('.member-bio').code();
        memberBio = Meteor.formActions.cleanWysiwyg(memberBio);
        if(memberBio != ''){
            member.bio = memberBio;
        }

        // Role
        // ------
        member.role = [];
        $('.roles').each(function(){
            if($(this).is(':checked')){
                member.role.push($(this).val());
            }
        });

        // TODO: add check for if name exists?
        // TODO: validation
        // console.log(member);
        memberMongoId = $('#member-mongo-id').val();
        if(!memberMongoId){
            // Insert
            success = edboard.insert(member);
        }else{
            // Update
            success = edboard.update({_id : memberMongoId} , {$set: member});
        }
        if(success){
            Meteor.formActions.success();
        }
    },
    readyForm: function(){
        // Address
        // ------
        $('.member-address').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview']]
            ]
        });

        // Bio
        // ------
        $('.member-bio').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview']]
            ]
        });
    }
}

Meteor.adminArticle = {
    getAffiliations: function(){
        var affiliations = [];
        $('.article-affiliation').each(function(idx,obj){
            affiliations.push($(this).val());
        });
        return affiliations;
    },
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
                Router.go('AdminArticleAdd');
            }
        }else{
            Session.set('article',articleExistsExists);
        }
    }
}

Meteor.adminShared = {
    formGetData: function (e) {
        var forDb = {}

        // Section title
        // ---------------
        var title = $('.section-title').code();
        // console.log(title);
        title = Meteor.formActions.cleanWysiwyg(title);
        if(title != ''){
            forDb.title = title;
        }

        // Section content
        // ---------------
        var section = $('.section-content').code();
        // section = Meteor.formActions.cleanWysiwyg(section);
        if(section != ''){
            forDb.content = section;
        }

        // Display
        // ---------------
        forDb.display = $('#section-display').is(':checked');

        return forDb;
    }
}

Meteor.adminForAuthors = {
    readyForm: function(){
        // Section title
        // ---------------
        $('.section-title').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview']]
            ]
        });
        // Section content
        // ---------------
        $('.section-content').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview','link']],
                ['para', ['ul', 'ol', 'paragraph', 'leftButton', 'centerButton', 'rightButton', 'justifyButton', 'outdentButton', 'indentButton']]
            ]
        });
    },
    formGetData: function(e){
        // console.log('..formGetData forAuthors');
        e.preventDefault();

        var forDb = Meteor.adminShared.formGetData();

        // Check if section exists via Mongo ID hidden input
        mongoId = $('#section-mongo-id').val();
        if(!mongoId){
            // Insert
            success = forAuthors.insert(forDb);
            // Update sorters collection
            Meteor.call('sorterAddItem','forAuthors',success);
        }else{
            // Update
            success = forAuthors.update({_id : mongoId} , {$set: forDb});
        }
        if(success){
            // Meteor.formActions.success(); // Do not show modal. Problem when changing session variable to hide template, doesn't remove modal overlay
            Session.set('showForm',false);
            Session.set('sectionId',null);
        }
    }
}

Meteor.adminAbout = {
    readyForm: function(){
        // About Section title
        // ---------------
        $('.section-title').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview']]
            ]
        });
        // Section content
        // ---------------
        $('.section-content').materialnote({
            onPaste: function(e){
                Meteor.formActions.removePastedStyle(e);
            },
            toolbar: [
                ['style', ['style', 'bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['undo', ['undo', 'redo', 'help']],
                ['misc', ['codeview','link']],
                ['para', ['ul', 'ol', 'paragraph', 'leftButton', 'centerButton', 'rightButton', 'justifyButton', 'outdentButton', 'indentButton']]
            ]
        });
    },
    formGetData: function(e){
        // console.log('..formGetData forAuthors');
        e.preventDefault();
        var forDb = Meteor.adminShared.formGetData();

        // TODO: Validation
        // console.log(forDb);
        // Check if section exists via Mongo ID hidden input
        mongoId = $('#section-mongo-id').val();
        if(!mongoId){
            // Insert
            success = about.insert(forDb);
            // Update sorters collection
            Meteor.call('sorterAddItem', 'about', success);
        }else{
            // Update
            success = about.update({_id : mongoId} , {$set: forDb});
        }
        if(success){
            // Meteor.formActions.success(); // Do not show modal. Problem when changing session variable to hide template, doesn't remove modal overlay
            Session.set('showAboutForm',false);
            Session.set('aboutSectionId',null);
        }
    }
}

Meteor.adminSections = {
    formGetData: function(e){
        // console.log('..formGetData adminSection');
        e.preventDefault();
        var forDb = {};
        var invalidData = [];
        forDb.name = $('#section-name').val();
        forDb.display = $('#section-display').is(':checked');

        if(!forDb.name){
            var invalidObj = {
                'input_class' : 'section-name',
                'message' : 'Section Name Is Empty'
            }
            invalidData.push(invalidObj);
            Meteor.formActions.invalid(invalidData);
        }else{
            forDb.short_name = forDb.name.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
                if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
                return index == 0 ? match.toLowerCase() : match.toUpperCase();
            }); // based on http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case

            forDb.dash_name = forDb.name.toLowerCase().replace(/\s/g,'-').replace(':','');

            // TODO: Check if section name already exists
            // console.log(forDb);
            // Check if section exists via Mongo ID hidden input
            mongoId = $('#section-mongo-id').val();
            // console.log(forDb);
            // console.log(mongoId);
            if(!mongoId){
                // Insert
                success = sections.insert(forDb);
                // Update sorters collection
                // Meteor.call('sorterAddArticle', 'sections', success);
            }else{
                // Update
                success = sections.update({_id : mongoId} , {$set: forDb});
            }
            if(success){
                Meteor.formActions.success();
                // Session.set('showAboutForm',false);
                // Session.set('aboutSectionId',null);
            }
        }
    }
}

Meteor.articleFiles = {
    verifyXml: function(articleMongoId,files){
        // console.log('..verifyXml');
        var s3Folder = 'xml';
        var file = files[0];
        var reader = new FileReader;
        var xmlString;

        reader.onload = function(e) {
            xmlString = e.target.result;

            Meteor.call('processXmlString',xmlString, function(error,result){
                if(error){
                    console.error('process XML for DB', error);
                    Meteor.formActions.errorMessage('Could not process XML for verification');
                }else if(result){
                    Meteor.formActions.closeModal();
                    Meteor.general.scrollTo('xml-verify');
                    Meteor.call('preProcessArticle',articleMongoId,result,function(error,result){
                        if(error){
                            console.log('ERROR - preProcessArticle');
                            console.log(error);
                        }
                        if(result){
                            Session.set('xml-verify',true);
                            Session.set('article-form',result);
                        }
                    });
                }
            });
        }
        reader.readAsText(file);
    },
    uploadArticleFile: function(articleMongoId,s3Folder,files){
        // console.log('uploadArticleFile',s3Folder);
        var file = files[0];
        var fileNameId = file.name.replace('.xml','').replace('.pdf','');
        var messageForXml = '';
        Meteor.s3.upload(files,s3Folder,function(error,res){
            if(error){
                console.error('Upload File Error', error);
                Meteor.formActions.errorMessage('File not uploaded');
            }else if(res){
                // TODO: only rename if filename not MongoID
                Meteor.call('renameArticleAsset', articleMongoId, s3Folder, res.file.name, function(error,newFileName){
                    if(error){

                    }else if(newFileName){
                        var updateAssetObj = {}
                        updateAssetObj['files.' + s3Folder + '.file'] = newFileName;
                        Meteor.call('updateArticle',articleMongoId,updateAssetObj, function(error,result){
                            if(result){
                                // console.log('result',result);
                                // clear files
                                S3.collection.remove({});

                                // // update template data
                                // Meteor.call('articleAssests', articleMongoId, function(error, result) {
                                //     if(result){
                                //         console.log('articleAssests',result);
                                //         // Session.set('article-files',result);
                                //         article = articles.findOne({_id : articleMongoId});
                                //         Session.set('article',article)
                                //     }
                                // });

                                if(s3Folder === 'xml'){
                                    // check for figures and supplementary files after upload. This will not be in the article form because users cannot update this in the database, must match the XML
                                    Meteor.call('afterUploadXmlFilesCheck',articleMongoId , newFileName, function(error,result){
                                        if(error){
                                            console.error('xmlCheckFiguresAndSupps',error);
                                        }else if(result){

                                        }
                                    });
                                }

                                // notify user
                                if(s3Folder === 'xml'){
                                    messageForXml = '<br><b>Save form to update the article record in the database.</b>';
                                }
                                Meteor.formActions.successMessage(result + ' uploaded. Saved as ' + newFileName + messageForXml);
                                // Session.set('xml-verify',null); // still want the form visible so that they can update the database.

                                // delete uploaded file, if not equal to MongoID
                                if(articleMongoId != fileNameId){
                                    S3.delete(s3Folder + '/' + file.name,function(error,result){
                                        if(error){
                                            console.error('Could not delete original file: ' + file.name);
                                        }
                                        // if(result){
                                            // console.log('Deleted original file: ' + file.name);
                                        // }
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    },
    figuresById: function(figures){
        var figsById = {};

        figures.forEach(function(fig){
            figsById[fig.id] = fig;
        });

        return figsById;
    },
    verifyFigure: function(originalFigId, newFigId){
        // if new figure, originalFigId = new
        var figures = Session.get('article').files.figures;
        var figsById = Meteor.articleFiles.figuresById(figures);
        if(originalFigId != newFigId && figsById[newFigId]){
            return false; // figure ID already exists for another figure
        }else{
            return true;
        }
    }
}

Meteor.adminUser = {
    getFormCheckBoxes: function(){
        var roles = [];
        $('.role-cb').each(function(){
            if($(this).is(':checked')){
                roles.push($(this).val());
            }
        });
        return roles;
    },
    clickedRole: function(e){
        var role = $(e.target).attr('id');
        if($(e.target).is(':checked') && role === 'super-role'){
            $('#admin-role').prop('checked',true);
            $('#articles-role').prop('checked',true);
        }else if($(e.target).is(':checked') && role === 'admin-role'){
            $('#articles-role').prop('checked',true);
        }
    },
    getFormUpdate: function(){
        var user = {};
        user.emails = [];
        user.emails[0] = {};
        user.emails[0].address = $('#email').val();
        user.roles =  Meteor.adminUser.getFormCheckBoxes();
        user.subscribed = $('.sub-cb').is(':checked');

        return user;
    },
    getFormAdd: function(){
        var user = {};
        user.email = $('#email').val();
        user.roles =  Meteor.adminUser.getFormCheckBoxes();
        return user;
    }
}

Meteor.s3 = {
    upload: function(files,folder,cb){
        var journalShortName = journalConfig.findOne().journal.short_name;
        var journalBucket = 'paperchase-' + journalShortName;

        S3.upload({
            Bucket: journalBucket,
            files: files,
            path: folder,
            unique_name: false
        },function(err,res){
            if(err){
                console.error('S3 upload error',err);
                cb(err);
            }else if(res){
                cb(null, res);
            }
        });
    }
}

Meteor.processXml = {
    cleanAbstract: function(abstract){
        abstract = abstract.replace(/<\/p>/g,'');
        abstract = abstract.replace(/<p>/g,'');
        abstract = abstract.replace(/^[ ]+|[ ]+$/g,'');
        abstract = Meteor.general.cleanString(abstract);
        return abstract;
    }
}

Meteor.dataSubmissions = {
    getPiiList: function(){
        var piiList = [];
        $('.data-submission-pii').each(function(){
            var pii = $(this).attr('data-pii');
            piiList.push(pii);
        });
        return piiList;
    },
    getArticles: function(queryType,queryParams){
        // console.log('... getArticles = ' + queryType + ' / ' + queryParams);
        Meteor.dataSubmissions.processing();
        var articleSub = Meteor.subscribe('submission-set',queryType,queryParams);
    },
    processing: function(){
        $('.saving').removeClass('hide');
    },
    doneProcessing: function(){
        $('.saving').addClass('hide');
    },
    errorProcessing: function(){
        Session.set('error',true);
        $('.saving').addClass('hide');
    },
    validateXmlSet: function(){
        $('.saving').removeClass('hide');
        var submissionList = articles.find().fetch();
        // console.log(submissionList);
        Meteor.call('articleSetCiteXmlValidation', submissionList, Meteor.userId(), function(error,result){
            $('.saving').addClass('hide');
            if(error){
                console.log('ERROR - articleSetXmlValidation');
                console.log(error)
            }else if(result === 'invalid'){
                alert('XML set invalid');
            }else{
                //all the articles are valid, now do the download
                window.open('/xml-cite-set/' + result);
            }
        });
    }
}
