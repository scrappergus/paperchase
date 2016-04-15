// Shared methods for all DTD types
// -------------
Meteor.methods({
    getXml: function(url){
        // console.log('getXml',url);
        var fut = new future();
        Meteor.http.get(url,function(getXmlError, xmlRes){
            if(getXmlError){
                console.error('getXmlError',getXmlError);
                fut.throw(getXmlError);
            }else if(xmlRes){
                xml = xmlRes.content;
                fut.return(xml);
                // console.log('xml',xml);
            }
        });
        return fut.wait();
    },
    xmlDtd: function(xmlString){
        // console.log('xmlDtd',xmlString);
        // TODO: use regex for dtd
        var aopSearchPattern = '<!DOCTYPE ArticleSet PUBLIC "-\/\/NLM\/\/DTD PubMed 2.0\/\/EN" "http:\/\/www.ncbi.nlm.nih.gov:80\/entrez\/query\/static\/PubMed.dtd">';
        var pmcSearchPattern = '<!DOCTYPE pmc-articleset PUBLIC "-\/\/NLM\/\/DTD ARTICLE SET 2.0\/\/EN" "http:\/\/dtd.nlm.nih.gov\/ncbi\/pmc\/articleset\/nlm-articleset-2.0.dtd">'
        var aopRes = xmlString.search(aopSearchPattern);
        var pmcRes = xmlString.search(pmcSearchPattern);
        if(aopRes != -1){
            return 'AOP';
        }else if(pmcRes != -1){
            return 'PMC';
        }else{
            return false;
        }
    },
    processXmlString: function(xml){
        // console.log('..processXmlString');
        var fut = new future();
        Meteor.call('xmlDtd',xml, function(error,dtd){
            if(error){
                console.error('DTD',error);
            }else if(dtd && dtd === 'PMC'){
                Meteor.call('processPmcXml',xml, function(error,result){
                    if(error){
                        console.error('processPmcXml',error);
                    }else if(result){
                        fut.return(result);
                    }
                });
            }else if(dtd && dtd === 'AOP'){
                Meteor.call('processAopXml',xml, function(error,result){
                    if(error){
                        console.error('processAopXml',error);
                    }else if(result){
                        fut.return(result);
                    }
                });
            }else{
                fut.throw('Could not process XML.');
            }
        });

        return fut.wait();
    },
    parseXmltoJson: function(xml){
        // console.log('..parseXmltoJson');
        var fut = new future();
        parseString(xml, function (error, articleJson) {
            if(error){
                console.error('ERROR');
                console.error(error);
                return 'ERROR';
            }else{
                fut.return(articleJson);
            }
        });
        return fut.wait();
    }
});

// Methods to compare XML with DB
// -------------
var ignoreConflicts = ['_id','doc_updates','issue_id','batch', 'files', 'display'];
var ignoreConflictsViaXml = ['figures','supplementary']; // want this separate because we actually want to include them from the XML, but do not want to compare with DB values

