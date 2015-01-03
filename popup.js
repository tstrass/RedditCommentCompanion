(function(){

var topComments = [];
var currenPostID;
var isPopUpDisplay = false;
var currentPost;
var links;
var results;
var isDayTheme = true;
var isUsingRES = false
var currentPostTitle;
var subredditStyleLabel;
var shouldAnimate = false;
var currentLink;
var customWidth = 0;
var autoOpenRES = true;
var isSettingsVisible = false;
var shouldShowUpdateDiv = false;
var nightModeDiv;
var hoverOff = false;
var hoverOffTime;


  chrome.storage.local.get('popUpWidth', function(obj) {
    if (Object.getOwnPropertyNames(obj).length > 0) {
      customWidth = obj.popUpWidth;
    }
  });

   chrome.storage.local.get('clickSetting', function(obj) {
    if (Object.getOwnPropertyNames(obj).length > 0) {
      if (obj.clickSetting) {
        autoOpenRES = true;
      }else{
         autoOpenRES = false;
      } 
       checkForRes();
    }
  });

 chrome.storage.local.get('update2', function(obj) {
  if (Object.getOwnPropertyNames(obj).length <= 0) {
    shouldShowUpdateDiv = true;
  }
});

 chrome.storage.local.get('hoverOff', function(obj) {

  if (Object.getOwnPropertyNames(obj).length > 0) {
    if (obj.hoverOff) {
      hoverOff = true;
    }
  }
});

setUpHoverEvents();
setUpScroll();

function showUpdateDiv(){
  var upateDiv = $('<div id="rcc-update">'+
    '<p>You have just been upgraded to v.2.2!</p><br>'+
     '<p>'+
        '<p style="font-weight: bold">New Features</p>'+
        '<ul id="rcc-update-list">'+
          '<li>- Resize width of pop-up</li><br>'+
          '<li>- Auto open pop-up with click of RES image or video viewer (can turn off in <sup>*</sup>settings)</li><br>'+
          '<li>- Can now close out of pop-up with "X" next to current post\'s comments link</li><br>'+
          '<li>- Click anywhere outside of the po-pup to close</li><br>'+
        '</ul><br>'+
        '<p>Submit bugs and feature requests <a href="http://www.reddit.com/r/rccChromeExt/" style="color: blue">here</a> </p><br><br>'+
        '<p><sup>*</sup>The settings button can be found in the top right corner of each pop-up</p>'+
      '</p>'+

      '<a id="rcc-close-update" href="#" style="position:absolute; bottom:2px; left:2px; font-size: 15px; color: black;">X</a>'+
    '</div>' );

  upateDiv.css('width', $(window).width() / 3);
  upateDiv.css('height', '200px');

  currentLink.append(upateDiv);

  $('a#rcc-close-update').on('click', function(e){
    e.preventDefault();
    $('#rcc-update').remove();
  });

  shouldShowUpdateDiv = false;
  chrome.storage.local.set({'update2': true}, function() {});
}


function checkForRes(){
  if ($('#nightSwitchToggle').length) {
    isUsingRES = true;

    if (autoOpenRES && hoverOff === false) {
      setUpCollapsableEvents();
    }

    if ($('#nightSwitchToggle').hasClass('enabled')) {
      isDayTheme = false;
    }

    nightModeDiv = $($('#RESDropdownOptions').children()[3]);
    
    nightModeDiv.on('click', function(){
      isDayTheme = !isDayTheme;

      if (isDayTheme) {
        selectedDay();
      }else{
        selectedNight();
      }
    });
  }    
}

function setUpCollapsableEvents(){
  console.log(hoverOff);
  $('div#pop-up').css('visibility', 'visible');
  $('.close-button').css('visibility', 'visible');

  var expandoButtons = $('.expando-button').toArray();
  expandoButtons.forEach(function(e, i){
    $(e).unbind();
    $(e).on('click', function(){
      if (!$(e).hasClass('expanded')) {
          removePopUpFromView();
      }else{

        var commentsATag = $($(e).siblings('ul.flat-list.buttons').children('li.first').children('a'));
        var commentsURL = commentsATag.attr('href');

          if ($('#pop-up').length <= 0) {
            retrieveComments(commentsURL, commentsATag); 
          }else if($('#pop-up').length > 0){
            removePopUpFromView();
            retrieveComments(commentsURL, commentsATag); 
          }

          currentPost = commentsATag.parent().parent().parent().parent();
          currentPost = $(currentPost);
          currenPostID = currentPost.data('fullname');
          if (isDayTheme) {
            currentPost.css('background-color', 'rgb(247,247,248)'); 
          }else{
            currentPost.css('background-color', 'rgb(18, 18, 18)'); 
          }
      }
    });
  });
}

function removeCollapsableEvents(){
  var expandoButtons = $('.expando-button').toArray();
  expandoButtons.forEach(function(e, i){
    $(e).unbind();
  });
}

function setUpHoverEvents () {
  links = $('a.comments').toArray();

  links.forEach(function(l,i){
    $(l).unbind();
    var jL = $(l);
      $(jL).hoverIntent({ 

        over: function(e) {
          clearTimeout(hoverOffTime);

         if ($('#pop-up').length <= 0) {
            retrieveComments(l.href, jL); 
          }else if($('#pop-up').length > 0){
            removePopUpFromView();
            retrieveComments(l.href, jL); 
          }

          currentPost = jL.parent().parent().parent().parent();
          currentPost = $(currentPost);
          currenPostID = currentPost.data('fullname');

          // currentPost.mouseleave(function(){
          //   if (hoverOff) {
          //     timedHover();
          //   }
          // });

          if (isDayTheme) {
            currentPost.css('background-color', 'rgb(247,247,248)'); 
          }else{
            currentPost.css('background-color', 'rgb(18, 18, 18)'); 
          }
          
      }, 
      out: function(){
          if (hoverOff) {
           timedHover();
          }
      },
      interval: 150,
      sensitivity: 2
    });
  });
}

function timedHover(){
    hoverOffTime = setTimeout(function(){
    clearTimeout(hoverOffTime);
              if ($('#pop-up:hover').length != 0) {
                $('#pop-up').mouseleave(function(){
                  if (hoverOff) {
                    removePopUpFromView();
                  }
                });
              }else{
                 removePopUpFromView();
              }
            }, 1300);
}

function setUpPop (jL){
  if (nightModeDiv) {
    nightModeDiv.unbind();
  }

  $('div#pop-up').css('visibility', 'visible');
  $('.close-button').css('visibility', 'visible');

  checkForRes();
  setUpScroll();
  var popUp =  $('<div id="pop-up" class="trapScroll"></div>');
  popUp.css('position', '');
  popUp.css('top', '');
  popUp.css('right', '');

  jL.parent().append(popUp);

  currentLink = jL.parent();

  if (isDayTheme) {
    popUp.css('background-color', 'white');
    popUp.css('border', '1px solid black');
  }else{
    popUp.css('background-color', 'rgb(22, 22, 22)');
    popUp.css('border-color', '#e4e4e4');
  }


  var imageURL = chrome.extension.getURL("smallLoader.gif");
  var loadingIMG = $('<img id="loader" src="'+imageURL+'">')

   if ($('#loader').length <= 0) {
      popUp.append(loadingIMG);
   }
}

function retrieveComments (url, jL){
  subredditStyleLabel = $($('.hover.redditname')[1]).parent().children('div')[0];
  setUpPop(jL); 
   if (shouldShowUpdateDiv) {
          showUpdateDiv();
    }
  topComments = [];
  $.ajax({
        url: url +'.json',
        dataType: 'json',
        success: function(data) {

          $('#loader').remove();
          $('.idv-comment').remove();

          var popUp = $('#pop-up');
          
          popUp.css('position', 'fixed');

          popUp.css('max-height', $(window).height());
          if (customWidth) {
            popUp.css('width', customWidth);
          }else{
            popUp.css('width', $(window).width() / 3);           
          }
          popUp.css('top', '0px');
          popUp.css('right', '0px');

          popUp.resizable({
             helper: "ui-resizable-helper",
             handles: 'w',
             stop: function( event, ui ) {
              customWidth = popUp.width();
              chrome.storage.local.set({'popUpWidth': popUp.width()}, function() {
              });
             }
          });


          popUp.css('z-index', '21474836469999 !important');
          $(subredditStyleLabel).remove();

          // settings button
          var settingsURL = chrome.extension.getURL("settings.png");
          var settingsIMG = $('<div id="rcc-settings-container"><a href="#"><img id="rcc-settings-img" src="'+settingsURL+'"></a></div>');
          popUp.append(settingsIMG);
          setUpSettingsDropDown(settingsIMG);

          if ($('.exit-button').length <= 0) {
            var exitButton = $('<a class="exit-button" href="#"">X</a>');

            if (hoverOff == false || hoverOff == null) {
              var closeButton = $('<a class="close-button" href="#"">X</a>');
              popUp.append(exitButton);

              currentLink.append(closeButton);

              closeButton.click(function(e){
                removePopUpFromView();
                e.preventDefault();
              });
            }

            exitButton.click(function(e){
              removePopUpFromView();
              e.preventDefault();
            });
          }

          isPopUpDisplay = true;

          var postResponseID = data[0].data.children[0].data.name;

          var postPermalink = data[0].data.children[0].data.permalink;
          var author = data[0].data.children[0].data.author;

          results = data[1].data.children;

          for (var i = 0; i <= results.length; i++) {

            if(!results[i]){
              break;
            }

            var indivComment = results[i].data;

            if (topComments.length === 10 || postResponseID !== currenPostID) {
              break;
            }else{

              var firstReply 
              if (indivComment.replies && indivComment.replies.data.children[0].data.body) {
                firstReply = indivComment.replies.data.children[0].data;
                firstReply = {
                  author: firstReply.author,
                  html : firstReply.body,
                  gilded: firstReply.gilded,
                  votes: firstReply.ups,
                  isOP: false,
                  peermalink: postPermalink + firstReply.id
                }
              }else{
                firstReply = null;
              }

              var commentInfo = {
                author:  indivComment.author,
                html: indivComment.body,
                gilded: indivComment.gilded,
                votes: indivComment.ups,
                isOP: false,
                permalink: postPermalink + indivComment.id,
                firstReply: firstReply
              }

              if (author === indivComment.author) {
                commentInfo.isOP = true;
              }

              if (firstReply) {
                if (firstReply.author === author) {
                  firstReply.isOP = true;
                }
              }

              if (topComments.length <= 10 && containsObject(commentInfo, topComments) == false) {
                topComments.push(commentInfo);
              };
            }
          }
        formatComments(topComments);
      },
      error: function(request, status, error) {
          $('#loader').remove();
          var errorURL = chrome.extension.getURL("error.png");
          var errorIMG = $('<img id="error" src="'+errorURL+'">')
          var popUp = $('#pop-up');
          popUp.append(errorIMG);
          popUp.css('height', '50px');
          popUp.css('width', '50px');
      }
  });
   
}

function formatComments(commentsArray){

    commentsArray.forEach(function(c, i){
      if (typeof c.html != 'undefined') {
        var points;
        var parentComment = createComment(c, false);
        if (c.firstReply) {
          var childComment = createComment(c.firstReply, true);
          parentComment.append(childComment);
          parentComment.append($('<a class="permalink" href="'+c.permalink+'">View Thread</a>'));
        }

        $('#pop-up').append(parentComment);
      };

    });
    
    $('.comment-text').linkify();

    if (isDayTheme) {
      selectedDay();
    }else{
      selectedNight();
    }

     $('#siteTable').on('click', function(e){
        $('div#pop-up').css('visibility', 'hidden');
        $('.close-button').css('visibility', 'hidden');
        $('#siteTable').unbind();
      });

     $('div#pop-up').click(function(e){
       e.stopPropagation();
      });
     $('div.idv-comment').click(function(e){
       e.stopPropagation();
      });
}

function createComment(c, isChild){
  var converter = new Markdown.Converter();

  var commentDiv;

  if (isChild) {
    commentDiv = $('<div class="idv-comment child-comment"></div>');
  }else{
    commentDiv = $('<div class="idv-comment"></div>');
    var minus = $('<a href="#">[ - ]</a>');
    minus.on('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      minus.unbind();

      collapseComment(commentDiv);
    });
    commentDiv.append(minus);
  }
  var convertedMarkdown = converter.makeHtml(c.html);
  if (convertedMarkdown === null) {
    convertedMarkdown = c.html;
  }else{
    convertedMarkdown = convertedMarkdown.replace('&gt;', '|').replace('>;', '|');
    convertedMarkdown = convertedMarkdown.replace(/\^(\w+)/g, "<sup>$1</sup>");

    // if (convertedMarkdown.toLowerCase().indexOf("comments") <= 0){
    //   convertedMarkdown = convertedMarkdown.replace(/\/r\/(\w+)/g, "<a href='http://www.reddit.com/r/$1'>/r/$1</a>");
    // }

    // convertedMarkdown = convertedMarkdown.replace(/http(\w+)/g, "<a href='$1'>$1</a>");
  }

  var points;

  if (c.votes === 1) {
    points = "  point";
  }else{
    points = "  points";
  }

  if (c.isOP) {
    commentDiv.append($('<a class="author" id="op" href="/u/'+c.author+'">' + c.author +'</a><span class="votes">'+c.votes+points+'</span>'));
  }else{
    commentDiv.append($('<a id="author" href="/u/'+c.author+'">' + c.author +'</a><span class="votes">'+c.votes+points+'</span>'));
  }
  
  commentDiv.append($('<div class="comment-text">'+convertedMarkdown+'</div>')); 

  return commentDiv;
}

function collapseComment(comment){
  var minus = $(comment.children('a')[0]);

  var permalink = $(comment.children('.permalink'));
  permalink.css('visibility', 'hidden');

  minus.text('[ + ]');

  minus.on('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    minus.unbind();

    expandComment(comment);
  })

  var commentText = comment.children('div').toArray();
  commentText.forEach(function(t, i){
    t = $(t);

     t.css('visibility', 'hidden');
  });

  comment.css('height', '10px');
}

