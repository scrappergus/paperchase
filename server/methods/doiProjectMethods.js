// these were used for the DOI project.
Meteor.methods({
    getPubStatusForAllArticles: function(){
        console.log('..getPubStatusForAllArticles');
        var status = {};
        // I needed a list of all articles with status epub.
        for(var i=0 ; i< oncotargetPmidList.length ; i++){
            if(!oncotargetPubStatus[oncotargetPmidList[i]]){
                // output was too large, so did 2 batches. 2nd batch checked if already got pubstatus
                console.log(oncotargetPmidList[i]);
                Meteor.call('getPubStatusFromPmid', oncotargetPmidList[i], function(error,result){
                    if(error){
                        console.error('ERROR: ' + oncotargetPmidList[i]);
                        console.error(error);
                    }
                    if(result){
                        status[oncotargetPmidList[i]] = result;
                    }
                });
                if(i == parseInt(oncotargetPmidList.length - 1 )){
                    console.log('---------------------------------------');
                    console.log(status);
                }
            }
        }
    },
    getDateForAopArticles: function(){
        console.log('..getDateForAopArticles');
        var dates = {};
        // just get dates for AOP articles
        for(var i=0 ; i< oncotargetAop.length ; i++){
            console.log(oncotargetAop[i]);
            // oncotargetPmidList[i] = PMID
            Meteor.call('getPubDateFromPmid', oncotargetAop[i], function(error,result){
                if(error){
                    console.error('ERROR: ' + oncotargetAop[i]);
                    console.error(error);
                }
                if(result){
                    dates[oncotargetAop[i]] = result;
                }
            });
            if(i == parseInt(oncotargetAop.length - 1 )){
                console.log('---------------------------------------');
                console.log(dates);
            }
        }
    },
    getDoiForAopArticles: function(){
        console.log('..getDoiForAopArticles');
        var dates = {};
        // just get dates for AOP articles
        for(var i=0 ; i< oncotargetAop.length ; i++){
            console.log(oncotargetAop[i]);
            // oncotargetPmidList[i] = PMID
            Meteor.call('getElocationIdFromPmid', oncotargetAop[i], function(error,result){
                if(error){
                    console.error('ERROR: ' + oncotargetAop[i]);
                    console.error(error);
                }
                if(result){
                    dates[oncotargetAop[i]] = result;
                }else{

                    dates[oncotargetAop[i]] = 'No ElocationId';
                }
            });
            if(i == parseInt(oncotargetAop.length - 1 )){
                console.log('---------------------------------------');
                console.log(dates);
            }
        }
    },
    findDuplicatesAtPubMed: function(){
        for(var i=0; i<oncotargetAopPmid.length ; i++){
            console.log('--'+oncotargetAopPmid[i]);
            Meteor.call('getTitleByPmidAtPubMed',oncotargetAopPmid[i],function(error,title){
                if(error){
                    console.error(error);
                }
                if(title){
                    Meteor.call('getPmidByTitleAtPubMed',title,function(e,pmid){
                        if(e){
                            console.error(e);
                        }
                        if(pmid){
                            // console.log('..no duplicate');
                            // console.log(pmid);
                        }else{
                            console.log('DUPLICATE');
                        }
                    })
                }
            });

        }
    }
});