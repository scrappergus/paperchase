Meteor.methods({
    getAbout: function(){
        var sorted  = sorters.findOne({ 'name': 'about' });
        if (sorted && sorted.ordered) {
            return sorted.ordered;
        }
    }
});

