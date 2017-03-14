var _ = require('../utility');

function checkIgnore(item, settings) {
  var level = item.level;
  var levelVal = _.LEVELS[level] || 0;
  var reportLevel = _.LEVELS[settings.reportLevel] || 0;

  if (levelVal < reportLevel) {
    return false;
  }

  var plugins = settings.plugins || {};
  if (plugins && plugins.jquery && plugins.jquery.ignoreAjaxErrors) {
    try {
      return !(item.data.body.message.extra.isAjax);
    } catch (e) {
      return true;
    }
  }
  return true;
}

function userCheckIgnore(item, settings) {
  try {
    if (_.isFunction(settings.checkIgnore) && settings.checkIgnore(item, settings)) {
      return false;
    }
  } catch (e) {
    settings.checkIgnore = null; // TODO
    _.consoleError('[Rollbar]: Error while calling custom checkIgnore(), removing', e);
  }
  return true;
}

function urlIsWhitelisted(item, settings) {
  var whitelist, trace, frame, filename, frameLength, url, listLength, urlRegex;
  var i, j;

  try {
    whitelist = settings.hostWhiteList;
    trace = item && item.data && item.data.body && item.data.body.trace;

    if (!whitelist || whitelist.length === 0) {
      return true;
    }
    if (!trace || !trace.frames) {
      return true;
    }

    listLength = whitelist.length;
    frameLength = trace.frames.length;
    for (i = 0; i < frameLength; i++) {
      frame = trace.frames[i];
      filename = frame.filename;

      if (!_.isType(filename, 'string')) {
        return true;
      }

      for (j = 0; j < listLength; j++) {
        url = whitelist[j];
        urlRegex = new RegExp(url);

        if (urlRegex.test(filename)){
          return true;
        }
      }
    }
  } catch (e)
  /* istanbul ignore next */
  {
    settings.hostWhiteList = null; // TODO
    _.consoleError("[Rollbar]: Error while reading your configuration's hostWhiteList option. Removing custom hostWhiteList.", e);
    return true;
  }
  return false;
}

function messageIsIgnored(item, settings) {
  var exceptionMessage, i, ignoredMessages, len, messageIsIgnored, rIgnoredMessage, trace, body, traceMessage, bodyMessage;
  try {
    messageIsIgnored = false;
    ignoredMessages = settings.ignoredMessages;
    
    if (!ignoredMessages || ignoredMessages.length === 0) {
      return true;
    }

    body =  item &&
            item.data &&
            item.data.body;

    traceMessage =  body && 
                    body.trace &&
                    body.trace.exception && 
                    body.trace.exception.message;
    
    bodyMessage = body && 
                  body.message && 
                  body.message.body;

    exceptionMessage = traceMessage || bodyMessage;

    if (!exceptionMessage){
      return true;
    }

    len = ignoredMessages.length;
    for (i = 0; i < len; i++) {
      rIgnoredMessage = new RegExp(ignoredMessages[i], 'gi');
      messageIsIgnored = rIgnoredMessage.test(exceptionMessage);

      if (messageIsIgnored) {
        break;
      }
    }
  } catch(e)
  /* istanbul ignore next */
  {
    settings.ignoredMessages = null; // TODO
    _.consoleError("[Rollbar]: Error while reading your configuration's ignoredMessages option. Removing custom ignoredMessages.");
  }

  return !messageIsIgnored;
}

module.exports = {
  checkIgnore: checkIgnore,
  userCheckIgnore: userCheckIgnore,
  urlIsWhitelisted: urlIsWhitelisted,
  messageIsIgnored: messageIsIgnored
};