function expandComment(comment){
  var plus = $(comment.children('a')[0]);
  plus.unbind();

  var permalink = $(comment.children('.permalink'));
  permalink.css('visibility', 'visible');
     
  var commentText = comment.children('div').toArray();

  commentText.forEach(function(t, i){
    t = $(t);
     t.css('visibility', 'visible');
  });

  comment.css('height', 'auto');
  plus.text('[ - ]');

  plus.on('click',function(e){
    e.stopPropagation();
    e.preventDefault();
    plus.unbind();

    collapseComment(comment);
  });
}

function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}


function removePopUpFromView (){
  topComments = [];
  results = [];
 if(currentPost.mouseenter()){
    currentPost.mouseleave(animateClosing());
  }else{
    animateClosing();
  }
}

function animateClosing(){
  var popUp = $('#pop-up');
  popUp.remove();
  popUp.css('position', '');
  popUp.css('top', '');
  popUp.css('right', '');
  $('.close-button').remove();

  if (shouldShowUpdateDiv) {
    $('#rcc-update').remove();
  }
}

function setUpSettingsDropDown(settings){
  var settingsForm = $('<div id="rcc-radio-container">'+

    '<p id="rcc-settings-title">Auto-open with RES</p>'+
    '<form id="rcc-settings-form" action="">'+
    '<input id="rcc-on" type="radio" name="theme" value="on">On<br>'+
    '<input id= "rcc-off" type="radio" name="theme" value="off">Off'+
    '</form>'+

    '<p id="rcc-settings-title">Close with hover-off</p>'+
    '<form id="rcc-settings-form" action="">'+
    '<input id="rcc-hover-on" type="radio" name="theme" value="on">On<br>'+
    '<input id= "rcc-hover-off" type="radio" name="theme" value="off">Off'+
    '</form>'+

    '</div>');


  settingsForm.css('visibility', 'hidden');
  settings.append(settingsForm);

  var onRadio = $('#rcc-on');
  var offRadio = $('#rcc-off');

  var onHover = $('#rcc-hover-on');
  var offHover = $('#rcc-hover-off');

  if (autoOpenRES) {
    onRadio.attr('checked', 'checked');
  }else{
    offRadio.attr('checked', 'checked');
  }

  if (hoverOff) {
    onHover.attr('checked', 'checked');
  }else{
    offHover.attr('checked', 'checked');
  }

  onHover.on('click', function(){
    saveHoverSettings(true);
  });

  offHover.on('click', function(){
    saveHoverSettings(false);
  });

  onRadio.on('click', function(){
    saveClickSettings(true);
  });
  offRadio.on('click', function(){
    saveClickSettings(false);
  });

  var settingsButton = $('#rcc-settings-img');
  var radioContainer = $('#rcc-radio-container');

  settingsButton.hover(displaySettings, function(){
      $('#siteTable').unbind();

      if (radioContainer.mouseenter()) {
        radioContainer.mouseleave(function(){
          hideSettings();
        });
      }else{
        hideSettings();
      }
    });

  settingsButton.on('click', function(e){
    e.preventDefault();
    if (isSettingsVisible) {
      hideSettings();
    }else{
      displaySettings();
    }
  });
}

