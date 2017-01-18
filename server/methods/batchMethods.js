Meteor.methods({
    batchDoiRegisteredCheck: function(){
        var fut = new future();
        var articlesList = articles.find({'ids.doi' : {$exists:false}}).fetch();
        var updated = 0;
        ///article/:journalname/:pii/doi_status
        for(var a=0 ; a<articlesList.length ; a++){
            if(articlesList[a].ids && articlesList[a].ids.pii){
                Meteor.call('doiRegisteredCheck', articlesList[a]._id,  articlesList[a].ids.pii, function(error,result){
                    if(error){
                        throw new Meteor.Error('doiRegisteredCheck' , pii, error);
                    }else if(result == 'Registered'){
                        updated++;
                        // console.log(result);
                    }
                    if(a == parseInt(articlesList.length -1)){
                        fut.return(updated + ' DOIs Saved'); //return string in case 0 articles updated. will be false otherwise
                    }
                });
            }
        }
        return fut.wait();
    },
    batchProcessXml: function(){
        // console.log('..batchProcessXml');
        var journalInfo = journalConfig.findOne();
        var journalShortName = journalInfo.journal.short_name;
        var articlesList = articles.find({}, {"sort": {"last_update":1}}).fetch();
        // console.log(articlesList);
        var missingPii = [];
        var xmlUrl = 'https://s3-us-west-1.amazonaws.com/paperchase-' + journalShortName + '/xml/'
        for(var a=0; a<articlesList.length ; a++){
        // for(var a=0; a< 1; a++){
            console.log('-- ' + a);
            // console.log(articlesList[a]);

            // console.log('-- ' + JSON.stringify(articlesList[a]['ids']));
            // get XML and update DB
            // TODO: Use xml collection to get URL
            var articleXML = xmlUrl + articlesList[a]._id + '.xml';
            // console.log('articleXML',articleXML);
            Meteor.call('parseXmlAfterUpload',articleXML, function(error,result){
                if(error){
                    console.error('parseXmlAfterUpload',error);
                }else if(result){
                    // console.log('result',result);
                    // maintain PII when batch updating via XML
                    var articleInfo = articles.findOne(articlesList[a]._id);
                    if(articleInfo.ids && articleInfo.ids.pii){
                        result.ids.pii = articleInfo.ids.pii;
                    }
                    result.ids = articleInfo.ids;
                    Meteor.call('updateArticle',articlesList[a]._id, result,function(articleUpdateError,articleUpdate){
                        if(articleUpdateError){
                            console.error('Could not update article doc: ' + articlesList[a]._id, articleUpdateError);
                        }else{
                            console.log('  '+articlesList[a]._id + ' Updated');
                        }
                    });
                }
            });

            if(parseInt(articlesList.length-1) == a){
                // console.log('MISSING PII',missingPii);
            }
        }
    },
    batchDoiList: function(){
        var fut = new future();
        // will query for PMID list for journal (based on ISSN). Then check if article has DOI at PubMed, if not then include in output.
        console.log('...batchDoiList');
        Meteor.call('getAllArticlesFromPubMed',function(error,articleList){
            if(error){
                throw new Meteor.Error(500, 'batchDoiList: Cannot get list of PMID from PubMed based on ISSN' , error);
            }
            if(articleList){
                fut.return(true);
                // articlesList = pre2015Oncotarget;
                // PMID list returned. Now check if DOI at PubMed already
                var prethis2015 = [];
                var missingDoi = [];
                var missingPii = [];
                var missingDate = [];
                for(var i=0 ; i<articleList.length ; i++){
                    Meteor.call('getPubDateFromPmid',articleList[i],function(err,pubDate){
                        if(err){
                            console.error(err);
                        }
                        if(pubDate){
                            if(pubDate.indexOf('2015') == -1){
                                prethis2015.push(articleList[i]);
                            }
                        }else{
                            console.log('no pubdate');
                            missingDate.push(articleList[i]);
                        }
                    });


                    if(i == parseInt(articleList.length-1)){
                        // console.log('prethis2015');console.log(prethis2015);
                        // console.log('missingDoi');console.log(missingDoi);
                        // console.log('missingPii');console.log(missingPii);
                        console.log('missingDate');console.log(missingDate);
                    }
                }
            }
        });
        return fut.wait();
    },
    batchUpdateCorrespViaXml: function(){
        // console.log('..batchUpdateCorrespViaXml');
        var fut = new future();
        var journalInfo = journalConfig.findOne();
        var journalShortName = journalInfo.journal.short_name;
        var articlesList = articles.find({'files.xml' : {'$exists' : true}}).fetch();
        // console.log('articlesList',articlesList.length);
        var assetBaseUrl = journalInfo.assets + 'xml/';
        for(var i = 0 ; i < articlesList.length; i++){
        // for(var i = 0 ; i < 100; i++){
            var articleMongoId = articlesList[i]._id;
            // console.log(i,articleMongoId);
            var assetUrl = assetBaseUrl + articleMongoId + '.xml';
            Meteor.call('getXml',assetUrl,function(error,xmlString){
                if(xmlString){
                    Meteor.call('parseXmltoJson',xmlString, function(error,articleJson){
                        if(articleJson){
                            var article = articleJson['pmc-articleset'].article[0].front[0]['article-meta'][0];

                            if(article['author-notes'] && article['author-notes'][0].corresp){
                                Meteor.xmlPmc.authorsCorresponding(article['author-notes'][0].corresp,function(correspondence){
                                    if(correspondence && correspondence.length > 0){
                                        if(article['article-id'][0]['$']['pub-id-type'] === 'pmid'){
                                            Meteor.call('updateArticleByPmid',article['article-id'][0]._ , {correspondence : correspondence});
                                        }else{
                                            console.log('cannot update',article['article-id'][0]['$']['pub-id-type'] + ' : ' + article['article-id'][0]._);
                                        }

                                    }
                                });
                            }
                        }
                    });
                }
            });

        }

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    batchUpdateSuppViaXml: function(){
        // console.log('..batchUpdateSuppViaXml');
        var fut = new future();
        var journalInfo = journalConfig.findOne();
        var journalShortName = journalInfo.journal.short_name;
        var articlesList = articles.find({'files.xml' : {'$exists' : true}}).fetch();
        var assetBaseUrl = journalInfo.assets + 'xml/';
        for(var i = 0 ; i < articlesList.length; i++){
            var articleMongoId = articlesList[i]._id;
            console.log(i,articleMongoId);
            var assetUrl = assetBaseUrl + articleMongoId + '.xml';
            Meteor.call('getXml',assetUrl,function(error,xmlString){
                if(xmlString){
                    Meteor.xmlPmc.supplementalMaterials(xmlString, function(supps){
                        if(supps && supps.length >0){
                            Meteor.call('updateArticleDbSupps', articleMongoId, supps);
                        }
                    });
                }
            });
        }

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    checkAllArticlesFiles: function(assetType){
        console.log('..checkAllArticlesFiles : ' + assetType);
        // only for those without asset in article doc
        var fut = new future();
        var journalInfo = journalConfig.findOne();
        var journalShortName = journalInfo.journal.short_name;
        var articlesList = articles.find().fetch();
        var missingFiles = [];
        var assetBaseUrl = 'http://s3-us-west-1.amazonaws.com/paperchase-' + journalShortName + '/' + assetType + '/';
        for(var i = 0 ; i < articlesList.length; i++){
        // for(var i = 0 ; i <10; i++){
            var article = articlesList[i];
            var articleMongoId = article._id;
            var assetFileName = articleMongoId + '.' + assetType;
            var assetUrl = assetBaseUrl + assetFileName;
            console.log(i, articlesList[i]._id);
            if(!article.files || !article.files[assetType]){
                Meteor.call('assetExistsOnS3',assetUrl,function(error,result){
                    if(result){
                        var updateObj = {};
                        var updateWhere = 'files.' + assetType;
                        updateObj[updateWhere] = {file: assetFileName, display:true};
                        Meteor.call('updateArticle',articleMongoId, updateObj, function(updateError,updateResult){
                            if(updateError){
                                console.error(updateError);
                            }else if(updateResult){
                                console.log('updateResult',updateResult);
                            }
                        });
                    }else{
                        missingFiles.push(articleMongoId);
                    }
                });
            }
            if(i == parseInt(articlesList.length - 1)){
                // console.log('missingFiles',missingFiles);
                fut.return(missingFiles);
            }
        }
        return fut.wait();
    },
    batchRealXml: function(){
        console.log('..batchRealXml : ');
        var fut = new future();
        var journalInfo = journalConfig.findOne();
        var journalShortName = journalInfo.journal.short_name;
        // var articlesList = articles.find({_id : {$in: notreal}}).fetch();
        var blobCount = 0;
        var okCount = 0;
        var missingCount = 0;
        var articlesList = articles.find().fetch();
        var csvString = 'Mongo ID, PII, PMID, PMC, Volume, Issue, Status\n';
        var assetBaseUrl = 'http://s3-us-west-1.amazonaws.com/paperchase-' + journalShortName + '/xml/';
        for(var i = 0 ; i < articlesList.length; i++){
        // for(var i = 0 ; i < 10; i++){
            // if(articlesList[i].ids.pii && articlesList[i].ids.pii == '10.1177_1947601913501075'){
            var articleMongoId = articlesList[i]._id;
            var assetUrl = assetBaseUrl + articleMongoId + '.xml';
            // console.log(i, articlesList[i]._id, assetUrl);
            Meteor.call('fullTextXmlReal',assetUrl,function(error,result){
                csvString += articlesList[i]._id + ',';
                if(articlesList[i].ids.pii){
                    csvString += articlesList[i].ids.pii;
                }else{
                    csvString += '';
                }
                csvString += ',';

                if(articlesList[i].ids.pmid){
                    csvString += articlesList[i].ids.pmid;
                }else{
                    csvString += '';
                }
                csvString += ',';

                if(articlesList[i].ids.pmc){
                    csvString += articlesList[i].ids.pmc;
                }else{
                    csvString += '';
                }
                csvString += ',';

                if(articlesList[i].volume){
                    csvString += articlesList[i].volume;
                }else{
                    csvString += '';
                }
                csvString += ',';

                if(articlesList[i].issue){
                    csvString += 'Issue' + articlesList[i].issue; //add string so that excel does not parse dashed issues as dates
                }else{
                    csvString += '';
                }
                csvString += ',';

                if(result && result.sections.length < 2){
                    csvString += 'Blob'; //TODO: could just be paragraphs within body.
                    blobCount++;
                    // console.log(articlesList[i]._id, articlesList[i].ids.pii, ' Blob', result);
                    // result is lenght of body sections. if 1 then we cannot use this xml
                }else if(result && result.sections.length >1){
                    csvString += 'Ok';
                    okCount++;
                }else{
                    csvString += 'Missing';
                    missingCount++;
                }

                csvString += '\n';
            });
            // }
            if(i == parseInt(articlesList.length - 1)){
                console.log('csvString',csvString);
                console.log('missing ',missingCount, '. ok =', okCount,'. blob =', blobCount);
                fut.return(csvString);
            }

        }
        return fut.wait();
    },
    batchArticlesWith: function(searchFor){
        console.log('..batcharticlesWith : ' + searchFor);
        var fut = new future();
        var journalInfo = journalConfig.findOne();
        var journalShortName = journalInfo.journal.short_name;
        var articlesList = articles.find().fetch();
        var found = [];
        var assetBaseUrl = 'http://s3-us-west-1.amazonaws.com/paperchase-' + journalShortName + '/xml/';
        for(var i = 0 ; i < articlesList.length; i++){
        // for(var i = 0 ; i < 10; i++){
            var articleMongoId = articlesList[i]._id;
            var assetUrl = assetBaseUrl + articleMongoId + '.xml';
            // console.log(i, articlesList[i]._id,assetUrl);
            Meteor.call('articlesWith',assetUrl,searchFor,function(error,result){
                if(result){
                    // console.log('yes');
                    found.push(articleMongoId);
                }
            });
            if(i == parseInt(articlesList.length - 1)){
                // console.log('found',found);
                fut.return(found);
            }

        }
        return fut.wait();
    },
    getMissingPmidPmcViaPii: function(){
        console.log('..getMissingPmidPmcViaPii');
        var fut = new future();
        var apiBase = journalConfig.findOne().api.crawler;
        var journalShortName = journalConfig.findOne().journal.short_name;
        var urlApi =  apiBase + '/pubmed/ids_via_pii/' + journalShortName;
        var missingIdList = articles.find({ $or: [ { 'ids.pmc' : {$exists:false} }, { 'ids.pmid' : {$exists:false} } ] }).fetch();
        // var pubMedByPii = {};

        console.log('  Paperchase missingIdList length = ',missingIdList.length);
        if(missingIdList.length > 0 ){
            missingIdList.forEach(function(article){
                if(article.ids.pii){
                    console.log('.. PII ' + article.ids.pii);
                    var urlApiByPii = urlApi + '/' + article.ids.pii;
                    Meteor.http.get(urlApiByPii, function(error,result){
                        if(error){
                            console.error('urlApiByPii',error);
                        }else if(result){
                            var pubMedArticle = result.data;
                            var updateObj = {};
                            if(!article.ids.pmc && pubMedArticle.ids.pmc){
                                updateObj.ids.pmc = pubMedArticle.ids.pmc;
                            }
                            if(!article.ids.pmid && pubMedArticle.ids.pmid){
                                updateObj.ids.pmid= pubMedArticle.ids.pmid;
                            }
                            Meteor.call('updateArticle', article._id, updateObj, function(updateError,updateRes){
                                if(updateError){
                                    console.error('PMC/PMID ID update error',updateError);
                                }
                            });
                        }
                    });
                }
            });
        }else{
            fut.return(true);
        }
        return fut.wait();
    },
    getMissingPubMedIds: function(){
        // var fut = new future();
        var apiBase = journalConfig.findOne().api.crawler;
        var journalShortName = journalConfig.findOne().journal.short_name;
        var urlApi =  apiBase + '/pubmed/ids_via_pii/' + journalShortName;
        var missingList = articles.find({'ids.pmid' : {$exists:false},'ids.pii' : {$exists:true}},{_id : 1,ids:1}).fetch();
        for(var i=0 ; i<missingList.length ; i++ ){
            if(missingList[i].ids.pii){
                var urlApiByPii = urlApi + '/' + missingList[i].ids.pii;
                Meteor.http.get(urlApiByPii, function(error,result){
                    if(error){
                        console.error('Get PubMed ID error',error);
                    }else if(result){
                        articleData = result.data;
                        if(articleData && articleData.ids.pmid){
                            console.log(articleData);
                            Meteor.call('updateArticleBy', {'ids.pii' : articleData.ids.pii}, {'ids.pmid': articleData.ids.pmid}, function(updateError,updateResult){
                                if(updateError){
                                    console.error('Update Article',updateError);
                                }else if(updateResult){

                                }
                            });
                        }
                    }
                });
            }

        }
        // return fut.wait();
    },
    getMissingPmcIds: function(){
        var fut = new future();
        var apiBase = journalConfig.findOne().api.crawler;
        var missingPmcList = articles.find({'ids.pmc' : {$exists:false},'ids.pmid' : {$exists:true}},{_id : 1}).fetch();
        for(var i=0 ; i<missingPmcList.length ; i++ ){
            var urlApi =  apiBase + '/article_ids_via_pmid/' + missingPmcList[i].ids.pmid;
            Meteor.http.get(urlApi, function(error,result){
                if(error){
                    console.error('Get PMC ID error',error);
                }else if(result){
                    articleData = result.data;
                    // console.log(articleData);
                    if(articleData.ids.pmc){
                        Meteor.call('updateArticleByPmid', articleData.ids.pmid, {'ids.pmc': articleData.ids.pmc}, function(updateError,updateResult){
                            if(updateError){
                                console.error('Update Article',updateError);
                            }else if(updateResult){

                            }
                        });
                    }

                }
            });
        }
        return fut.wait();
    },
    getPubMedInfo: function(){
        // console.log('..getPubMedInfo');
        var totalUpdate = 0;
        var totalMissing = 0;
        var tracker = 0;
        var fut = new future();
        var apiBase = journalConfig.findOne().api.crawler;
        // var apiBase = 'http://localhost:4932';
        var urlApi =  apiBase + '/article_info_via_pmid/';

        var missingByMongo = {};
        var missingVolList = articles.find({volume : {$exists:false},'ids.pmid' : {$exists:true}},{_id : 1}).fetch();
        var missingIssList = articles.find({issue : {$exists:false},'ids.pmid' : {$exists:true}},{_id : 1}).fetch();

        missingVolList.forEach(function(article){
            missingByMongo[article._id] = article;
            totalMissing++;
        });
        missingIssList.forEach(function(article){
            if(!missingByMongo[article._id]){
                missingByMongo[article._id] = article;
                totalMissing++;
            }
        });

        for(mongoId in missingByMongo){
            // console.log(mongoId);
            var url = urlApi + missingByMongo[mongoId].ids.pmid;
            Meteor.http.get( url, function(error,result){
                if(result){
                    // console.log(url, result);
                    var articleData = JSON.parse(result.content);
                    var updateObj = {};
                    if(articleData.volume){
                        updateObj.volume;
                    }
                    if(articleData.issue){
                        updateObj.issue;
                    }
                    Meteor.call('updateArticleByPmid', articleData.ids.pmid, articleData, function(updateError,updateResult){
                        if(updateError){
                            console.error('Update Article',updateError);
                        }else if(articleData.volume && updateResult){
                            // console.log('++');
                            totalUpdate++;
                        }
                        tracker++;
                        if(tracker == totalMissing){
                            var result = totalMissing + ' total articles missing Volume/Issue. ' + totalUpdate + ' Articles were updated.'
                            fut.return(result);
                        }
                    });
                }
            });
        }
        return fut.wait();
    },
    getMissingFiles: function(){
        // console.log('..getMissingFiles');
        var articlesList = articles.find({$or: [{"files.xml": {$exists:false}}, {"files.pdf": {$exists:false}}]},{_id : 1}).fetch();
        console.log('__article count = ' + articlesList.length);
        var journalShortName = journalConfig.findOne().journal.short_name;
        var crawlUrl = journalConfig.findOne().api.crawler;
        var missingPmc = 0;
        var missingPdf = articles.find({'files.pdf':{$exists:false}}).fetch();
        var missingXml = articles.find({'files.xml':{$exists:false}}).fetch();
        // TODO: add check for if asset on S3 but DB just does not have it. Avoid reuploading files via PMC.
        for(var a = 0 ; a < articlesList.length ; a++){
            if(!articlesList[a].ids || !articlesList[a].ids.pmc){
                missingPmc++;
            }
        }

        console.log('___Fetch XML count = ' + missingXml.length);
        console.log('___Fetch PDF count = ' + missingPdf.length);
        console.log('___NO PMC ID = ', missingPmc);
                // console.log(missing.pdf);
        if(missingXml.length > 0){
            for(var i=0 ; i<missingXml.length ; i++){
                console.log('XML : ' + missingXml[i]._id);
                var xmlUrlApi = crawlUrl + '/get_article_pmc_xml/' + journalShortName + '/' + missingXml[i]._id;
                Meteor.http.get(xmlUrlApi , function(error,result){
                    if(error){
                        console.error('Asset Error: ',error);
                    }else if(result){
                        var assetData = result.data;
                        console.log('Uploaded',assetData.ids.mongo_id);
                        if(assetData && assetData.ids){
                                    var articleMongoId =  assetData.ids.mongo_id;
                                    var assetFileName =  assetData.ids.mongo_id + '.xml';
                                    var updateObj = {};
                                    var updateWhere = 'files.xml';
                                    updateObj[updateWhere] = {file: assetFileName, display:true};
                                    Meteor.call('updateArticle',articleMongoId, updateObj, function(updateError,updateResult){
                                        if(updateError){
                                            console.error(updateError);
                                        }else if(updateResult){
                                            console.log('updateResult',updateResult);
                                        }
                                    });
                        }
                    }
                });
            }
        }
        if(missingPdf.length > 0){
            for(var i=0 ; i<missingPdf.length ; i++){
                console.log('XML : ' + missingPdf[i]._id);
                var pdfUrlApi = crawlUrl + '/get_article_pmc_pdf/' + journalShortName + '/' + missingPdf[i]._id;
                Meteor.http.get(pdfUrlApi , function(error,result){
                    if(error){
                        console.error('Asset Error: ',error);
                    }else if(result){
                        var assetData = result.data;
                        console.log('Uploaded',assetData.ids.mongo_id);
                        if(assetData && assetData.ids){
                            var articleMongoId =  assetData.ids.mongo_id;
                            var assetFileName =  assetData.ids.mongo_id + '.pdf';
                            var updateObj = {};
                            var updateWhere = 'files.pdf';
                            updateObj[updateWhere] = {file: assetFileName, display:true};
                            Meteor.call('updateArticle',articleMongoId, updateObj, function(updateError,updateResult){
                                if(updateError){
                                    console.error(updateError);
                                }else if(updateResult){
                                    console.log('updateResult',updateResult);
                                }
                            });
                        }
                    }
                });
            }
        }
    },
    batchAllArticleTypes: function(){
        // update all article docs using the article types collection information. Needed because we added data to article types collection and want to update all article docs
        var articlesList = articles.find().fetch();

        var typesList = articleTypes.find().fetch();
        var typesByShortName = {};

        typesList.forEach(function(type){
            typesByShortName[type.short_name] = type;
        });

        // console.log('typesByShortName',typesByShortName);

        articlesList.forEach(function(article){
            if(article.article_type && !article.article_type._id)
            // remove !article.article_type._id below if wanting to update entire collection.
            if(article.article_type && !article.article_type._id && article.article_type.name && article.article_type.short_name && typesByShortName[article.article_type.short_name]){
                // console.log(article.article_type.short_name);
                // console.log(article.article_type.short_name, typesByShortName[article.article_type.short_name]._id);
                Meteor.call('updateArticle',article._id, {article_type : typesByShortName[article.article_type.short_name]});
            }else if(article.article_type && !article.article_type._id && article.article_type.name && article.article_type.short_name && typesByShortName[article.article_type.short_name.replace('-','_')]){
                // console.log(article.article_type.short_name, typesByShortName[article.article_type.short_name.replace('-','_')]._id);
                Meteor.call('updateArticle',article._id, {article_type : typesByShortName[article.article_type.short_name.replace('-','_')]});
            }else if(article.article_type && article.article_type.short_name === 'review-article'){
                Meteor.call('updateArticle',article._id, {article_type : typesByShortName['review-article']});
            }else if(article.article_type && article.article_type.short_name === 'article-commentary'){
                Meteor.call('updateArticle',article._id, {article_type : typesByShortName['commentary']});
            }else if(article.article_type && article.article_type.short_name === 'correction'){
                Meteor.call('updateArticle',article._id, {article_type : typesByShortName['erratum']});
            }else if(article.article_type && article.article_type.name === 'Commentary'){
                Meteor.call('updateArticle',article._id, {article_type : typesByShortName['commentary']});
            }else if(article.article_type && article.article_type.name === 'Essays'){
                Meteor.call('updateArticle',article._id, {article_type : typesByShortName['essays']});
            }else if(article.article_type && article.article_type.name === 'Review'){
                Meteor.call('updateArticle',article._id, {article_type : typesByShortName['review']});
            }else if(article.article_type && article.article_type.name === 'Essays and Commentaries'){
                Meteor.call('updateArticle',article._id, {article_type : typesByShortName['essays_and_commentaries']});
            }else if(article.article_type && article.article_type.name === 'Hypothesis'){
                Meteor.call('updateArticle',article._id, {article_type : typesByShortName['hypothesis']});
            }else if(article.article_type && Object.keys(article.article_type).length > 0){
                // console.log('---',article._id);
                // has type but could not match
            }else{
                // not type
                // console.log('-- no type',article._id);
            }
        });
    },
    batchCheckOptimizedArticleFigures: function(userId){
        var notOptimized = articles.find({'files.figures' : {$elemMatch: {optimized : {$exists:false}}}, 'article_type._id' : {$ne : 'Fq3xv2AcTRYWQttsN'}}).fetch();
        console.log(notOptimized.length + ' articles to check for optimized images');
        var count = 0;
        notOptimized.forEach(function(article){
            console.log('...', count, article._id);
            count++;
            article.files.figures.forEach(function(fig){
                if (!fig.optimized) {
                    Meteor.call('verifyImagesOptimized', article._id, 'paper_figures', userId, fig.id);
                }
            });
        });
    },
    batchCheckOptimizedCovers: function(userId){
        var notOptimized = issues.find({optimized: {$exists: false}}).fetch();
        console.log(notOptimized.length + ' covers to check');
        notOptimized.forEach(function(issue){
            Meteor.call('verifyImagesOptimized', issue._id, 'covers', userId, null);
        });
    },
});
