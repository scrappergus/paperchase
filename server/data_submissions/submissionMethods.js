Meteor.methods({
    registerDoiSet: function(piiList){
        piiList = piiList.substring(0, piiList.length - 1); //remove trailing comma
        var requestURL = doiConfig.api.doi + journalConfig.short_name +'/' + piiList;
        var res;
        res = Meteor.http.get(requestURL + '?test=true');
        if(res && res.statusCode === 200){
            return true;
        }else{
            console.log(res);
            throw new Meteor.Error('Cannot register set');
        }
    },
    generateDateXml: function(date){
        date = new Date(date);
        var xmlString = '';
        xmlString += '<Year>';
        xmlString +=  date.getFullYear();
        xmlString += '</Year>';
        xmlString += '<Month>';
        xmlString +=  parseInt(date.getMonth() + 1);
        xmlString += '</Month>';
        xmlString += '<Day>';
        xmlString +=  date.getDate();
        xmlString += '</Day>';
        return xmlString;
    },
    createArticlePubMedXml: function(articleMongo){
        // console.log('..createArticlePubMedXml ',articleMongo);
        var article = articles.findOne({_id :articleMongo});
        var journalSettings = Meteor.call('getConfigJournal');
        var pubType = 'Journal Article';
        if(article.length === 0){
            throw new Meteor.Error('xml-generation failed', 'Could not create article XML');
        }else{
            // console.log(article);
            var xmlString = '<Article><Journal><PublisherName>' + journalSettings.publisher.name + '</PublisherName><JournalTitle>' + journalSettings.name + '</JournalTitle><Issn>' + journalSettings.issn + '</Issn>';
            xmlString += '<Volume>' + article.volume + '</Volume>';
            xmlString += '<Issue>' + article.issue + '</Issue>';

            //status and date
            if(article.pub_status === 'epublish' || article.pub_status === 'ppublish'){
                xmlString += '<PubDate PubStatus="ppublish">';
            }else{
                xmlString += '<PubDate PubStatus="aheadofprint">';
            }
            xmlString += Meteor.call('generateDateXml',article.dates.epub);
            xmlString += '</PubDate>';


            xmlString += '</Journal>';

            //PMID
            if(article.ids.pmid){
                xmlString += '<Replaces IdType="pubmed">' + article.ids.pmid + '</Replaces>';
            }

            //title
            xmlString += '<ArticleTitle>';
            xmlString += article.title;
            xmlString += '</ArticleTitle>';

            //pages
            xmlString += '<FirstPage>';
            xmlString += article.page_start;
            xmlString += '</FirstPage>';
            xmlString += '<LastPage>';
            xmlString += article.page_end;
            xmlString += '</LastPage>';

            xmlString += '<Language>EN</Language>';

            if(article.authors){
                xmlString += '<AuthorList>';
                for(var a = 0; a < article.authors.length ; a++){
                    xmlString += '<Author>';
                    if(article.authors[a].name_first){
                        xmlString += '<FirstName>';
                        xmlString += article.authors[a].name_first;
                        xmlString += '</FirstName>';
                    }
                    if(article.authors[a].name_middle){
                        xmlString += '<MiddleName>';
                        xmlString += article.authors[a].name_middle;
                        xmlString += '</MiddleName>';
                    }
                    if(article.authors[a].name_last){
                        xmlString += '<LastName>';
                        xmlString += article.authors[a].name_last;
                        xmlString += '</LastName>';
                    }
                    if(article.authors[a].affiliations_numbers && article.authors[a].affiliations_numbers.length > 0){
                        xmlString += '<Affiliation>';
                        for(var aff = 0 ; aff < article.authors[a].affiliations_numbers.length ; aff++){
                            var authorAffNumber = article.authors[a].affiliations_numbers[aff];
                            var authorAff = article.affiliations[authorAffNumber];
                            authorAff = Meteor.call('xmlStringFix',authorAff);
                            xmlString += authorAff;
                        }
                        xmlString += '</Affiliation>';
                    } else if(article.affiliations && article.affiliations.length === 1){
                        xmlString += '<Affiliation>' + article.affiliations[0] + '</Affiliation>';
                    }

                    xmlString += '</Author>';
                }
                xmlString += '</AuthorList>';

                if(article.article_type.pubmed_type){
                    pubType = article.article_type.name ;

                } else if(article.article_type._id){
                    // check if article just does not have pubmed_type saved, because this was added to article type collection after launch
                    var articleType = articleTypes.findOne({_id : article.article_type._id});
                    if(articleType.pubmed_type){
                        pubType = articleType.pubmed_type;
                    }
                }
                xmlString += '<PublicationType>' + pubType + '</PublicationType>';
            }

            //article ids
            xmlString += '<ArticleIdList>';
            var articleIds = article.ids;
            for(var articleId in articleIds){
                //reset attribute value
                var articleIdType = articleId;
                if(articleIdType === 'pmid'){
                    articleIdType = 'pubmed';
                }else if(articleIdType === 'pmc'){
                    articleIdType = 'pmcid';
                }

                xmlString += '<ArticleId IdType="' + articleIdType + '">' + articleIds[articleId] + '</ArticleId>';

            }
            xmlString += '</ArticleIdList>';

            //article history
            xmlString += '<History>';
            var articleHistory = article.history;
            for(var history in articleHistory){
                xmlString += '<PubDate PubStatus="' + history + '">';
                xmlString += Meteor.call('generateDateXml',articleHistory[history]);
                xmlString += '</PubDate>';
            }
            xmlString += '</History>';

            xmlString += '</Article>';
            // console.log(xmlString);

            return xmlString;
        }
    },
    createPubMedArticleSetXml: function(submissionList, userId){
        //create a string of article xml, validate at pubmed, return any articles that failed
        // console.log('...createPubMedArticleSetXml ');
        // var fut = new future();
        var articleSetXmlString = '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE ArticleSet PUBLIC "-//NLM//DTD PubMed 2.6//EN" "http://www.ncbi.nlm.nih.gov/corehtml/query/static/PubMed.dtd">';
        articleSetXmlString += '<ArticleSet>';
        submissionList.forEach(function(article){
            Meteor.call('createArticlePubMedXml', article._id, function(error, xmlString){
                if(error){
                    console.error('ERROR - createPubMedArticleSetXml', error);
                }else{
                    articleSetXmlString += xmlString;
                }
            });
        });
        articleSetXmlString += '</ArticleSet>';
        return articleSetXmlString;
        // return fut.wait();
    },
    pubMedArticleSetXml: function(submissionList, user){
        // console.log('..pubMedArticleSetXml');
        var fut = new future();
        var result = {};
        Meteor.call('createPubMedArticleSetXml', submissionList, function(error, xmlSet){
            if(error){
                console.error('ERROR - createPubMedArticleSetXml', error);
            } else if(xmlSet){
                Meteor.call('pubMedCiteCheck', xmlSet, function(citeCheckError, r){
                    if(citeCheckError){
                        console.error('ERROR - pubMedCiteCheck', citeCheckError);
                        throw new Meteor.Error('pubMedCiteCheck: ERROR - Article Set Failed Validation', result.headers.location);
                    } else if(r){
                        //all valid. save the xml set
                        var today = new Date();
                        var dd = today.getDate();
                        var mm = today.getMonth()+1;
                        var yyyy = today.getFullYear();
                        var time = today.getTime();
                        var fileName = mm + '_' + dd + '_' + yyyy + '_' + time + '.xml';
                        result.fileName = fileName;
                        Meteor.call('saveXmlCiteSet', xmlSet, fileName, function(saveError, saveResult){
                            if(saveError){
                                console.error('saveXmlCiteSet', saveError);
                            }else if(saveResult){
                                Meteor.call('submitPubMedXmlSet', fileName, function(submitError, submitResult){
                                    if(submitError){
                                        console.error('submitPubMedXmlSet', submitError);
                                    }else if(submitResult){
                                        //update the submissions collection
                                        var created = new Date();
                                        var createdBy = {
                                            user_id : user._id,
                                            user_email: user.emails[0].address
                                        };
                                        var submissionId = submissions.insert({'file_name' : fileName, 'created_by' : createdBy, 'created_date' : created});
                                        result.submissionId = submissionId;
                                        //update article docs
                                        Meteor.call('articlesStatusUpdate', submissionList, submissionId, created);

                                        //return file name to redirect for download route
                                        fut.return(result);
                                    }
                                });
                            }
                        });
                    }else{
                        console.log('ERROR: XML Set NOT valid.');
                        fut.return('invalid');
                    }
                });
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    saveXmlCiteSet: function(xml,fileName){
        // console.log('.....saveXmlCiteSet');
        var fut = new future();
        var journal = journalConfig.findOne();
        var bucket = journalConfig.findOne({}).s3.bucket + '/' + journal.s3.folders.pubmed_xml_sets;
        var params = {Bucket: bucket, Body: xml, Key: fileName};
        S3.aws.upload(params, function(err, xmlUploaded) {
            if(err){
                console.error('S3 PubMed XML set upload', err);
            }else if(xmlUploaded){
                fut.return(true);
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    },
    articlesStatusUpdate: function(submissionList, submissions_id, created){
        submissionList.forEach(function(article){
            var update = {
                'submission_id' : submissions_id,
                'created_date' : created,
                'pub_status' : article.pub_status
            };

            Meteor.call('pushArticle', article._id, 'submissions', update);
        });
    },
    xmlStringFix: function(string){
        //&
        if(string.indexOf('&')!= -1){
            //make sure that it is not already fixed
            var check = string.substring(string.indexOf('&'), parseInt(string.indexOf('&')+2));
            if(check != '&a'){
                string = string.replace('&','&amp;');
            }
        }
        return string;
    },
    dataSubmissionsNotifyByEmail: function(submissionId, user){
        this.unblock();
        var submissionData = submissions.findOne({_id : submissionId});
        var journal = journalConfig.findOne();
        var message = 'New PubMed submission for ' + journal.journal.name + '\n';
        if(submissionData){
            message += submissionData.file_name + '\n';
            message += 'sent by ' + submissionData.created_by.user_email + '\n\n';
            message += 'XML set:\n';
            message += journal.assets + journal.s3.folders.pubmed_xml_sets + '/' + submissionData.file_name;
        }

        Meteor.call('getDataSubmissionsEmails', function(error, emails){
            if(error){
                console.error('getConfigSenderEmail', error);
            } else if(emails){
                if(emails.to.indexOf(user.emails[0].address) === -1){
                    emails.to.push(user.emails[0].address);
                }
                Email.send({
                   to: emails.to,
                   from: emails.from,
                   subject: 'New Data Submission',
                   text: message
                });
            }
        });
    },
    submitPubMedXmlSet: function(fileName){
        // console.log('...submitPubMedXmlSet',fileName);
        var fut = new future();
        var journal = journalConfig.findOne();
        if(journal){

            // S3
            var fromRemotePath = journal.assets + journal.s3.folders.pubmed_xml_sets + '/' + fileName;
            var bucket = journalConfig.findOne({}).s3.bucket + '/' + journal.s3.folders.pubmed_xml_sets;
            var params = {Bucket: bucket, Key: fileName};

            // PubMed FTP
            var toRemotePath = journal.pubmed.ftp.directory + '/' + fileName;
            var host = journal.pubmed.ftp.host;
            var user = journal.pubmed.ftp.user;
            var pw = journal.pubmed.ftp.pw;

            S3.aws.getObject(params, function(getSetErr, xmlSetData) {
                if (getSetErr){
                    console.error('Get PubMed XML Set for Submission', getSetErr);
                } else if(xmlSetData){
                    var connectionProps = {
                        host: host,
                        user: user,
                        password: pw
                    };

                    var c = new Client();
                    c.on('ready', function() {
                        c.put(xmlSetData.Body, toRemotePath, function(err) {
                            if (err){
                                fut.throw(err);
                            }else{
                                fut.return(true);
                            }
                            c.end();
                        });
                    });
                    c.connect(connectionProps);
                }
            });
        }
        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(err);
        }
    }
});