function hideSettings(){
  $('#rcc-radio-container').css('visibility', 'hidden');

  $('#siteTable').on('click', function(){
     $('div#pop-up').css('visibility', 'hidden');
      $('.close-button').css('visibility', 'hidden');
      removePopUpFromView();
  });

  isSettingsVisible = false;
}

function saveClickSettings(isOn){
  autoOpenRES = isOn;
  if (autoOpenRES && hoverOff === false) {
    setUpCollapsableEvents();
  }else{
    removeCollapsableEvents();
  }
  chrome.storage.local.set({'clickSetting': isOn}, function() {});
}

function saveHoverSettings(isOn){
  hoverOff = isOn;

  if (!hoverOff) {
    removeCollapsableEvents()
  }

  chrome.storage.local.set({'hoverOff': isOn}, function() {});
}

function selectedDay(){
  $('.child-comment').css('background-color', '');
  $('.idv-comment').css('border-color', '');
  $('#pop-up').css('border-color', '');
  $('div.comment-text > p').css('color', 'black');
  $('div.comment-text > p > a').css('color', '#551a8b !important');
}

function selectedNight(){
  $('.child-comment').css('background-color', 'rgb(18, 18, 18)');
  $('.idv-comment').css('border-color', 'rgb(51, 51, 51)');
  
  $('div.comment-text > p').css('color', 'rgb(204, 204, 204)');
  $('div.comment-text > p > a').css('color', 'rgb(51, 102, 153)');
}

