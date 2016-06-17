//these were used to batch process and save XML from pmc
var piiFail = [];

Meteor.methods({
    getPubMedId: function(article){
        // console.log('...getPubMedId ');
        var fut = new future();
        var pubMedUrl = 'http://www.ncbi.nlm.nih.gov/pubmed/';
        var pmidVerified,
            query = [],
            pmid = '',
            resultHtml,
            doc,
            pmidElement;
        // console.log(article.title);
        // using title, authors, etc query PubMed to get article PMID, which will then be the URL for the article
        if(article.title){
            // title = for double check
            // require title because this is what we will use to verify that the PMID retrieved is correct.

            for(var key in article){
                var v = article[key];
                // console.log(v);
                if(typeof v == Array){
                    v = v.join('+');
                }

                query.push(v);
            }
            query = query.join('+').replace(/\s+/g, '+');;
            // console.log('query');console.log(query);
            Meteor.http.get(pubMedUrl + '?term=' + query, function(error,result){
                if(error){
                    console.log('error');
                    console.log(error);
                }
                if(result){
                    resultHtml = result.content;
                    doc = new dom().parseFromString(resultHtml);
                    pmidElement = doc.getElementById('absid');
                    if(pmidElement){
                        for(var attr=0 ; attr < pmidElement.attributes.length ; attr++){
                            // if()
                            // console.log(pmid.attributes[attr].localName);
                            if(pmidElement.attributes[attr].localName == 'value' && pmidElement.attributes[attr].nodeValue){
                                pmid = pmidElement.attributes[attr].nodeValue;
                            }
                        }

                        // Verify that PMID is correct
                        if(pmid){
                            pmidVerified = Meteor.call('verifyPmid',pmid,article.title);
                            if(pmidVerified){
                                fut['return'](pmid);
                            }else{
                                fut['return'](false);
                            }
                        }else{
                            fut['return'](false);
                        }

                    }
                }else{
                    // return false;
                    // initial query using article data did not return a pmid
                    fut['return'](false);
                }
            });
        }
        return fut.wait();
    },
    verifyPmid: function(pmid,title){
        // console.log('..verifyPmid = ' + pmid);
        var fut = new future();
        var pubMedUrl = 'http://www.ncbi.nlm.nih.gov/pubmed/';
        var resultTitle = '',
            resultHtml,
            doc,
            resultTitleElement,
            resultTitle;
        // after querying PubMed for ID, verify that titles match
        Meteor.http.get(pubMedUrl + pmid, function(error,result){
            if(error){
                console.log('error');
                console.log(error);
            }
            if(result){
                // title match check
                resultHtml = result.content;
                doc = new dom().parseFromString(resultHtml);
                resultTitleElement = doc.getElementsByTagName('title');
                resultTitle = resultTitleElement[0].firstChild.nodeValue.replace('.  - PubMed - NCBI\n','');
                if(title == resultTitle){
                    // console.log('MATCH! = ' + pmid);console.log(resultTitle);
                    fut['return'](true);
                }else{
                    fut['return'](false);
                }

            }
        });
        return fut.wait();
    }
});