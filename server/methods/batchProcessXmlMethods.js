var saved = [];
var failed = [];
var failedSavedDB = [];

//processing XML, saving MX
Meteor.methods({
    getXMLFromPMC: function(){
        console.log('-getXMLFromPMC');
        var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi/?db=pmc&report=xml&id=';
        var pmidL = pmidAgingList.length;
        for(var i = 0; i < pmidL ; i++){
            //first get the pmc id, we cannot use the pmid to get the full xml
            // console.log('.. '+pmidAgingList[i]);
            Meteor.call('getPmcIdFromPmid',pmidAgingList[i],function(err,pmcId){
                if(err){
                    console.log('ERROR ' + err.message);
                }else{
                    // console.log(res);
                    if(pmcId){
                        var req = requestURL + pmcId;
                        // console.log(req);
                        var res = Meteor.http.get(req);
                        var filePath = process.env.PWD + '/uploads/pmc_xml/' + pmidAgingList[i] + '.xml';
                        fs.writeFile(filePath, res.content, function (err) {
                            if (err) return console.log(err);
                            console.log('--saved '+filePath);
                        });
                    }else{
                        console.log('--failed '+pmidAgingList[i]);
                        failed.push(pmidAgingList[i]);
                    }

                }
            });
            if(i == parseInt(pmidL - 1)){
                console.log(failed);
                return 'done saving xml';
            }
        }
    },
    saveXMLFromPMC: function(){
        console.log('-saveXMLFromPMC');
        var pmidL = pmidAgingList.length;
        for(var i = 0; i < pmidL ; i++){
            var fileName = pmidAgingList[i] + '.xml';
            console.log('.. ' + i + ' / ' + fileName);
            Meteor.call('processXML', fileName, true, function(error,result){
                if(error){
                    console.log('ERROR:');
                    console.log(error);
                }else{
                    result['doc_updates'] = {};
                    result['doc_updates']['created_date'] = new Date();
                    result['doc_updates']['created_by'] = Meteor.userId();

                    var articleIssue = issues.findOne({'volume' : result['volume'], 'issue': result['issue']});
                    if(articleIssue){
                        result['issue_id'] = result['_id'];
                    }

                    Meteor.call('addArticle', result,function(e,r){
                        if(e){
                            failedSavedDB.push(fileName);
                            console.log(e);
                        }else{
                            saved.push(fileName);
                            return r;
                        }
                    });
                }
            });
            if(i == parseInt(pmidL - 1)){
                console.log(failedSavedDB);
                // console.log(saved);
            }
        }
    },
    getAllArticlesPii: function(){
        console.log('--getAllArticlesPii');
        var allArticles = articles.find().fetch();
        var articlesLength = allArticles.length;

        for(var i = 0 ; i < articlesLength ; i++){
            var articleIds = allArticles[i]['ids'];
            idsLength = articleIds.length;
            var pmid = allArticles[i]['ids']['pmid'];
            var pii = allArticles[i]['ids']['pii'];

            // if(!pii){
                Meteor.call('getPiiFromPmid',pmid,function(error,pii){
                    if(error){
                        console.log('ERROR: Could not get PII');
                        console.log(error);
                    }else{
                        console.log('.. ' + i + ' / pmid = ' + pmid + ' / pii = ' + pii);
                        if(pii){
                            articleIds['pii'] = pii;
                            Meteor.call('pushPiiArticle',allArticles[i]['_id'],articleIds,function(err,res){
                                if(err){
                                    console.log('ERROR: Could not save PII '+allArticles[i]['_id']);
                                    piiFail.push(allArticles[i]['_id']);
                                    console.log(err);
                                }
                            });
                        }
                    }
                });
            // }
        }
    },
    getAllAuthorsAffiliationsPubMed: function(){
        console.log('getAllAuthorsAffiliationsPubMed');
        var articlesList = articles.find().fetch();
        for(var i = 0 ; i < articlesList.length ; i++){
            console.log('.. ' + i + ' / pmid = ' + articlesList[i]['ids']['pmid']);
            if(articlesList[i]['ids']['pmid']){
                var articlePmid = articlesList[i]['ids']['pmid'];
                var authorsListDb = articlesList[i]['authors'];
                //THREE TOTAL UPDATES TO DB
                //TWO UPDATES to article doc: add to array of affiliations to author object, AddToSet for affiliation list
                //ONE UPDATE to authors doc: AddToSet to known affiliations

                var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=' + articlePmid;
                var res;
                res = Meteor.http.get(requestURL);

                if(res){
                    // console.log(res.content);
                    parseString(res.content, function (error, result) {
                        if(error){
                            console.log('ERROR');
                            console.log(error);
                        }else{
                            //first check that there are authors in the json response and also that the db has authors saved
                            if(result['PubmedArticleSet']['PubmedArticle'][0]['MedlineCitation'][0]['Article'][0]['AuthorList'] && authorsListDb){
                                var authorsJson = result['PubmedArticleSet']['PubmedArticle'][0]['MedlineCitation'][0]['Article'][0]['AuthorList'][0]['Author'];

                                //loop through all authors in the article (in the response from pubmed)
                                for(var i = 0 ; i < authorsJson.length ; i++){
                                    if(authorsJson[i]['AffiliationInfo']){
                                        //we found an affiliation for an author!
                                        //now match it to a known author, based on names
                                        //Then UPDATE the article doc (two UPDATES to article doc)
                                        //Then UPDATE the known affiliations of author doc

                                        //loop through all affiliations
                                        //match the found affiliation with the saved author, to get the authors mongo_id
                                        var authorAffiliations = authorsJson[i]['AffiliationInfo'];

                                        for(var aff = 0 ; aff < authorAffiliations.length ; aff++){
                                            var authorAffiliation = authorAffiliations[aff]['Affiliation'][0];
                                            var authorMongoId = '';
                                            var authorNameFirst = authorsJson[i]['ForeName'][0];
                                            var authorNameLast = authorsJson[i]['LastName'][0];

                                            for(var a = 0 ; a < authorsListDb.length ; a++){
                                                //TODO: better way of matching authors
                                                if(authorsListDb[a]['name_first'].replace('.','').replace(' ','').toLowerCase() === authorNameFirst.replace('.','').replace(' ','').toLowerCase() && authorsListDb[a]['name_last'].replace('.','').replace(' ','').toLowerCase() === authorNameLast.replace('.','').replace(' ','').toLowerCase() ){
                                                    //we found a match. the first and last name in the returned xml from pubmed and the name in the db are the same.
                                                    if(!authorsListDb[a]['affiliations_names']){
                                                        authorsListDb[a]['affiliations_names'] = [];
                                                    }

                                                    authorMongoId = authorsListDb[a]['ids']['mongo_id']; //for testing if we found a match and updating author doc

                                                    //update the authorsList (from the article doc)
                                                    //add this affiliaton string to the array of affiliations for the author object, but only if not already present
                                                    if(authorsListDb[a]['affiliations_names'].indexOf(authorAffiliation) === -1){
                                                        authorsListDb[a]['affiliations_names'].push(authorAffiliation);
                                                    }

                                                }
                                            }

                                            //one more attempt to match affiliation from pubmed's response to author in the db
                                            if(authorMongoId === ''){
                                                for(var a = 0 ; a < authorsListDb.length ; a++){
                                                    //TODO: better way of matching authors
                                                    if(authorsListDb[a]['name_last'] === authorNameLast ){
                                                        //we found a match. the first and last name in the returned xml from pubmed and the name in the db are the same.
                                                        if(!authorsListDb[a]['affiliations_names']){
                                                            authorsListDb[a]['affiliations_names'] = [];
                                                        }

                                                        authorMongoId = authorsListDb[a]['ids']['mongo_id']; //for testing if we found a match and updating author doc

                                                        //update the authorsList (from the article doc)
                                                        //add this affiliaton string to the array of affiliations for the author object, but only if not already present
                                                        if(authorsListDb[a]['affiliations_names'].indexOf(authorAffiliation) === -1){
                                                            authorsListDb[a]['affiliations_names'].push(authorAffiliation);
                                                        }

                                                    }
                                                }
                                            }

                                            if(authorMongoId != ''){
                                                //we matched the author in the xml response to a saved author
                                                //create object for updating the article doc
                                                var articleUpdate = {
                                                    'authors' : authorsListDb
                                                };

                                                //ARTICLE doc - updates
                                                //UPDATE - affiliation in author object
                                                Meteor.call('updateArticleByPmid',articlePmid, articleUpdate, function(err,res){
                                                    if(err){
                                                        console.log('updateArticle ERROR');
                                                        console.log(err);
                                                    }else{
                                                        //UPDATE - AddToSet affiliation
                                                        Meteor.call('addToArticleAffiliationsByPmid', articlePmid, authorAffiliation, function(e,r){
                                                            if(e){
                                                                console.log('addToArticleAffiliationsByPmid ERROR');
                                                                console.log(e);
                                                            }
                                                        });
                                                    }
                                                });

                                                //AUTHOR doc - updates
                                                Meteor.call('addAffiliationToAuthor',authorMongoId, authorAffiliation, function(err,res){
                                                    if(err){
                                                        console.log('addAffiliationToAuthor ERROR');
                                                        console.log(err);
                                                    }
                                                });
                                            }else{
                                                console.log('----ERROR: could not match');
                                                console.log('    authorNameFirst = ' + authorNameFirst  + ' / authorNameLast = ' + authorNameLast + ' / affi = ' + authorAffiliation);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }
        }
    },
    updateAllArticlesPubStatus: function(){
        console.log('--updateAllArticlesPubStatus');
        var articlesList = articles.find().fetch();
        for(var i = 0 ; i < articlesList.length ; i++){
            var pmid = articlesList[i]['ids']['pmid'];
            console.log('... pmid= ' + pmid);
            Meteor.call('getPubStatusFromPmid',pmid, function(error,result){
                if(error){
                    console.log('ERROR - getPubStatusFromPmid');
                    console.log(error);
                }else{
                    var update = {
                        'pub_status' : result
                    }
                    Meteor.call('updateArticle',articlesList[i]['_id'], update, function(e,r){
                        if(e){
                            console.log('ERROR - updateArticle');
                            console.log(e);
                        }
                    })
                }
            });
        }
    },
    updateAllArticlesAuthorsAffiliations: function(){
        console.log('--updateAllArticlesAuthorsAffiliations');
        var articlesList = articles.find().fetch();

        // loop through articles
        for(var i = 0 ; i < articlesList.length ; i++){
            var pmid = articlesList[i]['ids']['pmid'];
            console.log('... pmid= ' + pmid);
            if(articlesList[i]['affiliations']){
                var articleAffiliations = articlesList[i]['affiliations'];
                console.log('    articleAffiliations');
                console.log(articleAffiliations);
                if(articlesList[i]['authors']){
                    var authors = articlesList[i]['authors'];
                    // loop through authors
                    for(var a=0; a<authors.length ; a++){
                        if(articlesList[i]['authors'][a]['affiliations_names']){
                            console.log('    author '+a);
                            articlesList[i]['authors'][a]['affiliations_numbers'] = [];
                            var authorAffiliations = articlesList[i]['authors'][a]['affiliations_names'];
                            for(var aff = 0 ; aff< authorAffiliations.length ; aff++){
                                console.log('    '+articleAffiliations.indexOf(authorAffiliations[aff]));
                                if(articleAffiliations.indexOf(authorAffiliations[aff]) != -1){
                                    articlesList[i]['authors'][a]['affiliations_numbers'].push(articleAffiliations.indexOf(authorAffiliations[aff]))
                                }
                            }
                        }
                    }
                }

                Meteor.call('updateArticle',articlesList[i]['_id'], articlesList[i], function(e,r){
                    if(e){
                        console.log('ERROR - updateArticle');
                        console.log(e);
                    }
                });
            }
        }
    },
    fixIssueId: function(){
        console.log('--fixIssueId');
        var articlesList = articles.find().fetch();

        // loop through articles
        for(var i = 0 ; i < articlesList.length ; i++){
            var pmid = articlesList[i]['ids']['pmid'];
            console.log('... pmid= ' + pmid);
            var issue_id = issues.findOne({'issue' : articlesList[i]['issue'],'volume' : articlesList[i]['volume']});
            Meteor.call('updateArticle', articlesList[i]['_id'], {'issue_id' : issue_id['_id']});
        }
    }
})