function displaySettings (e){
  $('#siteTable').unbind();
  isSettingsVisible = true;
  $('#rcc-radio-container').css('visibility', 'visible');
}


checkDocumentHeight(setUpURLS);

function checkDocumentHeight(callback){
    var lastHeight = document.body.clientHeight, newHeight, timer;
    (function run(){
        newHeight = document.body.clientHeight;
        if( lastHeight != newHeight )
            callback();
        lastHeight = newHeight;
        timer = setTimeout(run, 200);
    })();
}

function setUpURLS(){
    setUpHoverEvents();
    if (isUsingRES && autoOpenRES && hoverOff === false) {
      setUpCollapsableEvents();
    }
}



//======================== stops scroll in comment div

function setUpScroll(){

  var trapScroll;

  (function($){  
    
    trapScroll = function(opt){
      
      var trapElement;
      var scrollableDist;
      var trapClassName = 'trapScroll-enabled';
      var trapSelector = '.trapScroll';
      
      var trapWheel = function(e){
        
        if (!$('body').hasClass(trapClassName)) {
          
          return;
          
        } else {
        var curScrollPos;  
          if (trapElement) {
            curScrollPos = trapElement.scrollTop();
          }
          var wheelEvent = e.originalEvent;
          var dY = wheelEvent.deltaY;

          // only trap events once we've scrolled to the end
          // or beginning
          if ((dY>0 && curScrollPos >= scrollableDist) ||
              (dY<0 && curScrollPos <= 0)) {

            opt.onScrollEnd();
            return false;
            
          }
          
        }
        
      }
      
      $(document)
        .on('wheel', trapWheel)
        .on('mouseleave', trapSelector, function(){
          
          $('body').removeClass(trapClassName);
        
        })
        .on('mouseenter', trapSelector, function(){   
        
          trapElement = $(this);
          var containerHeight = trapElement.outerHeight();
          var contentHeight = trapElement[0].scrollHeight; // height of scrollable content
          scrollableDist = contentHeight - containerHeight;
          
          if (contentHeight>containerHeight)
            $('body').addClass(trapClassName); 
        
        });       
    } 
    
  })($);

  var preventedCount = 0;
  var showEventPreventedMsg = function(){  
    $('#mousewheel-prevented').stop().animate({opacity: 1}, 'fast');
  }
  var hideEventPreventedMsg = function(){
    $('#mousewheel-prevented').stop().animate({opacity: 0}, 'fast');
  }
  var addPreventedCount = function(){
    $('#prevented-count').html('prevented <small>x</small>' + preventedCount++);
  }

  trapScroll({ onScrollEnd: addPreventedCount });
  $('.trapScroll')
    .on('mouseenter', showEventPreventedMsg)
    .on('mouseleave', hideEventPreventedMsg);      
  $('[id*="parent"]').scrollTop(100);

}


})();