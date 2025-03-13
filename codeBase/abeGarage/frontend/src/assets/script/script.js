let mainNavUL = $(".main-menu").find(".navigation");
dynamicCurrentMenuClass(mainNavUL);

//Update Header Style and Scroll to Top
function headerStyle() {
  if ($(".main-header").length) {
    var windowpos = $(window).scrollTop();
    var siteHeader = $(".main-header");
    var scrollLink = $(".scroll-to-top");
    var sticky_header = $(".main-header .sticky-header");
    if (windowpos > 100) {
      siteHeader.addClass("fixed-header");
      sticky_header.addClass("animated slideInDown");
      scrollLink.fadeIn(300);
    } else {
      siteHeader.removeClass("fixed-header");
      sticky_header.removeClass("animated slideInDown");
      scrollLink.fadeOut(300);
    }
  }
}

headerStyle();

//Submenu Dropdown Toggle
if ($(".main-header li.dropdown ul").length) {
  $(".main-header .navigation li.dropdown").append(
    '<div class="dropdown-btn"><span class="fa fa-angle-right"></span></div>'
  );
}

//Hidden Sidebar
if ($(".hidden-sidebar").length) {
  var animButton = $(".sidemenu-nav-toggler"),
    hiddenBar = $(".hidden-sidebar"),
    navOverlay = $(".nav-overlay"),
    hiddenBarClose = $(".hidden-sidebar-close");

  function showMenu() {
    TweenMax.to(hiddenBar, 0.6, {
      force3D: false,
      right: "0",
      ease: Expo.easeInOut,
    });
    hiddenBar.removeClass("close-sidebar");
    navOverlay.fadeIn(500);
  }

  function hideMenu() {
    TweenMax.to(hiddenBar, 0.6, {
      force3D: false,
      right: "-480px",
      ease: Expo.easeInOut,
    });
    hiddenBar.addClass("close-sidebar");
    navOverlay.fadeOut(500);
  }
  animButton.on("click", function () {
    if (hiddenBar.hasClass("close-sidebar")) showMenu();
    else hideMenu();
  });
  navOverlay.on("click", function () {
    hideMenu();
  });
  hiddenBarClose.on("click", function () {
    hideMenu();
  });
}

if ($(".nav-overlay").length) {
  // / cursor /
  var cursor = $(".nav-overlay .cursor"),
    follower = $(".nav-overlay .cursor-follower");

  var posX = 0,
    posY = 0;

  var mouseX = 0,
    mouseY = 0;

  TweenMax.to({}, 0.016, {
    repeat: -1,
    onRepeat: function () {
      posX += (mouseX - posX) / 9;
      posY += (mouseY - posY) / 9;

      TweenMax.set(follower, {
        css: {
          left: posX - 22,
          top: posY - 22,
        },
      });

      TweenMax.set(cursor, {
        css: {
          left: mouseX,
          top: mouseY,
        },
      });
    },
  });

  $(document).on("mousemove", function (e) {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    mouseX = e.pageX;
    mouseY = e.pageY - scrollTop;
  });
  $("button, a").on("mouseenter", function () {
    cursor.addClass("active");
    follower.addClass("active");
  });
  $("button, a").on("mouseleave", function () {
    cursor.removeClass("active");
    follower.removeClass("active");
  });
  $(".nav-overlay").on("mouseenter", function () {
    cursor.addClass("close-cursor");
    follower.addClass("close-cursor");
  });
  $(".nav-overlay").on("mouseleave", function () {
    cursor.removeClass("close-cursor");
    follower.removeClass("close-cursor");
  });
}

//Mobile Nav Hide Show
if ($(".mobile-menu").length) {
  $(".mobile-menu .menu-box").mCustomScrollbar();

  var mobileMenuContent = $(".main-header .nav-outer .main-menu").html();
  $(".mobile-menu .menu-box .menu-outer").append(mobileMenuContent);
  $(".sticky-header .main-menu").append(mobileMenuContent);

  //Dropdown Button
  $(".mobile-menu li.dropdown .dropdown-btn").on("click", function () {
    $(this).toggleClass("open");
    $(this).prev("ul").slideToggle(500);
  });
  //Menu Toggle Btn
  $(".mobile-nav-toggler").on("click", function () {
    $("body").addClass("mobile-menu-visible");
  });

  //Menu Toggle Btn
  $(".mobile-menu .menu-backdrop,.mobile-menu .close-btn,.scroll-nav li a").on(
    "click",
    function () {
      $("body").removeClass("mobile-menu-visible");
    }
  );
}

//Sidemenu Nav Hide Show
if ($(".side-menu").length) {
  $(".side-menu .menu-box").mCustomScrollbar();

  //Dropdown Button
  $(".side-menu li.dropdown .dropdown-btn").on("click", function () {
    $(this).toggleClass("open");
    $(this).prev("ul").slideToggle(500);
  });

  $("body").addClass("side-menu-visible");
  //Menu Toggle Btn
  $(".side-nav-toggler").on("click", function () {
    $("body").addClass("side-menu-visible");
  });

  //Menu Toggle Btn
  $(".side-menu .side-menu-resize").on("click", function () {
    $("body").toggleClass("side-menu-visible");
  });

  //Menu Toggle Btn
  $(".main-header .mobile-nav-toggler-two").on("click", function () {
    $("body").addClass("side-menu-visible-s2");
  });

  //Menu Overlay
  $(".main-header .side-menu-overlay").on("click", function () {
    $("body").removeClass("side-menu-visible-s2");
  });
}