Meteor.methods({
    compareObjectsXmlWithDb: function(parentKey, xmlValue, dbValue){
        // console.log('..compareObjectsXmlWithDb',parentKey);
        // console.log(JSON.stringify(xmlValue));console.log(JSON.stringify(dbValue));
        var fut = new future();
        var conflict = '';
        var keyCount = 0;
        var xmlVal,
            dbVal;
        //TODO: add check for matching object lengths
        if(Object.keys(dbValue).length != 0){
            for(var valueKey in dbValue){
                // DB will have more keys because middle name, affiliations, etc all will be empty if they do not exist. whereas from the XML, the key will not exist
                // make sure XML has this key too
                if(xmlValue[valueKey]){
                    xmlVal = xmlValue[valueKey];
                    dbVal = dbValue[valueKey];
                    if(parentKey === 'dates' || parentKey === 'history'){
                       xmlVal = Meteor.dates.article(xmlVal);
                       dbVal = Meteor.dates.article(dbVal);
                    }
                    Meteor.call('compareValuesXmlWithDb', valueKey, xmlVal, dbVal,function(error,c){
                        if(c){
                            // append to other conflicts in this object
                            conflict += '<div class="clearfix"></div><b>' + valueKey + '</b>: ' + c.conflict + ' ';
                        }
                    });
                }else if(dbValue[valueKey] != '' && Object.keys(dbValue[valueKey]).length != 0){
                    conflict += '<div class="clearfix"></div><b>' + valueKey + '</b>: Missing in XML. In database: ';
                    if(valueKey == 'affiliations_numbers'){
                        for(var aff in dbValue[valueKey]){
                            conflict += parseInt(dbValue[valueKey][aff] + 1) + ' ';// in database, the affiliation numbers are 0 based. Make this easier for the user to get
                        }
                    }else{
                        conflict += JSON.stringify(dbValue[valueKey]) + ' ';
                    }

                }
                keyCount++;
                // console.log(keyCount);
                if(keyCount == Object.keys(dbValue).length){
                    // console.log('CONFLICT = ');console.log(conflict);
                    fut.return(conflict);
                }
            }
        }else{
            // Object is empty in DB.
            for(var valueKey in xmlValue){
                conflict += '<div class="clearfix"></div><b>' + valueKey + '</b>: Missing in database. In XML.';
                keyCount++;
                // console.log(keyCount);
                if(keyCount == Object.keys(xmlValue).length){
                    // console.log('CONFLICT = ');console.log(conflict);
                    fut.return(conflict);
                }
            }
        }

        return fut.wait();
    },
    compareValuesXmlWithDb: function(key, xmlValue, dbValue){
        // console.log('..compareValuesXmlWithDb');
        // console.log('  ' + key + ' : ' + xmlValue + ' =? ' + dbValue);
        var conflict = {};
            conflict.what = key,
            conflict.conflict = ''; //make empty so that later when looping through object the first iteration is not undefined.
        var arraysConflict = false;
        if(typeof xmlValue == 'string' || typeof xmlValue == 'boolean' || typeof xmlValue == 'number' || typeof xmlValue.getMonth === 'function'){ //treat dates as strings for comparisson
            if(xmlValue == dbValue){
            }else{
                // keep type comparisson. affiliation numbers are checked here and are 0 based, which would be false when checking.
                conflict.conflict = '<div class="clearfix"></div><b>XML != Database</b><div class="clearfix"></div>' + xmlValue + '<div class="clearfix"></div>!=<div class="clearfix"></div>' + dbValue;
            }
        }else if(typeof xmlValue == 'object' && !Array.isArray(xmlValue)){
            Meteor.call('compareObjectsXmlWithDb', key, xmlValue, dbValue, function(error,result){
                if(result){
                    conflict.conflict = result;
                }
            });
        }else if(typeof xmlValue == 'object' && Array.isArray(xmlValue)){
            // Make sure it is not an array of objects. arraysDiffer cannot handle objects.
            // if an array of objects (for ex, authors), then the order of objects in the array is important
            var idxIs = '';
            if(key === 'authors'){
                idxIs = 'Author ';
            }
            for(var arrIdx=0 ; arrIdx<xmlValue.length ; arrIdx++){
                if(typeof xmlValue[arrIdx] == 'object'){
                    Meteor.call('compareObjectsXmlWithDb', key, xmlValue[arrIdx], dbValue[arrIdx],function(err,res){
                        if(err){
                            console.error(err);
                        }
                        if(res){
                            conflict.conflict += '<div class="clearfix"></div><b>' + idxIs +  '#' + parseInt(arrIdx+1) + '</b>' + res;
                        }
                    });
                }else{
                    Meteor.call('compareValuesXmlWithDb', '', xmlValue[arrIdx], dbValue[arrIdx],function(e,r){
                        if(r){
                            conflict.conflict += r.conflict;
                        }
                    });
                }
            }
        }else{
            //TODO add checks for missing
        }

        if(conflict.conflict){
            return conflict;
        }else{
            return false; // they match, no conflicts.
        }
    },
    compareProcessedXmlWithDb: function(xmlArticle, dbArticle){
        // console.log('..compareProcessedXmlWithDb');
        // Take the XML data and compare with the data from the DB
        // this is for the article form and after XML is uploaded
        // Note: There are things in dbArticle that are not in the XML. For example, if an article is advance or feature
        // Note: Merged data will be from the XML if there is a conflict

        var merged = {};
            merged.conflicts = [];

        // since DB has more info than XML loop through its data to compare. Later double check nothing missing from merge by looping through XML data
        for(var keyDb in dbArticle){
            if(ignoreConflicts.indexOf(keyDb) == -1 && ignoreConflictsViaXml.indexOf(keyDb) == -1 ){
                if(dbArticle[keyDb] != '' && xmlArticle[keyDb]){
                    //XML will not have empty value, but DB might because of removing an article from something (ie, removing from a section)
                    merged[keyDb] = xmlArticle[keyDb]; // both versions have data for key. if there are conflicts, then form will default to XML version
                    // now check if there are conflicts between versions
                    Meteor.call('compareValuesXmlWithDb', keyDb, xmlArticle[keyDb], dbArticle[keyDb], function(error,conflict){
                        if(conflict){
                            merged.conflicts.push(conflict);
                        }
                    });
                }else if(dbArticle[keyDb] == '' && xmlArticle[keyDb]){
                    // console.log(dbArticle[keyDb],xmlArticle[keyDb]);
                    merged[keyDb] = xmlArticle[keyDb];
                    merged.conflicts.push({
                        'what' : keyDb,
                        'conflict' : 'In XML, NOT in database: ' + xmlArticle[keyXml]
                    });
                }else if(dbArticle[keyDb] != '' && !xmlArticle[keyDb]){
                    if(typeof dbArticle[keyDb] === 'object' && Object.keys(dbArticle[keyDb]).length === 0){
                        // ignore empty objects in DB if there is nothing in the XML. There is no conflict
                    }else{
                        // If in DB but not in XML
                        // skip mongo ID, issue mongo ID, db doc_updates etc for comparing
                        // stringify database info in case type is object
                        merged[keyDb] = dbArticle[keyDb];
                        merged.conflicts.push({
                            'what' : keyDb,
                            'conflict' : 'In database, NOT in XML<div class="clearfix"></div>' + JSON.stringify(dbArticle[keyDb])
                        });
                    }
                }else if(keyDb == '_id'){
                    merged[keyDb] = dbArticle[keyDb];
                }else if(keyDb == 'issue_id'){
                    if(xmlArticle.issue_id && xmlArticle.issue_id != dbArticle[keyDb]){
                        merged.conflicts.push({
                            'what' : 'Issue Changed',
                            'conflict' : '<div class="clearfix"></div><b>XML != Database</b><div class="clearfix"></div>' + xmlArticle.issue_id + '<div class="clearfix"></div>!=<div class="clearfix"></div>' + dbArticle[keyDb]
                        });
                    }
                    merged[keyDb] = dbArticle[keyDb]; // add DB issue_id value to merged,
                }else{
                    // console.log('..else');
                    // the database value is empty and the XML does not have this
                }
            }else{
                merged[keyDb] = dbArticle[keyDb];
            }

        }
        // console.log('merged',merged);
        // Now make sure there isn't anything missing from XML
        for(var keyXml in xmlArticle){
            if(ignoreConflicts.indexOf(keyXml) == -1 && ignoreConflictsViaXml.indexOf(keyXml) == -1 ){
                if(!merged[keyXml]){
                    merged[keyXml] = xmlArticle[keyXml];
                    if(keyXml != 'issue_id'){
                        merged.conflicts.push({
                            'what' : keyXml,
                            'conflict' : 'In XML, NOT in database: ' + xmlArticle[keyXml]
                        });
                    }
                }
            }else if(ignoreConflictsViaXml.indexOf(keyXml) != -1 ){
                merged[keyXml] = xmlArticle[keyXml]; // for figures and supps from XML. DB will ALWAYS reflect what is in the XML.
            }
        }

        return merged;
    },
    arraysDiffer: function(xmlKw, dbKw){
        // console.log('..arraysDiffer');
        // console.log(xmlKw);conflict.log(dbKw);
        // returns true if they DO NOT match
        // for just comparing KW between upoaded XML and DB info
        // create temporary for comparing, because we want the admins to be able to control order of kw
        var tempXmlKw,
            tempDbKw;
        tempXmlKw = xmlKw.sort();
        tempDbKw = dbKw.sort();
        // not same number of keywords
        if(tempXmlKw.length != tempDbKw.length){
            return true;
        }else{
            // same number of kw, but check if not matching
            for (var kw = 0; kw < tempXmlKw.length; kw++) {
                if (tempXmlKw[kw] !== tempDbKw[kw]){
                    return true;
                }
            }
        }
    }
});

// Shared functions for all DTD types
Meteor.xmlParse = {
    traverseJson: function(data){
        // console.log('data',data);
        // for when node value has style, but we do not want the style
        var string = '';
        for(var k in data){
            if(typeof data[k] == 'string'){
                string += data[k];
            }
        }
        return string;
    }
}