// methods used to create full text HTML from XML
Meteor.methods({
    getFilesForFullText: function(mongoId){
        // console.log('... getFilesForFullText: ' + mongoId);
        var fut = new future();
        var articleJson,
            articleInfo,
            figures = [],
            xml;
        articleInfo = articles.findOne({'_id' : mongoId});
        if(articleInfo){
            articleInfo = Meteor.article.readyData(articleInfo);
            if(articleInfo.files.figures){
                figures = articleInfo.files.figures;
            }
            if(articleInfo.files.xml){
                Meteor.http.get(articleInfo.files.xml.url,function(getXmlError, xmlRes){
                    if(getXmlError){
                        console.error('getXmlError',getXmlError);
                        fut['throw'](getXmlError);
                    }else if(xmlRes){
                        xml = xmlRes.content;
                        Meteor.call('fullTextToJson',xml, figures, mongoId, function(convertXmlError, convertedXml){
                            if(convertXmlError){
                                console.error('convertXmlError',convertXmlError);
                                fut['throw'](convertXmlError);
                            }else if(convertedXml){
                                fut['return'](convertedXml);
                            }
                        });
                    }
                });
            }

        }
        return fut.wait();
    },
    fullTextToJson: function(xml, figures, mongoId){
        // Full XML processing. Content, and References
        // console.log('... fullTextToJson');
        var fut = new future();
        var articleObject = {};
        var doc = new dom().parseFromString(xml);

        // Article Content
        // ---------------
        articleObject.sections = [];
        var sections = xpath.select('//sec', doc);
        if(sections[0]){
            // Sections
            for(var section = 0 ; section < sections.length ; section++){
                // console.log(sections[section].childNodes.length);
                var sectionType;
                var sectionObject = Meteor.fullText.sectionToJson(sections[section],figures, mongoId);
                for(var sectionAttr = 0 ; sectionAttr < sections[section].attributes.length ; sectionAttr++){
                    // console.log(sections[section].attributes[sectionAttr]);
                    if(sections[section].attributes[sectionAttr].nodeName === 'sec-type'){
                        sectionObject.type = sections[section].attributes[sectionAttr].nodeValue;
                    }else if(sections[section].attributes[sectionAttr].nodeName === 'id'){
                        var sectionId = sections[section].attributes[sectionAttr].nodeValue;

                        sectionObject.headerLevel = Meteor.fullText.headerLevelFromId(sectionId);
                        sectionObject.sectionId = sectionId;
                    }
                }
                articleObject.sections.push(sectionObject);
            }
        }else if(xpath.select('//body', doc)){
            var body =  xpath.select('//body', doc);
            // there will only be 1 body node, so use body[0]
            // no <sec>
            // just create 1 section
            var sectionObject = Meteor.fullText.sectionToJson(body[0],figures, mongoId);
            articleObject.sections.push(sectionObject);
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
            fut['return'](articleObject);
        }
        return fut.wait();
    },
});

// for handling sections of XML, content, special elements like figures, references, tables
Meteor.fullText = {
    sectionToJson: function(section,figures, mongoId){
        // XML processing of part of the content, <sec>
        // console.log('...sectionToJson');
        // console.log(section);
        var sectionObject = {};
        sectionObject.content = [];
        for(var c = 0 ; c < section.childNodes.length ; c++){
            // console.log('c = '  + c);
            var sec = section.childNodes[c];
            var content,
                contentType;
            if(sec.localName != null){
                // Different processing for different node types
                if(sec.localName === 'label'){
                    sectionObject.label = Meteor.fullText.convertContent(sec);
                }else if(sec.localName === 'title'){
                    sectionObject.title = Meteor.fullText.convertContent(sec);
                }else if(sec.localName === 'table-wrap'){
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
                    content = Meteor.fullText.convertFigure(sec,figures,mongoId);
                    contentType = 'figure';
                }else{
                    content = Meteor.fullText.convertContent(sec);
                    contentType = 'p';
                }

                // Add the content object to the section objectx
                if(content){
                    content = Meteor.fullText.fixTags(content);
                    sectionObject.content.push({contentType: contentType , content: content});
                }
            }
        }
        return sectionObject;
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
                    if(childNode.localName != null){
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

                    if(childNode.localName != null){
                        content += '</' + childNode.localName + '>';
                    }
                    // console.log(content);
                }
            }
        }
        content = Meteor.fullText.fixTags(content);
        return content;
    },
    linkXref: function(xrefNode){
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
    convertFigure: function(node,figures,mongoId){
        // console.log('..convertFigure',figures);
        var figureAssetsUrl = journalConfig.findOne().assets;
        var figObj = {};
        // get the figure ID
        for(var figAttr = 0 ; figAttr < node.attributes.length ; figAttr++){
            if(node.attributes[figAttr].localName === 'id'){
                figObj.id = node.attributes[figAttr].nodeValue;
                var figId = figObj.id.replace('F','');
                for(var f = 0 ; f < figures.length ; f++){
                    if(figures[f].id.replace('f','') === figId){
                        figObj.url = figureAssetsUrl + 'paper_figures/' + figures[f].file;
                    }
                }
            }
        }

        // get the figure label, title, caption
        //------------------
        if(node.childNodes){

            for(var figChild=0 ; figChild < node.childNodes.length ; figChild++){
                var nod = node.childNodes[figChild];
                // label
                    if(nod.localName == 'label'){
                        figObj.label =Meteor.fullText.traverseNode(nod).replace(/^\s+|\s+$/g, '');
                    }
                //------------------
                // title and caption
                //------------------
                if(nod.childNodes){
                    for(var c = 0 ; c < nod.childNodes.length ; c++){
                        var n = nod.childNodes[c];
                        // console.log(n.localName);
                        // figure title
                        // ------------
                        if(n.localName == 'title'){
                            figObj.title =  Meteor.fullText.traverseNode(n).replace(/^\s+|\s+$/g, '');
                        }
                        // figure caption
                        // ------------
                        if(n.localName == 'p'){
                            figObj.caption = Meteor.fullText.convertContent(n);
                        }
                    }
                }
            }
        }

        return figObj;
    },
    convertReference: function(reference){
        // console.log('...............convertReference');
        var referenceObj = {};
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
                        referenceObj.authors = Meteor.fullText.traverseAuthors(referencePart);
                    }else if(referencePartName == 'pub_id'){
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
                                    referenceObj['title'] = referencePart.childNodes[part].nodeValue;
                                }
                            }
                        }
                    }else if(referencePartName){
                        // source, year, pages, issue, volume, chapter_title
                        if(referencePart.childNodes){
                            var referencePartCount = referencePart.childNodes.length;
                            for(var part = 0 ; part < referencePartCount ; part++){
                                if(referencePart.childNodes[part].nodeValue){
                                    referenceObj[referencePartName] = referencePart.childNodes[part].nodeValue;
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
        if(node.childNodes){
            for(var c = 0 ; c < node.childNodes.length ; c++){
                var n = node.childNodes[c];
                if(n.nodeValue != ''){
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
    }
}