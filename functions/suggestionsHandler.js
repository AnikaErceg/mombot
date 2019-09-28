'use strict';

const fs = require('fs');
const owners = require('../functions/getOwners');
const lists = require('../functions/lists');
const getUser = require('../functions/userAcrossShards');

module.exports = {
    suggestions: [],

    initializeSuggestions: () => {
        return new Promise((resolve, reject) => {
            try {
                module.exports.suggestions = require('../suggestions.json');
                resolve(module.exports.suggestions);
            }catch (err) {
                reject(err);
            }
        })
    },

    addSuggestion: (msg, args, client) => {
        if (args[0] === 'quote' || args[0] === 'cmd' || args[0] === 'feedback') {
            let type = args[0];
            args.shift();
            if (!owners.isOwner(msg.author.id)) {
                msg.channel.createMessage('Thanks for the suggestion! Please wait for the suggestion to be reviewed, you will be messaged if your suggestion is approved or denied!');
                module.exports.suggestions.push({person: msg.author.id, suggestion: args.join(' '), upVotes: [msg.author.id], downVotes: [], type: type});
                fs.writeFileSync('./suggestions.json', JSON.stringify(module.exports.suggestions));
            }else {
                msg.channel.createMessage('It\'s in the suggestions now!');
                if (type === 'quote') {
                    delete require.cache[require.resolve(`../lists.json`)];
                    var theLists = require('../lists.json');
                    theLists['things'].push(args.join(' '));
                    fs.writeFileSync('./lists.json', JSON.stringify(theLists));
                    lists.reloadLists();
                }else {
                    client.createMessage('599257779563397123', {
                        embed: {
                            title: `${type} Suggestion`,
                            fields: [
                                {
                                    name: 'Suggestion',
                                    value: args.join(' '),
                                    inline: false
                                },
                                {
                                    name: 'Suggested By',
                                    value: `${getUser(msg.author.id).username}#${getUser(msg.author.id).discriminator} (${msg.author.id})`
                                }
                            ]
                        }
                    });
                }
            }
        }else {
            msg.channel.createMessage('That suggestion type doesn\'t exist!');
        }
    },

    moderateSuggestion: (client, suggestionIndex, action, reason, msg) => {
        switch (action) {
            case 'approve':
                if (module.exports.suggestions[suggestionIndex].type === 'quote') {
                    delete require.cache[require.resolve(`../lists.json`)];
                    var theLists = require('../lists.json');
                    theLists['things'].push(module.exports.suggestions[suggestionIndex].suggestion);
                    fs.writeFileSync('./lists.json', JSON.stringify(theLists));
                    lists.reloadLists();
                }else {
                    client.createMessage('599257779563397123', {
                        embed: {
                            title: `${module.exports.suggestions[suggestionIndex].type} Suggestion`,
                            fields: [
                                {
                                    name: 'Suggestion',
                                    value: module.exports.suggestions[suggestionIndex].suggestion,
                                    inline: false
                                },
                                {
                                    name: 'Suggested By',
                                    value: `${getUser(module.exports.suggestions[suggestionIndex].person).username}#${getUser(module.exports.suggestions[suggestionIndex].person).discriminator} (${module.exports.suggestions[suggestionIndex].person})`
                                }
                            ]
                        }
                    });
                }
                module.exports.suggestions = module.exports.suggestions.filter((value, index, self) => index !== suggestionIndex);
                fs.writeFileSync('./suggestions.json', JSON.stringify(module.exports.suggestions));
            break;
            case 'deny':
                module.exports.suggestions = module.exports.suggestions.filter((value, index, self) => index !== suggestionIndex);
                fs.writeFileSync('./suggestions.json', JSON.stringify(module.exports.suggestions));
            break;
            case 'upvote':
                if (module.exports.suggestions[suggestionIndex].upVotes.includes(msg.author.id)) {
                    module.exports.suggestions[suggestionIndex].upVotes = module.exports.suggestions[suggestionIndex].upVotes.filter(e => e !== msg.author.id);
                    fs.writeFileSync('./suggestions.json', JSON.stringify(module.exports.suggestions));
                    return false;
                }else {
                    if (module.exports.suggestions[suggestionIndex].downVotes.includes(msg.author.id)) module.exports.suggestions[suggestionIndex].downVotes = module.exports.suggestions[suggestionIndex].downVotes.filter(e => e !== msg.author.id);
                    module.exports.suggestions[suggestionIndex].upVotes.push(msg.author.id);
                    fs.writeFileSync('./suggestions.json', JSON.stringify(module.exports.suggestions));
                    return true;
                }
            break;
            case 'downvote':
                if (module.exports.suggestions[suggestionIndex].downVotes.includes(msg.author.id)) {
                    module.exports.suggestions[suggestionIndex].downVotes = module.exports.suggestions[suggestionIndex].downVotes.filter(e => e !== msg.author.id);
                    fs.writeFileSync('./suggestions.json', JSON.stringify(module.exports.suggestions));
                    return false;
                }else {
                    if (module.exports.suggestions[suggestionIndex].person === msg.author.id) {
                        module.exports.suggestions = module.exports.suggestions.filter(e => e.person !== msg.author.id);
                        fs.writeFileSync('./suggestions.json', JSON.stringify(module.exports.suggestions));
                        return 'deleted';
                    }else {
                        if (module.exports.suggestions[suggestionIndex].upVotes.includes(msg.author.id)) module.exports.suggestions[suggestionIndex].upVotes = module.exports.suggestions[suggestionIndex].upVotes.filter(e => e !== msg.author.id);
                        module.exports.suggestions[suggestionIndex].downVotes.push(msg.author.id);
                        fs.writeFileSync('./suggestions.json', JSON.stringify(module.exports.suggestions));
                        return true;
                    }
                }
            break;
            default:
                throw new Error(`Invalid action code ${action}`);
            break;
        }
    }
}