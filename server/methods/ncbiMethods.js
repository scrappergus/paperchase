//these were used to batch process and save XML from pmc
var piiFail = [];

Meteor.methods({
    getPmcIdFromPmid: function(articlePMID){
        var pmcId;
        var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + articlePMID;
        var res;
        res = Meteor.http.get(requestURL);

        if(res){
            var articleIdList = res.data.result[articlePMID].articleids;
            var articleIdListL = articleIdList.length;
            for(var i = 0 ; i < articleIdListL ; i ++){
                if(articleIdList[i].idtype === 'pmc'){
                    // console.log(articleIdList[i].value);
                    pmcId = articleIdList[i].value;
                }
            }
        }
        return pmcId;
    },
    getElocationIdFromPmid: function(articlePMID){
        // console.log('..getElocationIdFromPmid: ' + articlePMID);
        var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + articlePMID;
        var res;
        res = Meteor.http.get(requestURL);

        if(res){
            var doi = res.data.result[articlePMID].elocationid;
            if(doi){
                return doi;
            }
        }
    },
    getDoiFromPmid: function(articlePMID){
        console.log('..getDoiFromPmid: ' + articlePMID);
        var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + articlePMID;
        var res;
        res = Meteor.http.get(requestURL);

        if(res){
            var articleIdList = res.data.result[articlePMID].articleids;
            var articleIdListL = articleIdList.length;
            for(var i = 0 ; i < articleIdListL ; i ++){
                if(articleIdList[i].idtype === 'doi'){
                    //fix for articles misindexed at pubmed
                    var val = articleIdList[i].value;
                    console.log(val);
                    return val;
                }
            }
        }
    },
    getPubDateFromPmid: function(articlePMID){
        // console.log('..getPubDateFromPmid: ' + articlePMID);
        var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + articlePMID;
        var res;
        res = Meteor.http.get(requestURL);

        if(res){
            if(res.data.result[articlePMID].pubdate){
                return res.data.result[articlePMID].pubdate;
            }else{
                console.log("NO PUB DATE");
            }
        }
    },
    getAllArticlesFromPubMed: function(){
        var fut = new future();
        // using journal ISSN, get all articles indexed at pubmed. will return list of PMID
        var issn = journalConfig.findOne().journal.issn;
        issn = '1949-2553';
        console.log('...getAllArticlesFromPubMed: ' + issn);
        var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&RetMax=90000000&term=' + issn;
        var res;
        res = Meteor.http.get(requestURL);

        if(res){
            // console.log(res.data);
            var articleIdList = res.data.esearchresult.idlist;
            // console.log(articleIdList);
            fut.return(articleIdList);
        }else{
            throw new Meteor.Error(500, 'getAllArticlesFromPubMed: Cannot get list of PMID from PubMed based on ISSN' , error);
        }
        return fut.wait();
    },
    getPiiFromPmid: function(articlePMID){
        var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + articlePMID;
        var res;
        res = Meteor.http.get(requestURL);

        if(res){
            var articleIdList = res.data.result[articlePMID].articleids;
            var articleIdListL = articleIdList.length;
            for(var i = 0 ; i < articleIdListL ; i ++){
                if(articleIdList[i].idtype === 'pii'){
                    //fix for articles misindexed at pubmed
                    var val = articleIdList[i].value;
                    if(val.indexOf('html') != -1){
                        var valPieces = val.split('/');
                        val = valPieces[valPieces.length -1].replace('.html','');
                    }
                    return val;
                }
            }
        }
    },
    getPubStatusFromPmid: function(pmid){
        // console.log('--getPubStatusFromPmid');
        var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=' + pmid;
        var res;
        res = Meteor.http.get(requestURL);
        if(res){
            var xml = res.content;
            var articlePubStatus = xml.substring(xml.lastIndexOf('<PublicationStatus>')+19,xml.lastIndexOf('</PublicationStatus>'));
            // console.log(articlePubStatus);
            return articlePubStatus;
        }
    },
    pubMedCiteCheck: function(xml){
        // console.log('--pubMedCiteCheck');
        var fut = new future();
        var url = 'http://www.ncbi.nlm.nih.gov';
        var validationResult = {};


        //post xml string to pubmed, response will provide redirect url. In the redirect, we check the content for valid message
        Meteor.http.post(url + '/pubmed/citcheck/',{
            params: {
                hfiletext: xml
            }
        }, function(error,result){
            if(error){
                console.error('ERROR - pubMedCiteCheck', error);
            }else{
                var goToUrl = url + result.headers.location;
                Meteor.http.get(goToUrl, function(e,r){
                    if(e){
                        console.error('pubMedCiteCheck follow location', e);
                        // throw new Meteor.Error('pubMedCiteCheck get: COULD NOT follow location', result.headers.location);
                        fut.throw(e);
                    }else{
                        // console.log('PUBMED',r.content);
                        var validXml = r.content.indexOf('Your document is valid');
                        if(validXml != -1){
                            validationResult.valid = true;
                            fut.return(validationResult);
                        }else{
                            validationResult.valid = false;
                            validationResult.pubMedPath = result.headers.location;
                            fut.return(validationResult);
                            throw new Meteor.Error('pubMedCiteCheck get: ERROR - Article Set Failed Validation', result.headers.location);
                        }
                    }
                });
            }
        });
        return fut.wait();
    },
    getPubMedId: function(article){
        // console.log('...getPubMedId ');
        var fut = new future();
        var pubMedUrl = 'https://www.ncbi.nlm.nih.gov/pubmed/';
        var pmidVerified,
            query = [],
            pmid = '',
            resultHtml,
            doc,
            pmidElement;
        if(article.title){

            query.push(Meteor.settings.public.journal.issn + '%5BISSN%5D');

            query.push(article.title + '%5BTitle%5D');

            if (article.authors) {
                article.authors.forEach(function(author){
                    var authorQueryStr = '';
                    if (author.name_last){
                        authorQueryStr += author.name_last;
                    }
                    authorQueryStr += '%5BAuthor%5D';
                    query.push(authorQueryStr);
                });
            }

            query = query.join('+').replace(/\s+/g, '+');
            Meteor.http.get(pubMedUrl + '?term=' + query, function(error,result){
                if(error){
                    console.error('getPubMedId', error);
                }
                if(result){
                    resultHtml = result.content;
                    doc = new dom().parseFromString(resultHtml);
                    pmidElement = doc.getElementById('absid');
                    if(pmidElement){
                        for(var attr=0; attr<pmidElement.attributes.length; attr++){
                            if(pmidElement.attributes[attr].localName == 'value' && pmidElement.attributes[attr].nodeValue){
                                pmid = pmidElement.attributes[attr].nodeValue;
                            }
                        }

                        // Verify that PMID is correct
                        if(pmid){
                            pmidVerified = Meteor.call('verifyPmid',pmid, article.ids);
                            if(pmidVerified){
                                fut.return(pmid);
                            }else{
                                fut.return(false);
                            }
                        }else{
                            fut.return(false);
                        }

                    } else {
                        fut.return(false);
                    }
                }else{
                    // initial query using article data did not return a pmid
                    fut.return(false);
                }
            });
        }
        return fut.wait();
    },
    getTitleByPmidAtPubMed: function(pmid){
        var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + pmid;
        var res;
        res = Meteor.http.get(requestURL);

        if(res){
            if(res.data.result[pmid].pubdate){
                // console.log('title = ' + res.data.result[pmid].title);
                return res.data.result[pmid].title;
            }else{
                console.log('NO TITLE: ' + pmid);
            }
        }
    },
    getPmidByTitleAtPubMed: function(title){
        // console.log('..verifyPmid = ' + pmid);
        var fut = new future();
        var pubMedUrl = 'http://www.ncbi.nlm.nih.gov/pubmed/?term=';
        var resultTitle = '',
            resultHtml,
            doc,
            resultTitleElement;
        title = title.replace('.','');
        // after querying PubMed for ID, verify that titles match
        console.log(pubMedUrl + encodeURIComponent(title));
        Meteor.http.get(pubMedUrl + encodeURIComponent(title), function(error,result){
            if(error){
                console.error('getPmidByTitleAtPubMed', error);
            }
            if(result){
                // title match check
                resultHtml = result.content;
                doc = new dom().parseFromString(resultHtml);
                resultTitleElement = doc.getElementsByTagName('title');
                resultTitle = resultTitleElement[0].firstChild.nodeValue.replace('.  - PubMed - NCBI\n','');
                if(title == resultTitle){
                    // console.log('MATCH! = ' + pmid);console.log(resultTitle);
                    fut.return(true);
                }else{
                    // console.log('NO MATCH');
                    fut.return(false);
                }

            }
        });
        return fut.wait();
    },
    verifyPmid: function(pmid, ids){
        // console.log('..verifyPmid = ' + pmid);
        var fut = new future();
        var pubMedUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=';
        var resultTitle = '',
            resultHtml,
            doc,
            resultTitleElement;
        var pubMedJson;
        var pubMedIdsByKey = {};
        // after querying PubMed for ID, verify that IDs match
        Meteor.http.get(pubMedUrl + pmid, function(error,result){
            if (error){
                console.error('verifyPmid', error);
            } else if (result){
                pubMedJson = JSON.parse(result.content);

                if (pubMedJson.result[pmid].articleids) {
                    pubMedJson.result[pmid].articleids.forEach(function(articleId){
                        pubMedIdsByKey[articleId.idtype] = articleId.value;
                    });
                } else{
                    fut.return(false);
                }

                if (pubMedIdsByKey.pii && ids.pii && pubMedIdsByKey.pii === ids.pii){
                    fut.return(true);
                } else if(pubMedIdsByKey.pii && ids.publisher && pubMedIdsByKey.pii === ids.publisher){
                    fut.return(true);
                } else if(pubMedIdsByKey.doi && ids.doi && pubMedIdsByKey.doi === ids.doi){
                    fut.return(true);
                } else{
                    fut.return(false);
                }

            }
        });
        return fut.wait();
    }
});
