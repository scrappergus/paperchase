// methods used to create full text HTML from XML
Meteor.methods({
    getFilesForFullText: function(mongoId){
        var fut = new future();
        var supplemental,
            articleJson,
            articleInfo,
            figures = [],
            xml;
        articleInfo = articles.findOne({'_id' : mongoId});
        if(articleInfo){
            articleInfo = Meteor.article.readyData(articleInfo);
            if(articleInfo.files && articleInfo.files.figures){
                figures = articleInfo.files.figures;
            }
            if(articleInfo.files && articleInfo.files.supplemental){
                supplemental = articleInfo.files.supplemental;
            }

            if(articleInfo.files && articleInfo.files.xml){
                Meteor.http.get(articleInfo.files.xml.url,function(getXmlError, xmlRes){
                    if(getXmlError){
                        console.error('getXmlError',getXmlError);
                        fut.throw(getXmlError);
                    }else if(xmlRes){
                        xml = xmlRes.content;
                        Meteor.call('fullTextToJson',xml, {figures:figures, supplemental:supplemental}, mongoId, function(convertXmlError, convertedXml){
                            if(convertXmlError){
                                console.error('convertXmlError',convertXmlError);
                                fut.throw(convertXmlError);
                            }else{
                                convertedXml.mongo = mongoId;
                                fut.return(convertedXml);
                            }
                        });
                    }
                });
            } else {
                fut.return({});
            }
        }
        return fut.wait();
    },
    fullTextToJson: function(xml, files, mongoId){
        // Full XML processing. Content, and References
        // console.log('... fullTextToJson');
        var fut = new future();
        var articleObject = {};
        var doc = new dom().parseFromString(xml);

        articleObject.sections = [];

        // Article Content
        // ---------------
        var sections = xpath.select('//body/sec | //body/p', doc);
        if(sections[0]){
            for(var section = 0; section<sections.length; section++){
                var sectionObject;
                if(sections[section].localName === 'sec'){
                    sectionObject = Meteor.fullText.sectionToJson(sections[section],files, mongoId);
                    for(var sectionAttr = 0; sectionAttr < sections[section].attributes.length; sectionAttr++){
                        if(sections[section].attributes[sectionAttr].nodeName === 'sec-type'){
                            sectionObject.type = sections[section].attributes[sectionAttr].nodeValue;
                        }else if(sections[section].attributes[sectionAttr].nodeName === 'id'){
                            var sectionId = sections[section].attributes[sectionAttr].nodeValue;

                            sectionObject.headerLevel = Meteor.fullText.headerLevelFromId(sectionId);
                            sectionObject.sectionId = sectionId;
                        }
                    }
                }else if(sections[section].localName === 'p'){
                    sectionObject = {};
                    sectionObject.content = [];
                    sectionObject.content.push(Meteor.fullText.sectionPartsToJson(sections[section]));
                }

                // console.log('sectionObject',sectionObject);

                articleObject.sections.push(sectionObject);
            }
        }

        // Acknowledgements
        // ---------
        var acks = xpath.select('//ack', doc);
        if(acks[0]){
            articleObject.acks = [];
            for(var ackIdx = 0 ; ackIdx < acks.length ; ackIdx++){
                ack = acks[ackIdx];

                var ackObj = Meteor.fullText.sectionToJson(ack);

                ackObj.title = "Acknowledgements";

                articleObject.acks.push(ackObj);
            }
        }

        // Footnotes
        // ---------
        var footnotes = xpath.select('//fn-group', doc);
        if(footnotes){
            articleObject.footnotes = [];
            for(var i=0; i<footnotes.length; i++){
                var footObj = {};

                for(var c=0; c< footnotes[i].childNodes.length; c++){
                    var foot = Meteor.fullText.convertContent(footnotes[i].childNodes[c]);

                    if(foot){
                        if(footnotes[i].childNodes[c].localName){
                            footObj[footnotes[i].childNodes[c].localName] = foot;
                        }
                    }
                }

                if(Object.keys(footObj).length !=0 ){
                    if(!footObj.title && footObj.fn){
                        var conflictTestPattern = new RegExp(/conflict(s)* of interest/i);
                        if(conflictTestPattern){
                            footObj.title = 'Conflict of Interests Statement';
                        }
                    }
                    articleObject.footnotes.push(footObj);
                }
            }
        }

        // Glossary
        // --------
        var glossary = xpath.select('//def-list', doc);
        if(glossary[0]){
            articleObject.glossary = [];
            for(var glossIdx in glossary[0].childNodes){
                if(typeof Number(glossIdx) == 'number' && glossary[0].childNodes[glossIdx].tagName == 'def-item') {
                    var term = {};
                    for(var i=0; i < glossary[0].childNodes[glossIdx].childNodes.length ; i++){
                        var glossParsed = '';
                        glossParsed = Meteor.fullText.removeParagraphTags(Meteor.fullText.convertContent(glossary[0].childNodes[glossIdx].childNodes[i]));

                        if(glossParsed != ''){
                            term[glossary[0].childNodes[glossIdx].childNodes[i].tagName] = glossParsed;
                        }
                    }
                    if(Object.keys(term).length !=0 ){
                        articleObject.glossary.push(term);
                    }

                }
            }
        }

        // References
        // ----------
        // TODO: editorials have a different reference style
        // <ref><label><element-citation>
        // we want to search for //ref because that has the ID attribute. We do not want to rely on the index of the reference for the ID.
        var references = xpath.select('//ref', doc);
        if(references[0]){
            // console.log('referencesreferences', references[0]);
            articleObject.references = [];
            for(var referenceIdx = 0 ; referenceIdx < references.length ; referenceIdx++){
                var reference = references[referenceIdx];
                // console.log('... ref ' + referenceIdx);
                var refAttributes = reference.attributes;
                var referenceObj = {};

                // Reference content and type
                // --------------------------
                for(var refPiece =0 ; refPiece < reference.childNodes.length ; refPiece++){
                    if(reference.childNodes[refPiece].localName === 'element-citation'){
                        // Reference content
                        referenceObj = Meteor.fullText.convertReference(reference.childNodes[refPiece])
                        // Reference type
                        var citationAttributes = reference.childNodes[refPiece].attributes;
                        for(var cAttr=0 ; cAttr<citationAttributes.length ; cAttr++){
                            if(citationAttributes[cAttr].localName == 'publication-type'){
                                referenceObj.type = citationAttributes[cAttr].nodeValue;
                            }
                        }
                    }
                }
                // Reference number
                // ------------------
                for(var refAttr = 0 ; refAttr < refAttributes.length ; refAttr++){
                    if(refAttributes[refAttr].localName === 'id'){
                        referenceObj.number = refAttributes[refAttr].nodeValue.replace('R','');
                    }
                }

                articleObject.references.push(referenceObj);
            }
        }

        if(articleObject){
            fut.return(articleObject);
        }
        return fut.wait();
    },
});

