Meteor.advanceOjs = {
    research: function(){
        var sorted  = sorters.findOne({name:'advance'});
        if (sorted) {
            var advanceSections = Meteor.advance.articlesBySection(sorted.articles);
            var res;

            if (advanceSections['Recent Research Papers']) {
                res = advanceSections['Recent Research Papers'];
                res = res.concat(advanceSections['Research Papers']);
            } else {
                res = advanceSections['Research Papers'];
            }

            Session.set('ojsAdvanceResearch', res);
        }
    }
};
