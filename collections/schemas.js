// about
    about.schema = new SimpleSchema({
        content: {type: String, optional: true},
        display: {type: Boolean, optional: true},
        title: {type: String, optional: false}
    });
// article_types
    articleTypes.schema = new SimpleSchema({
        name: {type: String},
        nlm_type: {type: String},
        plural: {type: String},
        short_name: {type: String}
    });
// articles
    articles.schema = new SimpleSchema({
        abstract: {type: String, optional: true},
        advance: {type: Boolean, optional: true},
        affiliations: {type: [String], optional: true},
        article_type:  {type: Object, optional: true},
        'article_type._id': {type: String, optional: true},
        'article_type.name': {type: String, optional: true},
        'article_type.nlm_type': {type: String, optional: true},
        'article_type.plural': {type: String, optional: true},
        'article_type.short_name': {type: String, optional: true},
        authors: {type: [Object], optional: true},
        'authors.$.name_first': {type: String, optional: true, label: 'First name'},
        'authors.$.name_middle': {type: String, optional: true, label: 'Middle name'},
        'authors.$.name_last': {type: String, optional: true, label: 'Last name'},
        correspondence: {type: [Object], optional: true},
        'correspondence.$.email': {type: String, optional: true},
        'correspondence.$.text': {type: String, optional: true},
        dates: {type: Object, optional: true},
        'dates.collection': {type: Date, optional: true},
        'dates.ecorrected': {type: Date, optional: true},
        'dates.epreprint': {type: Date, optional: true},
        'dates.eretracted': {type: Date, optional: true},
        'dates.epub': {type: Date, optional: true},
        'dates.epub-ppub': {type: Date, optional: true},
        'dates.pcorrected': {type: Date, optional: true},
        'dates.ppreprint': {type: Date, optional: true},
        'dates.ppub': {type: Date, optional: true},
        'dates.pretracted': {type: Date, optional: true},
        display: {type: Boolean, optional: true},
        feature: {type: Boolean, optional: true},
        files: {type: [Object], optional: true},
        history: {type: Object, optional: true},
        'history.accepted': {type: Date, optional: true},
        'history.corrected': {type: Date, optional: true},
        'history.preprint': {type: Date, optional: true},
        'history.pub': {type: Date, optional: true},
        'history.received': {type: Date, optional: true},
        'history.rev-recd': {type: Date, optional: true},
        'history.rev-request': {type: Date, optional: true},
        ids: {type: Object, optional: true},
        'ids.doi': {type: String, optional: true},
        'ids.manuscript': {type: String, optional: true},
        'ids.medline': {type: String, optional: true},
        'ids.pii': {type: String, optional: true},
        'ids.pmc': {type: String, optional: true},
        'ids.pmid': {type: String, optional: true},
        issue: {type: String, optional: true},
        issue_id: {type: String, optional: true},
        keywords: {type: [String], optional: true},
        page_end: {type: Number, optional: true, label: 'Last page'},
        page_start: {type: Number, optional: true, label: 'First page'},
        publisher: {type: String, optional: true},
        title: {type: String, optional: false},
        volume: {type: Number, optional: true, label: 'Volume'}
    });
// authors
// config
// contact
// edboard
// for_authors
// institutions
// issues
// news
// roles
// sections
// sorters
// users
// volume

// NOTE: if nested object required, parent object must be too