// for handling sections of XML, content, special elements like figures, references, tables
Meteor.fullText = {
    sectionToJson: function(section,files, mongoId){
        // XML processing of part of the content, <sec>
        // console.log('...sectionToJson');
        // console.log(section);
        var sectionObject = {};
        sectionObject.content = [];
        for(var c = 0 ; c < section.childNodes.length ; c++){
            // console.log('c = '  + c);
            var sec = section.childNodes[c];
            if(sec.localName != null){
                if(sec.localName === 'label'){
                    sectionObject.label = Meteor.fullText.convertContent(sec);
                }else if(sec.localName === 'title'){
                    sectionObject.title = Meteor.fullText.convertContent(sec);
                }else{
                    var subSectionObject = Meteor.fullText.sectionPartsToJson(sec);
                    // Add the content object to the section object
                    if(subSectionObject){
                        sectionObject.content.push(subSectionObject);
                    }
                }
            }
        }
        return sectionObject;
    },
    sectionPartsToJson: function(sec){
        // console.log('...sectionPartsToJson',sec.localName);
        var subSectionObject = {};
        var content,
            contentType;

        // Different processing for different node types
        if(sec.localName === 'table-wrap'){
            // get attributes
            var tableId;
            var tblAttr = sec.attributes;
            contentType = 'table';
            for(var tblA = 0 ; tblA < tblAttr.length ; tblA++){
                // console.log(tblAttr[tblA].localName + ' = ' + tblAttr[tblA].nodeValue );
                if(tblAttr[tblA].localName === 'id'){
                    tableId = tblAttr[tblA].nodeValue;
                }
            }
            content = '<table class="bordered" id="' + tableId + '">';
            content += Meteor.fullText.traverseTable(sec);
            content += '</table>';
        }else if(sec.localName === 'fig'){
            content = Meteor.fullText.convertFigure(sec,files,mongoId);
            contentType = 'figure';
        }else if(sec.localName === 'supplementary-material'){
            content = Meteor.fullText.convertSupplement(sec,files,mongoId);
            contentType = 'supplement';
        }else{
            content = Meteor.fullText.convertContent(sec);
            contentType = 'p';
        }

        if(content){
            content = Meteor.fullText.fixTags(content);
            subSectionObject.content = content;
            subSectionObject.contentType = contentType;
        }

        return subSectionObject;
    },
    headerLevelFromId: function(sectionId){
        // section ids are in the format, s1, s1_1, s1_1_1
        var sectionIdPieces = sectionId.split('_');
        return sectionIdPieces.length;
    },
    convertContent: function(node){
        // console.log('convertContent');
        // need to include figures so that we can fill in src within the content
        var content = '';
        // console.log(node.localName);
        if(node.localName != 'sec' && node.childNodes){
            // Section: Content
            // skip <sec> children because these will be processed separately. an xpath query was used to get all <sec> and then we loop through them

            // Style tags
            // --------
            for(var cc = 0 ; cc < node.childNodes.length ; cc++){
                var childNode = node.childNodes[cc];
                if(childNode){
                    var nodeAnchor = '',
                        nValue = '';
                    // console.log('cc = ' + cc );
                    if(childNode.localName != null && childNode.localName != 'xref' ){
                        content += '<' + childNode.localName + '>';
                    }

                    // Special tags - xref
                    // --------
                    if(childNode.localName === 'xref'){
                        content += Meteor.fullText.linkXref(childNode);
                    }else if(childNode.nodeType == 3 && childNode.nodeValue.replace(/^\s+|\s+$/g, '').length != 0){
                        // console.log('else if 1');
                        //plain text or external link
                        if(childNode.nodeValue && childNode.nodeValue.indexOf('http') != -1 || childNode.nodeValue.indexOf('https') != -1 ){
                            content += '<a href="'+ childNode.nodeValue +'" target="_BLANK">' + childNode.nodeValue + '</a>';
                        }else if(childNode.nodeValue){
                            content += childNode.nodeValue;
                        }
                    }else if(childNode.childNodes){
                        content += Meteor.fullText.convertContent(childNode);
                    }

                    if(childNode.localName != null && childNode.localName != 'xref' ){
                        content += '</' + childNode.localName + '>';
                    }
                }
            }
        }
        content = Meteor.fullText.fixTags(content);
        return content;
    },
    linkXref: function(xrefNode){
        // console.log('linkXref',xrefNode);
        // Determine - Reference or Figure or table-fn?
        var content = '';
        if(xrefNode.childNodes[0]){
            nValue = xrefNode.childNodes[0].nodeValue;
            if(nValue == null){
                // there is styling withing the xref, for ex <sup>a</sup>
                nValue = Meteor.fullText.convertContent(xrefNode);
            }
            var attributes = xrefNode.attributes;
            // tagName should be replace with figure or reference id. nodeValue would return F1C, but rid will return F1.
            for(var attr = 0 ; attr < attributes.length ; attr++){
                // console.log('      ' +attributes[attr].nodeName + ' = ' + attributes[attr].nodeValue);
                if(attributes[attr].nodeName === 'rid'){
                    nodeAnchor = attributes[attr].nodeValue;
                }
            }
            content += '<a href="#' + nodeAnchor + '"  class="anchor">';
            content += nValue;
            content += '</a>';
        }
        return content;
    },
    convertFigure: function(node,files,mongoId){
        // console.log('..convertFigure',figures);
        var figureAssetsUrl = journalConfig.findOne().assets;
        var figObj;

        // get the figure id, label, title, caption
        //------------------
        Meteor.xmlPmc.figure(node,function(figInfo){
            if(figInfo){
                figObj = figInfo;
                // match to db file info
                for(var f = 0 ; f < files.figures.length ; f++){
                    if(files.figures[f].id.toLowerCase() === figObj.id.toLowerCase()){
                        figObj.url = figureAssetsUrl + 'paper_figures/' + files.figures[f].file;
                    }
                }
            }
        });

        return figObj;
    },
    convertSupplement: function(node,files,mongoId){
        // console.log('..convertFigure',figures);
        var suppAssetsUrl = journalConfig.findOne().assets;
        var suppObj;


        // get the figure id, label, title, caption
        //------------------
        Meteor.xmlPmc.supplemental(node,function(suppInfo){
            if(suppInfo){
                suppObj = suppInfo;
                // match to db file info
                if(files.supplemental) {
                    for(var f = 0 ; f < files.supplemental.length ; f++){
                        //                    if(files.supplemental[f].id.toLowerCase() === suppObj.id.toLowerCase()){
                        suppObj.url = suppAssetsUrl + 'supplemental_materials/' + files.supplemental[f].file;
                        //                    }
                    }
                }
            }
        });
        return suppObj;
    },
    convertReference: function(reference){
        // console.log('...............convertReference');
        var referenceObj = {};
        referenceObj.authors = '';
        var first_author = true;
        for(var r = 0 ; r < reference.childNodes.length ; r++){
            // console.log('r = ' + r);
            if(reference.childNodes[r].childNodes){
                var referencePart,
                    referencePartName;
                // Reference Title, Source, Pages, Year, Authors
                // -------
                if(reference.childNodes[r].localName){
                    referencePart = reference.childNodes[r];
                    referencePartName = reference.childNodes[r].localName.replace('-','_'); // cannot use dash in handlebars template variable
                    // console.log(referencePartName);
                    if(referencePartName == 'person_group'){
                        var attr = xpath.select('@person-group-type', referencePart);
                        if(attr.length && attr[0].value == 'editor') {
                            referenceObj.editors = Meteor.fullText.traverseAuthors(referencePart);
                        }
                        else {
                            referenceObj.authors = Meteor.fullText.traverseAuthors(referencePart);
                        }
                    }
                    else if(referencePartName == 'name'){
                        if(referencePart.childNodes){
                            var referencePartCount = referencePart.childNodes.length;
                            for(var part = 0 ; part < referencePartCount ; part++){
                                if(referencePart.childNodes[part].localName == 'surname') {
                                    if(first_author === false) {
                                        referenceObj.authors += ', ';
                                    }
                                    else {
                                        first_author = false;
                                    }

                                    referenceObj.authors += referencePart.childNodes[part].childNodes[0].nodeValue + ' ';
                                }
                                else if(referencePart.childNodes[part].localName == 'given-names'){
                                    referenceObj.authors += referencePart.childNodes[part].childNodes[0].nodeValue;
                                }
                            }
                        }
                    }
                    else if(referencePartName == 'pub_id'){
                        // make sure attribute has pmid
                        var pmid = false;
                        for(var attr=0 ; attr<referencePart.attributes.length ; attr++){
                            // console.log(attr);
                            if(referencePart.attributes[attr].nodeName == 'pub-id-type' && referencePart.attributes[attr].nodeValue == 'pmid'){
                                // console.log(referencePart.childNodes[0].nodeValue);
                                referenceObj.pmid =referencePart.childNodes[0].nodeValue;
                            }
                        }
                    }else if(referencePartName == 'article_title'){
                        if(referencePart.childNodes){
                            var referencePartCount = referencePart.childNodes.length;
                            for(var part = 0 ; part < referencePartCount ; part++){
                                if(referencePart.childNodes[part].nodeValue){
                                    referenceObj.title = referencePart.childNodes[part].nodeValue;
                                }
                            }
                        }
                    }else if(referencePartName == 'comment'){
                        if(referencePart.childNodes){
                            var comment = '';
                            var referencePartCount = referencePart.childNodes.length;
                            for(var part = 0 ; part < referencePartCount ; part++){
                                if(referencePart.childNodes[part].nodeValue){
                                    comment += referencePart.childNodes[part].nodeValue;
                                } else if(referencePart.childNodes[part].localName == 'ext-link') {
                                    var href = '';
                                    for(var attrIdx=0; attrIdx<referencePart.childNodes[part].attributes.length; attrIdx++) {
                                        var attr = referencePart.childNodes[part].attributes[attrIdx];
                                        if(attr.localName == 'href') {
                                            var href = attr.nodeValue;
                                        }
                                    }
                                    link_content = href || referencePart.childNodes[part].nodeValue;
                                    comment += '<a href="'+href+'" target="_BLANK">'+link_content+'</a>';

                                } else if(referencePart.childNodes[part].localName == 'uri') {
                                    if(referencePart.childNodes[part].childNodes[0] && referencePart.childNodes[part].childNodes[0].nodeValue){
                                        var link = referencePart.childNodes[part].childNodes[0].nodeValue;
                                        link = Meteor.clean.removeSpaces(link);
                                        comment += '<a href="'+link+'" target="_BLANK">'+link+'</a>';
                                    }
                                }
                            }
                            referenceObj.comment = comment;

                        }
                    }else if(referencePartName){
                        // source, year, pages, issue, volume, chapter_title
                        if(referencePart.childNodes){
                            var referencePartCount = referencePart.childNodes.length;
                            for(var part = 0 ; part < referencePartCount ; part++){
                                if(referencePart.childNodes[part].nodeValue){
                                    if (typeof referenceObj[referencePartName] === 'string' || referenceObj[referencePartName] instanceof String) {
                                        referenceObj[referencePartName] += ". " + referencePart.childNodes[part].nodeValue;
                                    } else {
                                        referenceObj[referencePartName] = referencePart.childNodes[part].nodeValue;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // console.log(referenceObj);
        return referenceObj;
    },
    traverseAuthors: function(node){
        // console.log('..traverseNode');
        // first creating an array, so that we can ignore empty nodes
        // then using a string,
        // because there is some logic that is too complicated for handlebars. For ex, when 2 authors there is no comma and instead 'and' is used.
        var authors = [];
        var etal = '';
        if(node.childNodes){
            for(var c = 0 ; c < node.childNodes.length ; c++){
                var n = node.childNodes[c];

                if(n.tagName == 'etal') {
                    etal = ',<em> et al</em>';
                }
                else if(n.nodeValue != ''){
                    var author = '';
                    // Get the author name
                    if(n.nodeType == 3){
                        author += n.nodeValue;
                    }else{
                        author += Meteor.fullText.traverseNode(n);
                    }

                    // trim author name
                    author = author.replace(/^\s+|\s+$/g, '');
                    if(author.length != 0){
                        // if not empty node
                        authors.push(author);
                    }
                }
            }
        }

        // now join array
        if(authors.length > 2){
            authors = authors.join(', ');
        }else if(authors.length == 2){
            authors = authors.join(' and ');
        }else if(authors.length > 1){
            authors = authors.join('');
        }

        authors += etal;

        return authors;
    },
    traverseTable: function(node,footerFlag){
        // console.log('-----------------------traverseTable');
        // TODO: make this more general for traversing all nodes, not just table
        // TODO combine label and title
        // TODO: remove footerFlag. Used to add label to table footers.
        var nodeString = '',
            tableHeading = '',
            tableLabel = '',
            tableCaption = '',
            tableTitle = '';
        for(var c = 0 ; c < node.childNodes.length ; c++){
            var n = node.childNodes[c];
            // console.log(n.nodeName, n.nodeValue);
            // Start table el tag
            var elType = n.localName;
            if(elType != null){
                elType = Meteor.fullText.fixTableTags(elType);
            }
            if(elType != null && elType != 'title' && elType != 'label' && elType != 'caption' && elType != 'table' && elType != 'table-wrap-foot' && elType != 'xref'){// table tag added in sectionToJson()
                var colspan;
                var rowspan;
                var elId;
                if(n.attributes){
                    for(var attr in n.attributes){
                        if(n.attributes[attr].name === 'colspan'){
                            colspan = n.attributes[attr].nodeValue;
                        }else if(n.attributes[attr].name === 'rowspan'){
                            rowspan = n.attributes[attr].nodeValue;
                        }else if(n.attributes[attr].name === 'id'){
                            elId = n.attributes[attr].nodeValue;
                        }
                    };
                }

                // create the start tag
                // console.log(elType);
                if(elType === 'fn'){
                    elType = 'td';
                    if(!colspan){
                        colspan = "100";
                    }
                }
                nodeString += '<' + elType;
                if(colspan){
                    nodeString += ' colspan="' + colspan + '"';
                }
                if(rowspan){
                    nodeString += ' rowspan="' + rowspan + '"';
                }
                if(elId){
                    nodeString += ' id="' + elId + '"';;
                }
                nodeString += '>';
                if(footerFlag && tableLabel){
                    nodeString += tableLabel + ' '; //temporary. Would like to not handle table footer labels this way.
                }
            }
            // do not combine with elseif, because we need to still close tag via code below
            if(elType == 'label'){
                // Table Title - part one, or footer
                tableLabel = Meteor.fullText.traverseTable(n);
            }else if(elType == 'caption'){
                // Table Title - part three
                // do not use traversing functions. problem keeping title separate
                for(var cc = 0 ; cc < n.childNodes.length ; cc++){
                    if(n.childNodes[cc].localName == 'title'){
                        tableTitle = Meteor.fullText.convertContent(n.childNodes[cc]);
                    }else if(n.childNodes[cc].localName == 'p'){
                        tableCaption += Meteor.fullText.convertContent(n.childNodes[cc]);
                    }
                }
                if(tableLabel.indexOf('.') == -1){
                    tableLabel = tableLabel + '.';
                }
                tableHeading = '<h4>' + tableLabel + ' ' + tableTitle + '</h4><p>' + tableCaption + '</p>';
                nodeString += '<caption>' + tableHeading + '</caption>';
            }else if(elType == 'table-wrap-foot'){
                // console.log('..footer');
                nodeString += Meteor.fullText.traverseTableFooter(n);
            }else if(elType == 'xref'){
                nodeString += Meteor.fullText.linkXref(n);
            }else{
                // Table content
                if(n.nodeType == 3 && n.nodeValue.replace(/^\s+|\s+$/g, '').length != 0){
                    // text node, and make sure it is not just whitespace
                    var val = n.nodeValue;
                    nodeString += val;
                }else if(n.childNodes){
                    nodeString += Meteor.fullText.traverseTable(n);
                }

                // Close table el tag
                if(elType != null && elType != 'title' && elType != 'label' && elType != 'caption' && elType != 'table' && elType != 'table-wrap-foot'){
                    nodeString += '</' + elType + '>'
                }
            }
        }
        return nodeString;
    },
    traverseTableFooter: function(n){
        var string = '';
        string += '<tfoot>';

        for(var c=0; c < n.childNodes.length ; c++){
            if(n.childNodes[c].nodeName == 'fn'){
                var elId;
                if(n.childNodes[c].attributes){
                    for(var attr in n.childNodes[c].attributes){
                        if(n.childNodes[c].attributes[attr].name === 'id'){
                            elId = n.childNodes[c].attributes[attr].nodeValue;
                        }
                    };
                }
                string += '<tr><td colspan="100"';
                if(elId){
                    string += ' id="'+elId+'"';
                }
                string += '>';
                string += Meteor.fullText.traverseTable(n.childNodes[c],true);
                string += '</td></tr>';
            }else if(n.childNodes[c].nodeName == 'p'){
                string += '<tr><td colspan="100">';
                string += Meteor.fullText.convertContent(n.childNodes[c]);
                string += '</td></tr>';
            }
        }
        string += '</tfoot>';
        return string;
    },
    traverseNode: function(node){
        var string = '';
        if(node.childNodes){
            for(var c = 0 ; c < node.childNodes.length ; c++){
                // console.log('..'+c);

                var n = node.childNodes[c];
                if(n.nodeType == 3 && n.nodeValue.replace(/^\s+|\s+$/g, '').length != 0){
                    // console.log(n.nodeValue);
                    string += n.nodeValue + ' ';
                }else{
                    string += Meteor.fullText.traverseNode(n);
                }
            }
        }

        return string;
    },
    fixTags: function(content){
        // console.log('...fixTags',content);
        // Either object or string.
        // Figures are the only one with content array containing objects instead of strings
        // using this function also in XML processing of keywords
        if(typeof content == 'string'){
            // style tags
            content = content.replace(/<italic>/g,'<i>');
            content = content.replace(/<\/italic>/g,'</i>');
            content = content.replace(/<bold>/g,'<b>');
            content = content.replace(/<\/bold>/g,'</b>');
            content = content.replace(/<underline>/g,'<u>');
            content = content.replace(/<\/underline>/g,'</u>');

            // remove deprecated
            content = content.replace(/<fn>/g,'');
            content = content.replace(/<\/fn>/g,'');
        }else{
            // figures
            if(content.label){
                var label = Meteor.fullText.fixTags(content.label);
                content.label = label;
            }
            if(content.title){
                var title = Meteor.fullText.fixTags(content.title);
                content.title = title;
            }
            if(content.caption){
                var cap = Meteor.fullText.fixTags(content.caption);
                content.caption = cap;
            }
        }

        return content;
    },
    fixTableTags: function(content){
        // console.log('...fixTableTags',content);
        // separate from fixTags because we will be passing the node name, not with <>, because we don't want to globally replace 'bold' in table or 'italic',
        // just in case they are actually within the text
        if(typeof content == 'string'){
            // style tags
            content = content.replace(/italic/g,'i');
            content = content.replace(/\/italic/g,'/i');
            content = content.replace(/bold/g,'b');
            content = content.replace(/\/bold/g,'/b');
            content = content.replace(/underline/g,'u');
            content = content.replace(/\/underline/g,'u');
        }
        return content;
    },
    removeParagraphTags: function(content){
        return content.replace(/<\/p>/g,'').replace(/<p>/g,'');
    }
}
