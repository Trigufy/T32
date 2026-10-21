/* global $ */
/* global document */
/* global window */

(function() {
  'use strict';
  document.addEventListener("touchstart", function() {}, false);
  $(function() {
    $('#wsnavtoggle').on('click', function() {
      $('.wsmenucontainer').toggleClass('wsoffcanvasopener');
      return false;
    });
    $('#overlapblackbg').on('click', function() {
      $('.wsmenucontainer').removeClass('wsoffcanvasopener');
      return false;
    });
    $('.wsmenu-list> li').has('.wsmenu-submenu').prepend('<span class="wsmenu-click"><i class="wsmenu-arrow fa fa-angle-down"></i></span>');
    $('.wsmenu-list > li').has('.wsshoptabing').prepend('<span class="wsmenu-click"><i class="wsmenu-arrow fa fa-angle-down"></i></span>');
    $('.wsmenu-list > li').has('.megamenu').prepend('<span class="wsmenu-click"><i class="wsmenu-arrow fa fa-angle-down"></i></span>');
    $('.wsmenu-click').on('click', function() {
      $(this).toggleClass('ws-activearrow').parent().siblings().children().removeClass('ws-activearrow');
      $(".wsmenu-submenu, .wsshoptabing, .megamenu").not($(this).siblings('.wsmenu-submenu, .wsshoptabing, .megamenu')).slideUp('slow');
      $(this).siblings('.wsmenu-submenu').slideToggle('slow');
      $(this).siblings('.wsshoptabing').slideToggle('slow');
      $(this).siblings('.megamenu').slideToggle('slow');
      return false;
    });
    $('.wstabitem > li').has('.wstitemright').prepend('<span class="wsmenu-click02"><i class="wsmenu-arrow fa fa-angle-down"></i></span>');
    $('.wstabitem02 > li').has('.wstbrandbottom').prepend('<span class="wsmenu-click02"><i class="wsmenu-arrow fa fa-angle-down"></i></span>');
    $('.wsmenu-click02').on('click', function() {
      $(this).siblings('.wstitemright').slideToggle('slow');
      $(this).siblings('.wstbrandbottom').slideToggle('slow');
      return false;
    });
  });

  $(window).ready(function() {
    $(".wsshoptabing.wtsdepartmentmenu > .wsshopwp > .wstabitem > li").on('mouseenter', function() {
      $(this).addClass("wsshoplink-active").siblings(this).removeClass("wsshoplink-active");
      return false;
    });
    $(".wsshoptabing.wtsbrandmenu > .wsshoptabingwp > .wstabitem02 > li").on('mouseenter', function() {
      $(this).addClass("wsshoplink-active").siblings(this).removeClass("wsshoplink-active");
      return false;
    });
  });
  setmenuheight();
  $(window).on("load resize", function() {
    var w_height = $(window).width();
    if (w_height <= 991) {
      $(".wsshopwp").css('height', '100%');
      $(".wstitemright").css('height', '100%');
    } else {
      setmenuheight();
    }
  });

  function setmenuheight() {
    var TabgetHeight = 1;
    $(".wstabitem > li").each(function() {
      var forHeight = $(this).find(".wstitemright").innerHeight();
      TabgetHeight = forHeight > TabgetHeight ? forHeight : TabgetHeight;
      $(this).find(".wstitemright").css('height', 'auto');
    });
    $(".wsshopwp").css('height', TabgetHeight + 0);
  }
  $(document).ready(function($) {
    function removeStyles() {
      if ($(window).width() >= 991) {
        $('.wsshoptabing, .wstitemright, .wstbrandbottom').css({
          'display': '',
        });
      }
    }
    removeStyles();
    $(window).resize(removeStyles);
  });
}());