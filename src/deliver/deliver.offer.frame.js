// 'use strict'

require('webpack-jquery-ui');
require('webpack-jquery-ui/css');
// require('jquery-ui-touch-punch');
require('bootstrap');

require('../../lib/jquery-comments-master/js/jquery-comments.js');
require('../../lib/bootstrap-rating/bootstrap-rating.min.js');

require('tablesorter/dist/js/jquery.tablesorter.js');
require('tablesorter/dist/js/jquery.tablesorter.widgets.js');
require('tablesorter/dist/js/widgets/widget-filter.min.js');
require('tablesorter/dist/js/widgets/widget-pager.min.js');
//
var urlencode = require('urlencode');

import comment_obj from '../../dist/assets/vendor/jquery-comments/params.json';

import { Utils } from '../utils/utils';

import { CategoriesOffer } from '../categories/categories.offer';

let utils = new Utils();
let _ = require('lodash');
let md5 = require('md5');
let moment = require('moment/moment');

$(window).on('load', () => {
  let iOSdevice =
    !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
  if (iOSdevice)
    $('[role="tablist"] .nav-link').each((i, e) => {
      if (!$(e).attr('href')) $(e).attr('href', $(e).data('target'));
    });
});

$(document).on('readystatechange', function () {
  if (document.readyState !== 'complete') {
    return;
  }

  window.InitDeliverOffer = function () {
    if (!window.order) {
      window.order = new DeliverOffer();
      window.order.InitTabsByCategories(function () {
        window.order.OpenOffer();
      });
    } else {
      $(window.frameElement).css('height', '100%');
    }
  };

  // if(window.parent.sets.css)
  //     $('#cus_link').attr('href', '../css/' + window.parent.sets.css+'.css?v='+String(Date.now()));

  let readURL = function (input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();

      reader.onload = function (e) {
        $('.avatar').attr('src', e.target.result);
        $('.avatar').siblings('input:file').attr('changed', true);
      };
      reader.readAsDataURL(input.files[0]);
    }
  };

  $('.file-upload').on('change', function (e) {
    let el = this;
    try {
      loadImage(
        e.target.files[0],
        function (img, data) {
          if (img.type === 'error') {
            console.error('Error loading image ');
          } else {
            let this_img = img.toDataURL();

            setTimeout(function () {
              $('.avatar').attr('src', this_img);

              $('.avatar').siblings('input:file').attr('changed', true);
              console.log('Original image width: ', data.originalWidth);
              console.log('Original image height: ', data.originalHeight);
            }, 200);
          }
        },
        {
          orientation: true,
          maxWidth: 600,
          maxHeight: 300,
          minWidth: 400,
          minHeight: 200,
          canvas: true,
        }
      );
    } catch (ex) {
      console.log(ex);
    }
  });

  (function ($) {
    $.fn.doubleTap = function (doubleTapCallback) {
      return this.each(function () {
        var elm = this;
        var lastTap = 0;
        $(elm).on('touchstart', function (e) {
          var now = new Date().valueOf();
          var diff = now - lastTap;
          lastTap = now;
          if (diff < 250) {
            if ($.isFunction(doubleTapCallback)) {
              doubleTapCallback.call(elm);
            }
          }
        });
      });
    };
  })(jQuery);
});

export class DeliverOffer {
  constructor() {
    const that = this;

    this.path = 'http://localhost:5500/d2d/server';
    if (host_port.includes('nedol.ru'))
      this.path = 'https://delivery-angels.store/server';
    else this.path = host_port;

    this.image_path = image_path;

    this.uid = window.parent.user.uid;
    this.profile = window.parent.user.profile.profile;
    this.offer = window.parent.user.offer.stobj.data;
    this.promo = window.parent.user.promo;
    this.prolong = window.parent.user.prolong;
    this.rating = window.parent.user.rating;

    this.date = moment().format('YYYY-MM-DD');
    $('.dt_val').val(this.date);
    $('.dt_val').on('change', () => {
      this.date = $(this).val();
      $('.date_val', window.parent.document).val(this.date);
    });

    this.body = $('body');

    $('#splash', $(window.parent.document).contents()).css('display', 'none');

    $(window.frameElement).css('height', '100%');

    // $('#lang_sel').draggable(
    //     { delay:200,containment:"body"},
    //     { start: function (ev) {
    //     },
    //         drag: function (ev) {
    //
    //         },
    //         stop: function (ev) {
    //
    //         }
    //     });
    // $('#lang_sel').draggable("enable");
    //$( ".ui-draggable" ).disableSelection();

    this.body.find('.show_map').off();
    this.body.find('.show_map').on('click touchstart', this, function (ev) {
      ev.preventDefault();
      ev.stopPropagation();

      that.saveFrame($('.nav-link.active').attr('href'));

      $('.nav-tabs')[0].scrollIntoView();

      $('.loader').css('display', 'none');
      // $('#supplier_frame',$(window.parent.document).contents()).css('display','none');
      $('#add_item').css('display', 'none');
      $('.show_map').parent().css('display', 'none');
      $(window.frameElement).css('height', '45px');
    });

    $('.nav-item').on('click', function () {
      // if(!$(this).find('.dt_val')[0])
      //     return;

      if ($('.category[state=1]')[0]) $('#add_item').css('display', '');
      $('.show_map').parent().css('display', '');
      $(window.frameElement).css('height', '100%');

      window.parent.user.PublishOffer(
        that.GetOfferItems(window.parent.sets.lang, true)['remote'],
        that.date,
        window.parent.user.offer.stobj,
        function (obj, data_obj) {
          try {
            window.parent.user.offer.stobj.published = obj.published;
            window.parent.user.offer.stobj.data = JSON.parse(obj.offer);
            let local = {
              data: JSON.parse(obj.offer),
              date: window.parent.user.offer.stobj.date,
              longitude: data_obj.location[0],
              latitude: data_obj.location[1],
              radius: data_obj.radius,
            };
            window.parent.user.offer.SetOfferDB(local);
          } catch (ex) {
            console.log();
          }
        }
      );
    });

    if ($(this).find('.nav-link[href="#editor_pane"]')[0]) {
      that.offer = window.parent.user.offer.stobj.data;
      that.OpenOffer();
    }

    $('.nav-tabs a').on('shown.bs.tab', function (ev) {
      var targ_href = $(ev.target).attr('href'); // active tab
      var rel_href = $(ev.relatedTarget).attr('href'); // previous tab

      $('.collapse:not(#collapse_lang, .item_body)').addClass('show');

      $(ev.target).attr('pane_hash', md5($(targ_href)[0].innerHTML));

      if (!$(ev.relatedTarget).attr('pane_hash')) return;

      if (
        $(ev.relatedTarget).attr('pane_hash') === md5($(rel_href)[0].innerHTML)
      )
        return;

      //that.saveFrame(rel_href);
    });

    window.OnClickCheck = function (el) {
      let ch = $(el).prop('checked');
      $('.tr_item[cusuid=' + $(el).attr('cusuid') + '] .approve').prop(
        'checked',
        ch
      );
      that.saveFrame('#orders_pane');
    };
  }

  saveFrame(rel_href) {
    const that = this;
    if (rel_href === '#orders_pane') {
      $.each($('.cus_foot :checked'), function (i, el) {
        window.parent.db.GetOrder(
          window.parent.user.date,
          window.parent.user.uid,
          $(el).attr('cusuid'),
          function (obj) {
            obj.number = $(el).closest('td').siblings('[number]').text();
            window.parent.user.ApproveOrder(obj);
          }
        );
      });
    } else if (rel_href === '#profile_pane') {
      that.SaveProfile(function (ev_prof) {
        if (!ev_prof) {
          alert(
            window.parent.sysdict.getValByKey(
              window.parent.sets.lang,
              '03870ff3038eb6709c2c0ab02bac5563'
            )
          );
        }
        $('.loader').css('display', 'none');
      });
    } else if (rel_href === '#editor_pane') {
      let items = that.GetOfferItems(window.parent.sets.lang);
      $('.loader').css('display', 'block');

      window.parent.user.offer.stobj.dict = window.parent.dict;

      //window.parent.user.offer.stobj.published = obj.published;
      window.parent.user.offer.stobj.data = items['remote'];
      let local = {
        data: window.parent.user.offer.stobj.data,
        date: window.parent.user.date,
        longitude: window.parent.user.offer.stobj.longitude,
        latitude: window.parent.user.offer.stobj.latitude,
        radius: window.parent.user.offer.stobj.radius,
      };

      window.parent.user.offer.SetOfferDB(local);

      window.parent.user.PublishOffer(
        items['remote'],
        window.parent.user.date,
        that,
        function (obj, data_obj) {
          $('.loader').css('display', 'none');
          if (!data_obj) {
            return false;
          }
          try {
          } catch (ex) {
            console.log(ex);
          }

          let ind = $('li.tab_inserted.active').val();
          let active = $($('li.active').find('img')[ind]).text();
        }
      );
    }
  }

  addTab(cat_tab, state) {
    const that = this;
    let cat_str = '';
    if (state === '0') return;
    if (
      $(window.parent.document)
        .contents()
        .find('#' + cat_tab)
        .closest('.cat_div')[0]
    )
      cat_str = $(window.parent.document)
        .contents()
        .find('#' + cat_tab)
        .closest('.cat_div')[0].outerHTML;
    else if (!cat_str)
      // let cat_str = cat_img?'<img class="nav-link" data-toggle="tab"  contenteditable="false" data-translate="' + md5(cat_tab) + '"  href="#tab_' + cat_tab + '" src="'+cat_img+'"  title="'+cat_tab+'">':
      cat_str =
        '<span class="cat_div  text-center" data-toggle="tab" href="#tab_' +
        cat_tab +
        '">' +
        '<span id="' +
        cat_tab +
        '" class="category icofont-brand-natgeo"  extra="true" title="' +
        cat_tab +
        '" state="0"></span>' +
        '<h5 class="title" contenteditable="true">' +
        cat_tab +
        '</h5>' +
        '<h6><span class="cat_cnt badge badge-pill badge-secondary">0</span></h6>' +
        '</div>';
    if ($('[href="#tab_' + cat_tab + '"]').length === 0) {
      //$('#menu_tabs').prepend(cat_str);
      $(cat_str).insertBefore(that.body.find('#add_tab_li'));
      $(
        '<div id="tab_' +
          cat_tab +
          '" class="div_tab_inserted tab-pane" ' +
          state +
          '>' +
          '<div class="filter_div collapse show"></div>' +
          '</div>'
      ).insertBefore($('#add_tab_div'));
      $('.icofont-filter').css('display', '');
    }
  }

  OpenOffer() {
    const that = this;

    if ($('.kolmit').length === 0) {
      let kolmit = $('iframe.kolmit_tmplt').clone();
      $(kolmit)
        .css('display', 'block')
        .attr('class', 'kolmit')
        .attr(
          'src',
          '../kolmit/operator/iframe.html?abonent=d2d@kolmit&operator=' +
            window.parent.user.email
        );
      //TODO: kolmit // $('#kolmit_pane').append(kolmit);
    }

    if (this.profile.name || this.profile.email)
      $('.name')
        .css('display', 'block')
        .text(
          this.profile.name
            ? this.profile.name
            : this.profile.email.split('@')[0]
        );

    // window.parent.db.GetSupApproved(this.uid, function (res) {
    //     that.appr = res;
    // });

    window.parent.dict.set_lang(window.parent.sets.lang, this.body[0]);

    this.dict = window.parent.dict;

    $('#lang_sel').val(window.parent.sets.lang);
    $('#lang_sel [role=langitem]').on('click', function () {
      window.parent.sets.lang = $(this).attr('value');
      //window.parent.sysdict.set_lang(window.parent.sets.lang,that.body[0]);
      that.dict.set_lang(window.parent.sets.lang, $('.menu_item'));
      $('#lang_sel button').html($(this).find('span')[0].outerHTML);
      $('#lang_sel button').trigger('click');
    });

    let cats = [];
    for (let tab in that.offer) {
      cats.push(
        $('.category[cat="' + tab + '"]', window.parent.document).attr('id')
      );
    }

    if (window.parent.user.profile.address)
      that.body.find('.address').val(window.parent.user.profile.address);

    if (window.parent.user.settings) {
      for (let par in window.parent.user.settings) {
        $('#settings')
          .find('select#' + par)
          .find('option[value=' + window.parent.user.settings[par] + ']')
          .attr('selected', true);
      }
    }

    $('img.avatar').after(
      '<h6>' +
        window.parent.sysdict.getValByKey(
          window.parent.sets.lang,
          '9f2021284ca26bc3dc2862add9ca84c6'
        ) +
        '</h6>'
    );
    $('img.avatar').on('click', function (ev) {
      $(this).siblings('.file-upload').trigger('click');
    });

    $('#add_tab_li').on('click', function (ev) {
      let text = 'Введите наименование категории';
      let hint = '';
      let cat_tab = prompt(text, hint);
      let img = null;

      window.order.addTab(cat_tab, 1);
    });

    // setTimeout(function () {

    that.InitOrderByOffer();
    $('#supplier_frame_container', window.parent.document).css(
      'height',
      '100%'
    );

    let isDown = false,
      isScroll = false;
    let startX;
    let scrollLeft;

    that.FillProfile(that.profile);

    that.InitSupplierReview(that);

    $('.table-responsive').on('mousedown', function (e) {
      isDown = true;
      this.classList.add('active');
      startX = e.pageX - this.offsetLeft;
      scrollLeft = this.scrollLeft;
    });
    $('.table-responsive').on('mouseleave', function () {
      isDown = false;
      this.classList.remove('active');
    });
    $('.table-responsive').on('mouseup', function () {
      setTimeout(function () {
        isScroll = false;
      }, 100);
      isDown = false;
      this.classList.remove('active');
      return false;
    });
    $('.table-responsive').on('mousemove', function (e) {
      if (!isDown) return;
      isScroll = true;
      e.preventDefault();
      const x = e.pageX - this.offsetLeft;
      const walk = x - startX;
      this.scrollLeft = scrollLeft - walk;
    });

    //
    // },500);
  }

  InitOrderByOffer() {
    $('.menu_item').off();
    $('.menu_item').remove();
    $('.tab_inserted').remove();

    const that = this;
    let isEditable = true;
    $('.empty_div').append($('#add_item'));

    for (let t in that.offer) {
      //
      // let img = $(".category#"+t,window.parent.document).attr('src');
      // if(that.offer[t].img)
      //     img = that.offer[t].img;
      // window.order.addTab(t,$(".category#"+t,window.parent.document).attr('state'));
      openTab(t);
    }

    setTimeout(function () {
      that.ord_items = ''; //that.GetOfferItem(that.lang);

      $('.collapse:not(#collapse_lang, .item_body)').addClass('show');
      //$('.item_title').trigger("click");
      $('[href="#editor_pane"]').attr(
        'pane_hash',
        md5($('#editor_pane')[0].innerHTML)
      );

      $('#' + $($('.menu_item')[0]).attr('cat')).trigger('click');

      // $('.category#'+$($('.menu_item')[0]).attr('cat')).siblings('.cat_cnt').text($('.category#'+$('.menu_item')).length);
      $('textarea, input:not(input:file), :checkbox, .form-control').on(
        'change',
        function (ev) {
          that.saveFrame(
            $('.nav-link.active').attr('href'),
            $(this).closest('.menu_item')
          );
        }
      );

      $('input:file').on('change', function (ev) {
        setTimeout(() => {
          that.saveFrame(
            $('.nav-link.active').attr('href'),
            $(this).closest('.menu_item')
          );
        }, 500);
      });
    }, 500);

    // $($('.cat_div')[0]).addClass('active');
    // $($($('.cat_div')[0]).attr('href')).addClass('active');

    function openTab(tab) {
      for (let i in that.offer[tab]) {
        $('#add_item').css('display', 'block');
        if (i === '0') openOffer(tab, i);
        else {
          setTimeout(
            function (i) {
              openOffer(tab, i);
            },
            0,
            i
          );
        }
      }

      $('[href="#tab_' + tab + '"]').on('show.bs.tab', function (ev) {
        if (ev.relatedTarget) {
          //let items = that.getTabItems($(ev.relatedTarget).text(), window.sets.lang);
          //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, 'published');
        }
      });

      $('[href="#tab_' + tab + '"]').on('hide.bs.tab', function (ev) {
        if (ev.target) {
          //let items = that.getTabItems($(ev.target).text(), window.sets.lang);
          //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, this.status);
        }
      });
    }

    function openOffer(tab, i) {
      let extra = $('.category#' + tab, window.parent.document).attr('extra');
      let menu_item = $('#menu_item_tmplt').clone();
      $(menu_item).attr('id', tab + '_' + i);
      $(menu_item).attr('cat', tab);
      $(menu_item).attr('class', 'menu_item');
      $(menu_item).css('display', 'block');

      $(menu_item)
        .find('.publish:checkbox')
        .attr('id', 'item_cb_' + i);
      $(menu_item).find('.publish:checkbox').attr('pos', i);
      $(menu_item).find('.publish:checkbox').attr('tab', tab);

      $(menu_item).find('.item_cb').css('visibility', 'visible');

      let val = parseInt(
        $('.cat_div[href="#tab_' + tab + '"]')
          .find('.cat_cnt')
          .text()
      );
      $('.cat_div[href="#tab_' + tab + '"]')
        .find('.cat_cnt')
        .text(val + 1);

      val = parseInt(
        $('.cat_div[href="#tab_' + tab + '"]')
          .closest('.dropup')
          .children('.cat_cnt ')
          .text()
      );
      $('.cat_div[href="#tab_' + tab + '"]')
        .closest('.dropup')
        .children('.cat_cnt ')
        .text(val + 1);

      if (that.offer[tab][i].checked == 'true') {
        $(menu_item).find('.publish:checkbox').prop('checked', true);
        if (that.published) isEditable = false;
      } else {
        isEditable = true;
      }

      if (that.offer[tab][i].title) {
        $(menu_item)
          .find('.item_title')
          .attr('data-translate', that.offer[tab][i].title);
      }

      if (that.profile.type === 'supplier') {
        if (that.offer[tab][i].dict_name) {
          that.dict.dict[that.offer[tab][i].title] =
            that.offer[tab][i].dict_name;
        }
      }

      $(menu_item)
        .find('.item_body_coll')
        .attr('data-target', '#content_' + tab + '_' + i);
      $(menu_item)
        .find('.item_body')
        .attr('id', 'content_' + tab + '_' + i);

      $(menu_item).find('.item_title').attr('contenteditable', isEditable);

      $(menu_item).find('.item_price').attr('contenteditable', isEditable);
      // $(menu_item).find('.item_price').val(that.offer[tab][i].packlist[0].price?that.offer[tab].price:that.offer[tab].price.price);

      if (that.offer[tab][i].brand) {
        $(menu_item).find('.brand').css('visibility', 'visible');
        let src = '';
        if (
          that.offer[tab][i].brand.logo.includes('http') ||
          that.offer[tab][i].brand.logo.includes('base64')
        )
          src = that.offer[tab][i].brand.logo;
        else {
          src = that.image_path + that.offer[tab][i].brand.logo;
        }

        src = src.replace('http://localhost:63342', '..');
        $(menu_item).find('.brand').attr('src', src);
      }

      that.fillPacklist(menu_item, tab, i);

      for (let c in that.offer[tab][i].cert) {
        let src = that.offer[tab][i].cert[c].src;

        if (!that.offer[tab][i].cert[c].src.includes('data:image'))
          src = that.image_path + that.offer[tab][i].cert[c].src;
        if ($(menu_item).find('img[src="' + src + '"]').length === 0) {
          $(menu_item)
            .find('.carousel-inner')
            .append(
              '<div class="carousel-item">' +
                // '<img  class="img-fluid mx-auto d-block" src=' + src + '>' +
                '<img  class="carousel-img img-fluid" src=' +
                src +
                ' style="display: block; max-height: 200px; margin-left: auto; margin-right: auto;">' +
                '</div>'
            );
        }

        $(menu_item)
          .find('.cert_container')
          .find('img')
          .longTap(function () {
            // let active = $(menu_item).find('.cert_container').find('.active');
            // active.removeClass('carousel-item');
            // $(menu_item).find('.cert_container').find('img').draggable(
            //     {delay: 0},
            //     {cursor: "crosshair"},
            //     {
            //         start: function (ev) {
            //         },
            //         drag: function (ev) {
            //             //$(el).attr('drag', true);
            //         },
            //         stop: function (ev) {
            //             // $(menu_item).find('.cert_container').find('img').draggable('destroy');
            //             //$(menu_item).find('.active').addClass('carousel-item');
            //             // $(menu_item).find('.cert_container').find('img').attr('drag_left', $(ev.target).css('left'));
            //             // $(menu_item).find('.cert_container').find('img').attr('drag_top', $(ev.target).css('top'));
            //         }
            //     });
          });
      }

      $(
        $(menu_item).find('.carousel-inner').find('.carousel-item')[0]
      ).addClass('active');
      //$(menu_item).find('.carousel').carousel({interval: 3000});
      $(menu_item)
        .find('.carousel')
        .attr('id', 'carousel_' + tab + '_' + i);
      $(menu_item)
        .find('.carousel')
        .append(
          '<a class="carousel-control-prev" href="#carousel_' +
            tab +
            '_' +
            i +
            '">' +
            '<span class="carousel-control-prev-icon"></span>' +
            '</a>' +
            '<a class="carousel-control-next" href="#carousel_' +
            tab +
            '_' +
            i +
            '">' +
            '<span class="carousel-control-next-icon"></span>' +
            '</a>'
        );

      // Enable Carousel Controls
      $(menu_item)
        .find('.carousel-control-prev')
        .click(function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          $('#carousel_' + tab + '_' + i).carousel('prev');
          menu_item.find('.carousel').carousel('pause');
        });

      $(menu_item)
        .find('.carousel-control-next')
        .click(function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          $('#carousel_' + tab + '_' + i).carousel('next');
          menu_item.find('.carousel').carousel('pause');
        });

      if (!$('#tab_' + tab).find('.pub_div')[0]) {
        $('#tab_' + tab)
          .find('.filter_div')
          .append(
            '<div class="pub_div form-check">' +
              '     <input type="checkbox" checked class="form-check-input"  value="published"' +
              '         style="transform: scale(1.5);-webkit-transform: scale(1.5);">' +
              '    <label class="form-check-label" data-translate="44ec8d4ee84b681847b88ee0c5b3b790">опубликовано</label>' +
              '</div>'
          );
        $('#tab_' + tab)
          .find('.filter_div')
          .append(
            '<div class="pub_div form-check">' +
              '     <input type="checkbox" checked class="form-check-input"  value="unpublished"' +
              '         style="transform: scale(1.5);-webkit-transform: scale(1.5);">' +
              '    <label class="form-check-label" data-translate="4ffcfc797d41cdb9e9b5a8ec2e936308">н/опубликовано</label>' +
              '</div>'
          );
      }

      if (that.offer[tab][i].prop) {
        $('#tab_' + tab)
          .find('.filter_div')
          .css('visibility', 'visible');

        $('<div>').load('../html/tmplt/prop.tmplt.html', function (el) {
          $('.filter_div').draggable();
          for (let p in that.offer[tab][i].prop) {
            if (
              !$('#tab_' + tab)
                .find('.filter_div')
                .find('#prop_' + p)[0]
            )
              $('#tab_' + tab)
                .find('.filter_div')
                .append(
                  '<div id="prop_' +
                    p.replace(/\s+/g, '') +
                    '" class="prop_name">' +
                    p +
                    '</div>'
                );

            for (let v in that.offer[tab][i].prop[p]) {
              if (
                $('#tab_' + tab)
                  .find('.filter_div')
                  .find(
                    'label:contains(' + that.offer[tab][i].prop[p][v] + ')'
                  )[0]
              )
                continue;
              let cpy = $(el).clone();
              cpy.find('.prop_check').val(that.offer[tab][i].prop[p][v]);
              cpy.find('label').text(that.offer[tab][i].prop[p][v]);

              $(cpy)
                .find(':checkbox')
                .on('change', function (ev) {
                  $('.menu_item').css('display', 'none');

                  $.each($('input.prop_check'), function (i, el) {
                    if ($(el).prop('checked')) {
                      $('.prop_val[value="' + $(el).val() + '"]')
                        .closest('.menu_item')
                        .css('display', 'block');
                    }
                  });
                });
              $('#tab_' + tab)
                .find('.filter_div')
                .find('#prop_' + p.replace(/\s+/g, ''))
                .append(cpy);
            }
          }
        });
      }

      if (that.offer[tab][i].content_text)
        if (
          that.offer[tab][i].content_text.value &&
          window.parent.dict.getValByKey(
            window.parent.sets.lang,
            that.offer[tab][i].content_text.value
          )
        ) {
          $(menu_item)
            .find('.item_title')
            .siblings('span')
            .css('display', 'block');
          // $(menu_item).find('.content_text').attr('contenteditable', 'false');
          $(menu_item)
            .find('.content_text')
            .attr('data-translate', that.offer[tab][i].content_text.value);
        }

      $(':checkbox').on('change', function (ev) {
        if ($(ev.target).prop('checked')) {
          if ($(ev.target).attr('value') === 'published') {
            $.each(
              $('.publish:checked').closest('.menu_item'),
              function (i, item) {
                $(item).css('display', 'block');
              }
            );
          } else if ($(ev.target).attr('value') === 'unpublished') {
            $.each(
              $('.publish:not(:checked)').closest('.menu_item'),
              function (i, item) {
                $(item).css('display', 'block');
              }
            );
          }
        } else {
          if ($(ev.target).attr('value') === 'published') {
            $.each(
              $('.publish:checked').closest('.menu_item'),
              function (i, item) {
                $(item).css('display', 'none');
              }
            );
          } else if ($(ev.target).attr('value') === 'unpublished') {
            $.each(
              $('.publish:not(:checked)').closest('.menu_item'),
              function (i, item) {
                $(item).css('display', 'none');
              }
            );
          }
        }
      });
      //menu_item.find('.prop.container').empty();
      for (let k in that.offer[tab][i].prop) {
        for (let v in that.offer[tab][i].prop[k]) {
          let row = menu_item.find('.row.prop_tmplt').clone();
          row.removeClass('prop_tmplt');
          row.addClass('prop');
          row.find('.add_prop_div').remove();
          row.find('.input').attr('contenteditable', true);
          row.find('.prop_key').val(k);
          row.find('.prop_val').val(that.offer[tab][i].prop[k][v]);
          row.find('.prop_val').attr('value', that.offer[tab][i].prop[k][v]);
          menu_item.find('.prop.container').prepend(row);
        }
      }

      if (that.offer[tab][i].bargain === 'true') {
        $(menu_item).find('.bargain:checkbox').prop('checked', 'true');
      }

      if (extra === 'true') {
        $(menu_item).find("[data-target='.extras']").css('display', 'block');
        $(menu_item)
          .find('.extras')
          .attr('id', 'extra' + tab + '_' + i);
        $(menu_item)
          .find("[data-target='.extras']")
          .attr('data-target', '#extra' + tab + '_' + i);
      }

      $.each(that.offer[tab][i].extra, function (e, el) {
        if (!el) return;
        let row = $($(menu_item).find('.add_title_div')[0])
          .closest('.add_row')
          .clone();
        row.addClass('extra');
        row.find('.extra_title').attr('data-translate', e);
        row.find('.extra_price').val(el.price);
        row.find('.input').attr('contenteditable', true);
        row.find('.add_extra_div').remove();
        $($(menu_item).find('.add_title_div')[0])
          .closest('.extras')
          .prepend(row);
      });

      menu_item.insertBefore($('#editor_pane .empty_div')); //добавить продукт в закладку

      that.lang = window.parent.sets.lang;
      window.parent.dict.set_lang(
        window.parent.sets.lang,
        $('#' + menu_item.attr('id'))
      );

      $(menu_item).find('input:file').on('change', menu_item, that.onLoadImage);

      $(menu_item)
        .find('.img-fluid')
        .attr('id', 'ap_' + tab + '_' + i);
      $(menu_item)
        .find('.fa-image')
        .on('click touchstart', menu_item, function (ev) {
          let menu_item = $(this).closest('.menu_item');
          //let vis = $(menu_item).find('.img-fluid').css('visibility');
          ev.target = $(menu_item).find('.img-fluid')[0];
          ev.mi = $(menu_item).attr('id');
          that.OnClickImport(ev);
        });

      if (that.offer[tab][i].brand) {
        $(menu_item).find('.brand_img').css('visibility', 'visible');
        let src = '';
        if (
          that.offer[tab][i].brand.logo.includes('http') ||
          that.offer[tab][i].brand.logo.includes('base64')
        )
          src = that.offer[tab][i].brand.logo;
        else {
          src = that.image_path + that.offer[tab][i].brand.logo;
        }

        src = src.replace('http://localhost:63342', '..');
        $(menu_item).find('.brand_img').attr('src', src);
      }

      $(menu_item)
        .find('.brand_img')
        .attr('id', 'brand_' + tab + '_' + i);
      $(menu_item)
        .find('.brand')
        .on('click touchstart', menu_item, function (ev) {
          let menu_item = $(this).closest('.menu_item');
          //let vis = $(menu_item).find('.img-fluid').css('visibility');
          ev.target = $(menu_item).find('.brand_img')[0];
          ev.mi = $(menu_item).attr('id');
          that.OnClickImport(ev);
        });

      $(menu_item)
        .find('.brand_img')
        .on('dragend', function () {
          $('.brand_img').remove();
        });

      $(menu_item)
        .find('.brand_img')
        .on('click touchstart', menu_item, function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
        });

      $(menu_item)
        .find('.brand_img')
        .doubleTap(function (ev) {
          $(this).remove();
        });

      $(menu_item)
        .find('.img_cert')
        .on('click touchstart', menu_item, function (ev) {
          let menu_item = $(this).closest('.menu_item');
          ev.target = $(menu_item).find('.cert_container')[0];
          ev.mi = $(menu_item).attr('id');
          that.OnClickAddCert(ev);
        });

      $(menu_item)
        .find('img')
        .doubleTap(function (ev) {
          if (
            confirm(
              {
                ru: 'Удалить изображение?',
                en: 'Remove image?',
                fr: "Supprimer l'image ?",
              }[that.lang]
            )
          ) {
            $(this).closest('.carousel-item').remove();
            menu_item.find('.carousel').carousel('next');
            $(
              $(menu_item).find('.carousel-inner').find('.carousel-item')[0]
            ).addClass('active');
            menu_item.find('.carousel').carousel('pause');
            that.saveFrame('#editor_pane', menu_item);
          }
        });

      $(menu_item).find('.toolbar').css('display', 'block');

      $(menu_item)
        .find('.orders')
        .attr('id', 'orders' + tab + '_' + i);
      $(menu_item).find('.order_ctrl').attr('data-toggle', 'collapse');
      $(menu_item)
        .find('.order_ctrl')
        .attr('data-target', '#orders' + tab + '_' + i);

      $(menu_item)
        .find('.tablesorter')
        .attr('id', 'ordtable_' + that.offer[tab][i].title);

      $(menu_item)
        .find('a[role=packitem]')
        .on(
          'click touchstart',
          {
            that: that,
            mi: $(menu_item),
          },
          that.OnClickPack
        );

      $('a[href="#' + tab + '"]').css('color', 'blue');

      $(menu_item).find('.item_title').collapse('hide');

      // $(menu_item).find('.cert_container').sortable({
      //     connectWith: "div",
      //     placeholder: "ui-state-highlight"
      // });
      $(menu_item).find('.add_extra').on('click', that.onAddExtra);
      $(menu_item).find('.add_prop').on('click', that.onAddProp);
      $(menu_item).find('.add_pack').on('click', that.onAddPack);
    }

    $('li.active a').on('show.bs.tab', function (ev) {
      if (ev.relatedTarget) {
        //let items = that.getTabItems($(ev.relatedTarget).text(), window.sets.lang);
        //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, 'published');
      }
      // $('.tab_inserted  img:first').tab('show');
      // $('.tab_inserted img:first').addClass('active');
    });

    if (this.date === moment().format('YYYY-MM-DD')) {
      $('.notoday').removeClass('notoday');
    }

    $('#add_item').off();
    $('#add_item').on('click touchstart', that, that.AddOfferItem);

    $('.input').click(function (ev) {
      $(this).focus();
    });

    $("a[href='#editor_pane']").off('click touchstart');
    $("a[href='#editor_pane']").on('click touchstart', this, function (ev) {});

    $('[data-toggle="popover"]').popover();

    try {
      window.parent.sysdict.set_lang(window.parent.sets.lang, this.body[0]);
    } catch (ex) {}
  }

  InitTabsByCategories(cb) {
    const that = this;
    let market = 'food';

    $('#menu_tabs').load(
      '../html/categories/' +
        market +
        '.html?v=' +
        String(Date.now()) +
        ' #cat_incl',
      () => {
        window.db = window.parent.db;
        that.categories = new CategoriesOffer();
        $('#cat_incl').css('bottom', 'auto');
        if (cb) cb();
      }
    );

    $('#promo').val(that.promo);

    $('li.active a').on('show.bs.tab', function (ev) {
      if (ev.relatedTarget) {
        //let items = that.getTabItems($(ev.relatedTarget).text(), window.sets.lang);
        //window.user.UpdateOfferLocal($(ev.relatedTarget).text(), items, this.location, window.dict.dict, 'published');
      }
      // $('.tab_inserted  img:first').tab('show');
      // $('.tab_inserted img:first').addClass('active');
    });

    //$('li.active a').tab('show');

    //$('.tab_inserted  img:first').trigger('click');

    if (this.date === moment().format('YYYY-MM-DD')) {
      $('.notoday').removeClass('notoday');
    }

    window.parent.db.GetSupOrders(
      moment(that.date).format('YYYY-MM-DD'),
      window.parent.user.uid,
      function (res) {
        $.each(res, function (i, item) {
          let data = res[i].data;
          let adr = res[i].address ? res[i].address : '';
          let inv_period = '',
            inv_qnty = '',
            tr_class = '',
            tr_disabled = '',
            tr_style = '';
          if (res[i].period !== that.offer.period) {
            inv_period = "style='color:red'";
          }
          let kAr = Object.keys(data);
          let calcDistance = new Promise(function (resolve, reject) {
            if (!that.location) resolve('undefined');
            window.parent.user.map.geo.GetDistanceToPlace(
              that.location,
              res[i].address,
              function (res) {
                resolve(res);
              }
            );
          });

          //calcDistance.then(function (dist) {
          function setOwner(k) {
            window.parent.db.GetOffer(new Date(that.date), function (off) {
              if (off.length >= 1) {
                let ar = off[0].data[res[i].data[k].cat];
                let r = _.find(ar, 'title', k);
                if (r)
                  $(".owner[title='" + k + "']").text(r.owner ? r.owner : '');
              }
            });
          }

          let total = 0,
            qnty = 0;

          for (let k in kAr) {
            let tr =
              "<tr class='cus_head' style='text-align: center;'  cusuid=" +
              res[i].cusuid +
              '>' +
              '<td></td>' +
              '<td>' +
              res[i].period +
              '</td>' +
              '<td></td>' +
              '<td></td>' +
              '<td></td>' +
              '<td></td>' +
              '<td></td>' +
              "<td style='text-align: center;'>" +
              adr +
              // kolmit[0].outerHTML+
              '</td>' +
              '<td></td>' +
              '</tr>';
            if (!$('tr.cus_head[cusuid="' + res[i].cusuid + '"]')[0])
              $(tr).appendTo($('tbody'));

            for (let o in data[kAr[k]].ordlist) {
              $('.item_title[data-translate=' + kAr[k] + ']')
                .closest('.menu_item')
                .find('.order_ctrl')
                .css('visibility', 'visible');

              if (res[i].status['deleted']) {
                //deleted
                inv_qnty = "title='deleted' style='color:red'";
                tr_style = 'color:red;text-decoration:line-through';
                tr_disabled = 'disabled';
              }

              let mi = $('.item_title[data-translate=' + kAr[k] + ']').closest(
                '.menu_item'
              );
              let price = mi.find('.item_price').val();
              if (data[kAr[k]].price !== price) {
                tr_class += ' inv_price';
              }
              let num = data[kAr[k]].num ? data[kAr[k]].num : 'na';

              let rsrv,
                remain = '&nbsp;';
              try {
                rsrv = that.offer[data[kAr[k]].cat][i].packlist[o]['rsrv']
                  ? that.offer[data[kAr[k]].cat][i].packlist[o]['rsrv']
                  : 0;
                remain =
                  parseInt(
                    that.offer[data[kAr[k]].cat][i].packlist[o]['qnty']
                  ) - rsrv;
                if (remain === 'NaN') remain = '';
              } catch (ex) {}

              let kolmit = $('iframe.kolmit_tmplt').clone();
              $(kolmit)
                .css('display', 'block')
                .css('margin', '0 auto')
                .attr('class', 'kolmit')
                .attr(
                  'src',
                  '../kolmit/kolmit.html?&role=user&uid=' +
                    md5(res[i].cusuid) +
                    '&abonent=' +
                    res[i].cusuid
                );
              total +=
                data[kAr[k]].ordlist[o].price * data[kAr[k]].ordlist[o].qnty;
              let cat = $(
                '.category#' + data[kAr[k]].cat,
                window.parent.document
              ).attr('cat');
              cat = window.parent.sysdict.getDictValue(that.lang, cat);

              let tr =
                "<tr class='tr_item' cusuid=" +
                res[i].cusuid +
                " style='text-align: center;" +
                tr_style +
                "' " +
                tr_disabled +
                '>' +
                '<td></td>' +
                '<td>' +
                // "<input  type='checkbox'  class='checkbox-inline approve' " +
                // "cusuid="+res[i].cusuid+" title="+kAr[k]+
                // "  style='transform: scale(1.5);-webkit-transform: scale(1.5);'>" +
                '</td>' +
                '<td>' +
                cat +
                '</td>' +
                "<td title style='word-break:break-all;'>" +
                window.parent.dict.getValByKey(that.lang, kAr[k]) +
                '</td>' +
                '<td>' +
                o +
                '</td>' +
                '<td qnty>' +
                data[kAr[k]].ordlist[o].qnty +
                '</td>' +
                '<td price>' +
                String(data[kAr[k]].ordlist[o].price) +
                '</td>' +
                "<td class='tablesorter-no-sort'>" +
                (res[i].comment
                  ? "<span class='tacomment'>" + res[i].comment + '</span>'
                  : '') +
                '</td>' +
                '<td></td>' +
                '</tr>';

              $(tr).insertAfter(
                $('tr.cus_head[cusuid="' + res[i].cusuid + '"]')
              );

              // $('.approve').on('click',function (ev) {
              //     //if(remain==='&nbsp;')
              //     //    return; TODO: remains
              //     let pl = JSON.parse(mi.find('.item_pack').attr('packlist'));
              //     pl[o]['rsrv'] = pl[o]['rsrv']? pl[o]['rsrv']:0;
              //
              //     if ($(this)[0].checked == true) {
              //         $(this).closest('td').find('a').text(remain - data[kAr[k]].ordlist[o].qnty);
              //         pl[o]['rsrv'] = pl[o]['rsrv'] - data[kAr[k]].ordlist[o].qnty;
              //     }else {
              //         $(this).closest('td').find('a').text(remain);
              //         pl[o]['rsrv'] = pl[o]['rsrv'] + data[kAr[k]].ordlist[o].qnty;
              //     }
              //     mi.find('.item_pack').attr('packlist', JSON.stringify(pl));
              //
              // });

              if (window.parent.user.profile.profile.type === 'marketer') {
                $('.marketer').css('display', 'none');
                $('.complete').attr('disabled', 'true');
              }
            }

            for (let e in data[kAr[k]].extralist) {
              let tr =
                "<tr class='tr_item'>" +
                '<td></td>' +
                '<td></td>' +
                '<td></td>' +
                '<td></td>' +
                "<td  style='text-align: center;'>" +
                e +
                '</td>' +
                "<td  style='text-align: center;'>" +
                data[kAr[k]].extralist[e].qnty +
                '</td>' +
                "<td  style='text-align: center;'>" +
                String(data[kAr[k]].extralist[e].price) +
                '</td>' +
                "<td colspan='6'></td>" +
                '</tr>';
              total +=
                data[kAr[k]].extralist[e].price *
                data[kAr[k]].extralist[e].qnty;
              $(tr).insertAfter($('.cus_head[cusuid="' + res[i].cusuid + '"]'));
            }
            if (res[0].delivery) {
              total += res[0].delivery.cost;
              tr =
                '<tr>' +
                "<td colspan='5'></td>" +
                "<td style='text-align: right;'>" +
                window.parent.sysdict.getDictValue(that.lang, 'доставка') +
                '</td>' +
                "<td style='text-align: center;'>" +
                String(res[0].delivery.cost) +
                '</td>' +
                "<td colspan='2'></td>" +
                '</tr>';
              $(tr).appendTo($('tbody'));
            }

            tr =
              "<tr class='cus_foot' style='text-align: center;'  cusuid=" +
              res[i].cusuid +
              '>' +
              '<td number>' +
              window.parent.user.uid.slice(0, 2) +
              res[i].cusuid.slice(0, 2) +
              '/' +
              new Date(that.date).getDate() +
              '</td>' +
              "<td style='text-align: center;'>" +
              "<input type='checkbox'  class='checkbox-inline approve' title='" +
              kAr[k] +
              "' cusuid=" +
              res[i].cusuid +
              " onclick='window.OnClickCheck(this)'" +
              " style='transform: scale(1.5);-webkit-transform: scale(1.5);'>" +
              '</td>' +
              '<td></td>' +
              '<td></td>' +
              '<td></td>' +
              '<td></td>' +
              '<td>' +
              total +
              '</td>' +
              "<td style='text-align: center;'>" +
              '</td>' +
              '<td></td>' +
              '</tr>';

            if (!$('tr.cus_foot[cusuid="' + res[i].cusuid + '"]')[0])
              $(tr).appendTo($('tbody'));
            else
              $('tr.cus_foot[cusuid="' + res[i].cusuid + '"]').replaceWith(tr);

            if (res[i].status['approved']) {
              $(
                '.cus_foot[cusuid=' +
                  res[i].cusuid +
                  "] .approve[title='" +
                  kAr[k] +
                  "']"
              ).prop('checked', true);
              $(
                '.cus_foot[cusuid=' +
                  res[i].cusuid +
                  "] .approve[title='" +
                  kAr[k] +
                  "']"
              ).attr('disabled', 'true');
            }
          }
        });

        $('.order_amnt').text($('.tr_item').length);

        that.orders = res;
      }
    );

    $('#add_item').off();
    $('#add_item').on('click touchstart', that, that.AddOfferItem);

    $('.input').click(function (ev) {
      $(this).focus();
    });

    $("a[href='#editor_pane']").off('click touchstart');
    $("a[href='#editor_pane']").on('click touchstart', this, function (ev) {});

    $('[data-toggle="popover"]').popover();
  }

  fillPacklist(menu_item, tab, i) {
    const that = this;
    let pl = '';
    if (that.offer[tab][i].packlist)
      pl = utils.ReverseObject(that.offer[tab][i].packlist);
    else return;

    for (let l in pl) {
      let row = $(menu_item).find('.pack_tmplt').clone();
      row.removeClass('pack_tmplt');
      row.find('.add_pack_div').remove();
      row.find('.bargain_div').remove();
      row.find('input').prop('contenteditable', true);
      row.find('.item_pack').attr('data-translate', l);
      row.find('.item_price').val(pl[l].price);
      row.find('.item_markup').val(pl[l].markup);
      row.find('.item_qnty').val(pl[l].qnty);

      $(menu_item).find('.pack').before(row);
    }
  }

  FillProfile(profile) {
    if (profile.avatar) {
      if (profile.avatar.includes('base64'))
        $('.avatar').attr('src', profile.avatar);
      else $('.avatar').attr('src', this.image_path + profile.avatar);
    } else $('.avatar').attr('src', '../dist/images/user.png');
    $('input').attr('title', '');
    $('#name').val(profile.name);
    $('#email').val(profile.email);
    $('#mobile').val(profile.mobile);
    $('#address').val(profile.address);
    $('#place').val(profile.place);
    $('#worktime').val(profile.worktime);
    $('#del_price_per_dist').val(profile.del_price_per_dist),
      $('#del_no_less_than').val(profile.del_no_less_than),
      $('#delivery').val(profile.delivery);
  }

  InitProfileSupplier(user, settings) {
    // this.profile_sup = new ProfileSupplier(user);
    this.InitComments(user, settings);
    this.InitRating();

    if (window.parent.user) {
      $('#map_link').css('display', 'block');
      $('#map_link').attr(
        'href',
        '../dist/customer.store.html?lang=' +
          window.parent.sets.lang +
          '&market=food&supuid=' +
          window.parent.user.uid
      );
    }
  }

  InitSupplierReview(sup) {
    let par = {
      readOnly:
        sup.appr && sup.appr.cusuid === window.parent.user.uid ? false : true,
      profilePictureURL: sup.profile.avatar
        ? this.path + sup.profile.avatar
        : 'https://delivery-angels.store/dist/images/user.png',
      enableEditing: true,
      enableDeleting: false,
      enableReplying: false,
    };
    Object.assign(par, comment_obj.supplier[window.parent.sets.lang]);
    this.InitProfileSupplier(
      { supuid: sup.uid, user: window.parent.user.constructor.name },
      par
    );
  }

  InitComments(obj, settings) {
    let this_obj = obj;
    // $('img.avatar').attr('src', settings.profilePictureURL);
    //settings.profilePictureURL = this.path+'/images/'+this.profile.avatar;

    $('#comments-container').comments(
      Object.assign(settings, {
        getComments: function (success, error) {
          let par = {
            proj: 'd2d',
            user: window.parent.user.constructor.name.toLowerCase(),
            func: 'getcomments',
            supuid: obj.supuid,
          };

          window.parent.network.SendMessage(par, function (data) {
            var commentsArray = [];
            if (data.resAr) {
              for (let i in data.resAr) {
                let com = JSON.parse(data.resAr[i].data);
                commentsArray.push(com);
              }
            }
            success(commentsArray);
          });
        },
        postComment: function (data, success, error) {
          if (window.parent.user.profile && window.parent.user.profile.name) {
            data['fullname'] = window.parent.user.profile.name;
          } else if (window.parent.user.email) {
            data['fullname'] = window.parent.user.email.split('@')[0];
          } else {
            data['fullname'] = 'Покупатель';
          }

          data['created_by_current_user'] = false;
          let par = {
            proj: 'd2d',
            user: window.parent.user.constructor.name.toLowerCase(),
            func: 'setcomments',
            supuid: this_obj.supuid,
            cusuid: window.parent.user.uid,
            data: data,
          };
          window.parent.network.SendMessage(par, function (res) {
            if (!res.err) {
              data['created_by_current_user'] = true;
              success(saveComment(data));
            }
          });
        },
        putComment: function (data, success, error) {
          data['created_by_current_user'] = false;
          let par = {
            proj: 'd2d',
            user: window.parent.user.constructor.name.toLowerCase(),
            func: 'setcomments',
            supuid: this_obj.supuid,
            cusuid: window.parent.user.uid,
            data: data,
          };
          window.parent.network.SendMessage(par, function (res) {
            data['created_by_current_user'] = true;
            success(saveComment(data));
          });
        },
        deleteComment: function (commentJSON, success, error) {},
      })
    );
    let usersArray;
    let saveComment = function (data) {
      // Convert pings to human readable format
      $(data.pings).each(function (index, id) {
        var user = usersArray.filter(function (user) {
          return user.id == id;
        })[0];
        data.content = data.content.replace('@' + id, '@' + user.fullname);
      });

      return data;
    };
  }

  InitRating() {
    let data_obj = {
      proj: 'd2d',
      user: window.parent.user.constructor.name.toLowerCase(),
      func: 'getrating',
      psw: window.parent.user.psw,
      supuid: window.parent.user.uid,
    };
    window.parent.network.SendMessage(data_obj, function (data) {
      if (data.resAr && data.resAr.rating)
        $('.rating').rating('rate', data.resAr.rating);
    });
  }

  OnClickPack(ev) {
    let menu_item = ev.data.mi;
    const that = ev.data.that;

    let pl = JSON.parse($(menu_item).find('.item_pack').attr('packlist'));
    let price = pl[$(ev.target).text()].price;
    let markup = pl[$(ev.target).text()].markup;
    let qnty = pl[$(ev.target).text()].qnty;
    $(menu_item).find('.item_pack').val($(ev.target).text());
    $(menu_item).find('.item_pack').attr('pack', $(ev.target).text());
    $(menu_item).find('.item_price').val(price);
    $(menu_item).find('.item_markup').val(markup);
    $(menu_item).find('.item_qnty').text(qnty);
  }

  AddOfferItem(ev) {
    const that = ev.data;

    // if($('.menu_item').length>=parseInt($('#items_limit').val())) {
    //    return true;
    // }

    let tab = $('.category[state=1]').attr('id');

    if (!tab) return;

    ev.preventDefault(); // avoid to execute the actual submit of the form.
    ev.stopPropagation();

    var pos = $('.menu_item[id^="' + tab + '"]').length;
    let tmplt;
    if (pos < 1) {
      tmplt = $('#menu_item_tmplt').clone();
    } else {
      tmplt = $($('.menu_item[id^="' + tab + '"]')[pos - 1]).clone();
    }

    let menu_item = tmplt; //$('#menu_item_tmplt').clone();
    menu_item.insertBefore($('#editor_pane .empty_div'));

    menu_item.attr('cat', tab);
    menu_item.attr('id', tab + '_' + pos);
    menu_item.attr('class', 'menu_item');
    menu_item.css('display', 'block');
    menu_item.attr('cat', tab);

    menu_item.find('.item_title').val('');
    menu_item.find('.item_title').attr('data-translate', '');

    menu_item.find('.carousel-img').remove();

    menu_item
      .find('.extra_ctrl')
      .attr('data-target', '#extra_' + tab + '_' + pos);
    menu_item.find('.extra_ctrl').css('display', '');
    // menu_item.find('.pack_container').replaceWith($(tmplt).find('.pack_container')[0]);
    // menu_item.find('.price_div').replaceWith($(tmplt).find('.price_div')[0]);
    menu_item.find('.publish:checkbox').prop('checked', false);
    menu_item.find('.publish:checkbox').attr('id', 'item_cb_' + pos);
    menu_item.find('.publish:checkbox').attr('pos', pos);
    menu_item.find('.publish:checkbox').attr('tab', tab);
    $('.btn').css('visibility', 'visible');

    menu_item.find('.content_text').attr('contenteditable', 'true');
    // menu_item.find('.item_title').attr('contenteditable', 'true');
    menu_item.find('.item_price').attr('contenteditable', 'true');

    //menu_item.find('.item_title').text($('#item_title').text());
    let hash = md5(new Date().getTime());
    //window.dict.dict[hash] = {};
    //menu_item.find('.item_title').attr('data-translate',hash);

    menu_item
      .find('.item_title')
      .attr('data-target', '#content_' + tab.replace('#', '') + pos);

    menu_item.find('.item_body').attr('id', 'content_' + tab + '_' + pos);

    menu_item
      .find('.item_body_coll')
      .attr('data-target', '#content_' + tab + '_' + pos);
    //window.dict.dict[hash] = {};
    menu_item.find('.content_text').attr('data-translate', hash);
    menu_item
      .find('.img-fluid')
      .attr('id', 'img_' + tab.replace('#', '') + '_' + pos);

    menu_item.find('.put_image').css('display', 'block');

    that.mi_id = menu_item.attr('id');

    menu_item.find('input:file').on('change', menu_item, that.onLoadImage);

    if (
      $('.category[id="' + tab + '"]', window.parent.document).attr('extra') ===
      'true'
    ) {
      menu_item.find("[data-target='.extras']").css('display', 'block');
      menu_item.find('.extras').attr('id', 'extra_' + tab + '_' + pos);
      menu_item
        .find("[data-target='.extras']")
        .attr('data-target', '#extra_' + tab + '_' + pos);
    }

    menu_item
      .find('.fa-image')
      .on('click touchstart', menu_item, function (ev) {
        let menu_item = $(ev.data);
        let vis = menu_item.find('.img-fluid').css('visibility');

        ev.target = menu_item.find('.img-fluid')[0];
        ev.mi = menu_item.attr('id');
        that.OnClickImport(ev);
      });

    menu_item.find('.add_pack').on('click', that.onAddPack);

    menu_item.find('.add_content').on('click touchstart', function () {
      $(this).closest('.menu_item').find('.item_content').slideDown('slow');
      let vis = $(this)
        .closest('.menu_item')
        .find('.content_text')
        .css('visibility');
      if (vis === 'visible') {
        vis = 'hidden';
      } else {
        vis = 'visible';
      }
      $(this)
        .closest('.menu_item')
        .find('.content_text')
        .css('visibility', vis);
      $(this).closest('.menu_item').find('.content_text').focus();
    });

    // menu_item.find('.item_pack').on('focusout', that, function (ev) {
    //     const that = ev.data;
    //     let pack = menu_item.find('.item_pack').attr('pack');
    //     if ($(this).val() === '') {
    //         menu_item.find('a:contains(' + pack + ')').remove();
    //         let pl = JSON.parse(menu_item.find('.item_pack').attr('packlist'));
    //         delete pl[pack];
    //         $(this).attr('packlist', JSON.stringify(pl));
    //     }
    // });

    menu_item
      .find('.brand_img')
      .attr('id', 'brand_' + tab + '_' + $('.brand_img').length);
    menu_item.find('.brand').on('click', menu_item, function (ev) {
      let menu_item = $(this).closest('.menu_item');
      //let vis = menu_item.find('.img-fluid').css('visibility');
      ev.target = menu_item.find('.brand_img')[0];
      ev.mi = menu_item.attr('id');
      that.OnClickImport(ev);
    });

    menu_item.find('.brand').on('dragend', function () {
      $(this).remove();
    });

    menu_item
      .find('.cert_container')
      .attr('id', 'gallery_' + tab.replace('#', '') + '_' + pos);

    menu_item.find('.add_pack').attr('id', 'pack_' + tab.replace('#', ''));
    menu_item
      .find('.add_pack')
      .on('click touchstart', { mi: menu_item, that: that }, that.onAddPack);

    // if(pos>1) {
    //     menu_item.find('.pack_container').replaceWith( $('div#' + tab + '_' + String(pos - 1)).find('.pack_container').clone());
    //     menu_item.find('.price_div').replaceWith( $('div#' + tab + '_' + String(pos - 1)).find('.price_div').clone());
    //     menu_item.find('a[role=packitem]').on('click touchstart', {
    //         that: that,
    //         mi: menu_item
    //     }, that.OnClickPack);
    // }
    menu_item.find('.add_prop').on('click', that.onAddProp);

    menu_item.find('.add_extra').on('click', that.onAddExtra);

    //$('#editor_pane .tab-content').append(menu_item[0]);

    if (menu_item.find('.item_title')[0]) {
      menu_item.find('.item_title').focus();
      menu_item.find('.item_title')[0].scrollIntoView();
    }

    menu_item.find('.toolbar').css('display', 'block');

    if (menu_item.find('.item_content').css('display') == 'block')
      menu_item.find('.item_content').slideToggle('fast');

    //window.parent.dict.set_lang(window.parent.sets.lang, $(menu_item));
    $('textarea, input, :checkbox, .form-control', menu_item).on(
      'change',
      function (ev) {
        that.saveFrame($('.nav-link.active').attr('href'), menu_item);
      }
    );
  }

  onAddProp(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    let row = $(ev.target).closest('.row').clone();
    row.find('.input').prop('contenteditable', true);
    row.find('.input').text('');
    row.find('.add_prop_div').remove();
    $(ev.target).closest('.prop.container').append(row);
    // setTimeout(function(){
    //     row.find('.prop_key[contenteditable=true]').focus();
    // },100);
  }

  onAddPack(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    let row = $(ev.target).closest('.pack_tmplt').clone();
    row.removeClass('pack_tmplt');
    row.find('.input').prop('contenteditable', true);
    row.find('.input').text('');
    row.find('.add_pack_div').remove();
    row.find('.add_prop_div').remove();
    row.find('.bargain_div').remove();
    //$(ev.target).closest('.pack_tmplt').after(row);
    row.insertBefore($(ev.target).closest('.pack_tmplt'));
    // setTimeout(function(){
    //     row.find('.item_pack[contenteditable=true]').focus();
    // },100);
  }

  onAddExtra(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    let row = $(ev.target).closest('.add_row').clone();
    row.find('.add_extra_div').remove();
    row.addClass('extra');
    row.find('.input').prop('contenteditable', true);
    row.find('.input').text('');
    $(ev.target).closest('.add_row').parent().append(row);
    setTimeout(function () {
      $(row).find('.extra_title').focus();
    }, 100);
  }

  OnClickImport(ev) {
    let menu_item = $('#' + ev.mi);
    $(menu_item)
      .find('input:file')
      .attr(
        'menu_item',
        JSON.stringify({
          id: ev.mi,
          target: $(ev.target).attr('class').split(/\s+/),
        })
      );
    $(menu_item).find('input:file').focus();
    $(menu_item).find('input:file').trigger(ev);
    //$(menu_item).find('.fa-image').css('visibility', 'hidden');
  }

  onLoadImage(ev) {
    let menu_item = $(ev.data);
    let el = JSON.parse($(menu_item).find('input:file').attr('menu_item'));
    try {
      loadImage(
        ev.target.files[0],
        function (img, data) {
          if (img.type === 'error') {
            console.error('Error loading image ');
          } else {
            if (el.target[0] === 'brand_img') {
              $('#' + el.id)
                .find('.brand_img')
                .attr('src', img.toDataURL());

              $('#' + el.id).css('visibility', 'visible');
              return;
            }
            let tab = $('.div_tab_inserted.active').attr('id');

            $(img).addClass('carousel-img img-fluid mx-auto d-block');

            let i = menu_item.find('.carousel-img').length;

            menu_item
              .find('.carousel-inner')
              .find('.carousel-item')
              .removeClass('active');
            let carousel_item = $('<div class="carousel-item active"></div>');
            $(carousel_item).append(img);
            menu_item.find('.carousel-inner').append(carousel_item);

            //$(menu_item).find('.cert_container').find('img').draggable('destroy');

            $(img).longTap(function () {
              // let active = $(menu_item).find('.cert_container').find('.active');
              // active.removeClass('carousel-item');
              // $(img).draggable(
              //     {delay: 0},
              //     {cursor: "crosshair"},
              //     {
              //         start: function (ev) {
              //         },
              //         drag: function (ev) {
              //             //$(el).attr('drag', true);
              //         },
              //         stop: function (ev) {
              //             $(img).draggable('destroy');
              //             $(menu_item).find('.active').addClass('carousel-item');
              //             // $(menu_item).find('.active').attr('drag_left', $(ev.target).css('left'));
              //             // $(menu_item).find('.active').attr('drag_top', $(ev.target).css('top'));
              //         }
              //     });
            });

            //$(menu_item).find('.carousel').carousel({interval: 3000});
            menu_item
              .find('.carousel')
              .attr('id', 'carousel_' + menu_item.attr('id'));
            if (menu_item.find('.carousel-control-prev').length === 0) {
              menu_item
                .find('.carousel')
                .append(
                  '<a class="carousel-control-prev" href="#carousel_' +
                    tab +
                    '_' +
                    i +
                    '">' +
                    '<span class="carousel-control-prev-icon"></span>' +
                    '</a>' +
                    '<a class="carousel-control-next" href="#carousel_' +
                    tab +
                    '_' +
                    i +
                    '">' +
                    '<span class="carousel-control-next-icon"></span>' +
                    '</a>'
                );
            }

            // Enable Carousel Controls
            menu_item.find('.carousel-control-prev').click(function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              $('#carousel_' + menu_item.attr('id')).carousel('prev');
              menu_item.find('.carousel').carousel('pause');
            });

            menu_item.find('.carousel-control-next').click(function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              $('#carousel_' + menu_item.attr('id')).carousel('next');
              menu_item.find('.carousel').carousel('pause');
            });

            $(img).doubleTap(function (ev) {
              if (
                confirm(
                  {
                    ru: 'Удалить изображение?',
                    en: 'Remove image?',
                    fr: "Supprimer l'image ?",
                  }[window.parent.sets.lang]
                )
              ) {
                $(this).closest('.carousel-item').remove();
                menu_item.find('.carousel').carousel('next');
                $(
                  $(menu_item).find('.carousel-inner').find('.carousel-item')[0]
                ).addClass('active');
                menu_item.find('.carousel').carousel('pause');
                that.saveFrame('#editor_pane', menu_item);
              }
            });

            $(img).on('dblclick', function (ev) {
              ev.preventDefault();
              ev.stopPropagation();
              if (
                confirm(
                  {
                    ru: 'Удалить изображение?',
                    en: 'Remove image?',
                    fr: "Supprimer l'image ?",
                  }[window.parent.sets.lang]
                )
              ) {
                $(this).closest('.carousel-item').remove();
                menu_item.find('.carousel').carousel('next');
                $(
                  $(menu_item).find('.carousel-inner').find('.carousel-item')[0]
                ).addClass('active');
                menu_item.find('.carousel').carousel('pause');
                that.saveFrame('#editor_pane', menu_item);
              }
            });

            //$(menu_item.find('.carousel-inner').find('.carousel-item')[0]).addClass('active');
            menu_item.find('.carousel').carousel('pause');

            console.log('Original image width: ', data.originalWidth);
            console.log('Original image height: ', data.originalHeight);
          }
        },
        {
          orientation: true,
          maxWidth: 500,
          maxHeight: 300,
          minWidth: 100,
          minHeight: 300,
          canvas: true,
        }
      );
    } catch (ex) {}
  }

  RedrawOrder(obj) {
    const that = this;
    window.parent.db.GetOrder(
      new Date(this.date),
      obj.uid,
      window.parent.user.uid,
      function (res) {
        if (res !== -1) {
          let keys = Object.keys(res.data);
          //$('.sel_period').text(res.period);
          for (let k in keys) {
            if (keys[k] === 'comment') {
              $('.comment').text(
                that.dict.getDictValue(
                  window.parent.user.lang,
                  res.data.comment
                )
              );
            } else {
              window.parent.db.GetApproved(
                new Date(that.date),
                obj.uid,
                window.parent.user.uid,
                keys[k],
                function (appr) {
                  if (
                    appr &&
                    //res.period ===appr.period &&
                    res.data[keys[k]].price === appr.data.price &&
                    res.data[keys[k]].pack === appr.data.pack &&
                    res.data[keys[k]].qnty === appr.data.qnty
                  ) {
                    $('.card-title a[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.ordperiod')
                      .text(appr.period);
                    $('.card-title a[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.approved')
                      .attr('approved', that.date);
                    $('.card-title a[data-translate=' + keys[k] + ']')
                      .closest('.menu_item')
                      .find('.period_div')
                      .css('visibility', 'visible');

                    //$('.address').attr('disabled','true');
                    // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.increase').css('visibility','hidden');
                    // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.reduce').css('visibility','hidden');
                    // $('.item_title[data-translate=' + keys[k] + ']').closest('.row').find('.item_pack').attr('data-toggle','');
                  }
                }
              );

              if (res.data[keys[k]].qnty > 0) {
                $('.card-title a[data-translate=' + keys[k] + ']')
                  .closest('.menu_item')
                  .find('.amount')
                  .val(res.data[keys[k]].qnty);
                $('.card-title a[data-translate=' + keys[k] + ']')
                  .closest('.menu_item')
                  .find('.amount')
                  .text(res.data[keys[k]].qnty);

                let price = res.data[keys[k]].price;
                $('.card-title a[data-translate=' + keys[k] + ']')
                  .closest('.menu_item')
                  .find('.item_price')
                  .val(price);
                let markup = res.data[keys[k]].markup;
                $('.card-title a[data-translate=' + keys[k] + ']')
                  .closest('.menu_item')
                  .find('.item_markup')
                  .val(markup);
                let pack = res.data[keys[k]].pack;
                $('.card-title a[data-translate=' + keys[k] + ']')
                  .closest('.menu_item')
                  .find('.item_pack')
                  .text(pack);
                $('.card-title a[data-translate=' + keys[k] + ']')
                  .closest('.menu_item')
                  .attr('ordered', '');
              }
            }
          }
        }
      }
    );
  }

  GetOfferItems(lang) {
    const that = this;
    let offerObj = { remote: {} };
    that.arCat = [];

    //$('.item_title').click();

    //
    // if (value) {
    //     if (!window.parent.dict.dict[md5(value)]) {
    //         window.parent.dict.dict[md5(value)] = {};
    //     }
    //     window.parent.dict.dict[md5(value)][lang] = value;
    // } else {
    //     $(val).empty();
    //     return true;
    // }

    // let checked = $(val).find('.menu_item').find('.publish:checkbox').prop('checked');

    let miAr = $('.menu_item');

    for (let i = 0; i < miAr.length; i++) {
      let item = {};

      let value = $(miAr[i]).attr('cat');
      // offerObj['local'][value] = [];
      if (!offerObj['remote'][value]) offerObj['remote'][value] = [];

      item.checked = JSON.stringify(
        $(miAr[i]).find('.publish:checkbox').prop('checked')
      );

      item.cert = [];
      $.each(
        $(miAr[i]).find('.carousel-inner').find('.img-fluid'),
        function (i, el) {
          let src = el.src ? el.src : el.toDataURL();
          if (src.includes('empty.png')) return;

          if (src.includes('http://') || src.includes('https://')) {
            item.cert.push({ src: src.split('/').pop() });
          } else {
            item.cert.push({ src: src });
          }
        }
      );

      let title = $(miAr[i]).find('.item_title');
      let key = $(title).attr('data-translate');
      let text = $(miAr[i]).find('.item_title').val();

      if (text.length === 0 || !text.trim()) {
        continue;
      }

      if (!key) {
        key = md5('item_title_' + miAr[i].id + text);
        $(title).attr('data-translate', key);
      }

      if (!window.parent.dict.dict[key]) {
        window.parent.dict.dict[key] = {};
      }

      if (text && text !== window.parent.dict.dict[key][lang]) {
        window.parent.dict.dict[key][lang] = text;
        window.parent.db.SetObject(
          'dictStore',
          { hash: key, obj: window.parent.dict.dict[key] },
          () => {}
        );
      }
      item.title = key;

      if ($(miAr[i]).find('.content_text').css('visibility') === 'visible') {
        let cont_text = $(miAr[i]).find('.content_text');
        key = $(cont_text).attr('data-translate');
        text = $(cont_text).val(); //.replace(/'/g,'%27').replace(/\n/g,'%0D').replace(/"/g,'%22');
        if (!key) {
          key = md5('content_text_' + miAr[i].id + text);
          $(cont_text).attr('data-translate', key);
        }

        if (text && text !== window.parent.dict.dict[key][lang]) {
          if (!window.parent.dict.dict[key]) {
            window.parent.dict.dict[key] = {};
          }
          let obj = Object.assign({}, window.parent.dict.dict[key]);
          delete window.parent.dict.dict[key];
          window.parent.db.DeleteObject('dictStore', key, () => {});
          window.parent.dict.dict[key] = obj;
          window.parent.dict.dict[key][lang] = text;
          window.parent.db.SetObject(
            'dictStore',
            { hash: key, obj: window.parent.dict.dict[key] },
            () => {}
          );
        }

        item.content_text = { value: key };
      } else {
        if (item.content) delete item.content;
      }

      if ($(miAr[i]).find('.brand_img').attr('src')) {
        if ($(miAr[i]).find('.brand_img').attr('src').includes('http')) {
          item.brand = {
            logo: $(miAr[i]).find('.brand_img').attr('src').split('/').pop(),
          };
        } else {
          item.brand = { logo: $(miAr[i]).find('.brand_img').attr('src') };
        }
      } else {
        delete item.brand;
      }

      $.each($(miAr[i]).find('.prop .row'), function (i, el) {
        if ($(el).find('.prop_key').val() && $(el).find('.prop_val').val()) {
          if (!item.prop) {
            item.prop = {};
          }
          if (!item.prop[$(el).find('.prop_key').val()])
            item.prop[$(el).find('.prop_key').val()] = [];
          item.prop[$(el).find('.prop_key').val()].push(
            $(el).find('.prop_val').val()
          );
        }
      });

      $.each($(miAr[i]).find('.pack_row'), async function (p, el) {
        if (
          $(el).find('.item_pack').val() &&
          $(el).find('.item_price ').val()
        ) {
          if (!item.packlist) item.packlist = {};
          key = $(el).find('.item_pack').attr('data-translate');
          let text = $(el).find('.item_pack').val();
          if (!key) {
            key = md5('item_pack_' + miAr[i].id + p + text);
            $(el).find('.item_pack').attr('data-translate', key);
          }

          if (!window.parent.dict.dict[key]) {
            window.parent.dict.dict[key] = {};
          }

          if (text && text !== window.parent.dict.dict[key][lang]) {
            let obj = Object.assign({}, window.parent.dict.dict[key]);
            delete window.parent.dict.dict[key];
            //let delete_key = new Promise( function (resolve, reject) {
            window.parent.db.DeleteObject('dictStore', key, () => {
              //resolve();
            });
            // });
            // await delete_key;

            window.parent.dict.dict[key] = obj;
            window.parent.dict.dict[key][lang] = text;
            window.parent.db.SetObject(
              'dictStore',
              { hash: key, obj: window.parent.dict.dict[key] },
              () => {}
            );
          }

          if (!item.packlist[key]) item.packlist[key] = {};
          item.packlist[key].qnty = $(el).find('.item_qnty').val();
          item.packlist[key].price = $(el).find('.item_price').val();
          item.packlist[key].markup = $(el).find('.item_markup').val();
        }
      });

      item.bargain = JSON.stringify(
        $(miAr[i]).find('.bargain:checkbox').prop('checked')
      );

      item.extra = {};
      $.each($(miAr[i]).find('.add_row'), function (e, el) {
        if (!$(el).find('.extra_title').val()) return;
        key = $(el).find('.extra_title').attr('data-translate');
        let text = $(el).find('.extra_title').val();

        if (!key) {
          key = md5('extra_title' + miAr[i].id + e + text);
          $(el).find('.extra_title').attr('data-translate', key);
        }

        if (!window.parent.dict.dict[key]) {
          window.parent.dict.dict[key] = {};
        }

        if (text && text !== window.parent.dict.dict[key][lang]) {
          let obj = Object.assign({}, window.parent.dict.dict[key]);
          delete window.parent.dict.dict[key];
          window.parent.db.DeleteObject('dictStore', key, () => {});

          window.parent.dict.dict[key] = obj;
          window.parent.dict.dict[key][lang] = text;

          window.parent.db.SetObject(
            'dictStore',
            { hash: key, obj: window.parent.dict.dict[key] },
            () => {}
          );
        }

        if (!item.extra[key]) item.extra[key] = {};
        item.extra[key].price = $(el).find('.extra_price').val();
      });

      if (!_.includes(that.arCat, parseInt(value)))
        that.arCat.push(parseInt(value));

      //offerObj['local'][value].push(item);

      offerObj['remote'][value].push(item);
    }

    return offerObj;
  }

  SaveOffer(items) {
    let ind = $('li.tab_inserted.active').val();
    let active = $($('li.active').find('img')[ind]).text();

    // if(active) {
    //     items = this.getTabItems(active, lang);
    // }
    if (items['local'])
      window.parent.user.UpdateOfferLocal(
        this.offer,
        items['local'],
        window.parent.user.offer.stobj.location,
        window.parent.dict.dict
      );
  }

  SaveProfile(cb) {
    const that = this;

    if ($('.avatar')[0].src.includes('base64')) {
      let k = 200 / $('.avatar').height();
      utils.createThumb_1(
        $('.avatar')[0],
        $('.avatar').width() * k,
        $('.avatar').height() * k,
        function (avatar) {
          uploadProfile(avatar.src, cb);
        }
      );
    } else {
      uploadProfile(window.parent.user.profile.profile.avatar, cb);
    }

    function uploadProfile(avatar, cb) {
      let data_post = {
        proj: 'd2d',
        user: window.parent.user.constructor.name,
        func: 'updprofile',
        uid: window.parent.user.uid,
        psw: window.parent.user.psw,
        profile: {
          type: window.parent.user.profile.profile.type,
          email: $('#email').val().toLowerCase(),
          avatar: avatar,
          lang: window.parent.user.profile.profile.lang,
          name: $('#name').val(),
          worktime: $('#worktime').val(),
          mobile: $('#mobile').val(),
          place: $('#place').val(),
          del_price_per_dist: $('#del_price_per_dist').val(),
          del_no_less_than: $('#del_no_less_than').val(),
          delivery: $('#delivery').val(),
        },
        promo: $('#promo').val(),
        prolong: $('#prolong  option:selected').val(),
      };

      window.parent.network.SendMessage(data_post, function (res) {
        let res_ = res.profile;

        window.parent.db.GetSettings(function (obj) {
          let set = _.find(obj, { uid: window.parent.user.uid });
          if (set.settings) delete set.settings;
          set.profile = data_post.profile;
          set.promo = data_post.promo;
          set.prolong = data_post.prolong;

          if (res_) {
            if (res_) {
              set.profile.avatar = res_.avatar;
            }
            window.parent.db.SetObject('setStore', set, function (res) {
              $('#user', window.parent.document).attr(
                'src',
                that.image_path + res_.avatar
              );
              $(
                '#user',
                $('#fd_frame_tmplt', window.parent.document).contents()
              ).attr('src', that.image_path + res_.avatar);
              that.profile = set.profile;
              window.parent.user.profile.profile = set.profile;
              window.parent.user.promo = data_post.promo;
              window.parent.user.prolong = data_post.prolong;
              cb(true);
            });
          } else {
            cb(false);
          }
        });
      });
    }
  }

  SaveSettings() {
    let settings = {};
    $('#settings')
      .find('select')
      .each(function (i, item) {
        settings[$(item).attr('id')] = $(item)
          .closest('div')
          .find('.sel_prolong')
          .val();
      });

    window.parent.db.GetSettings(function (obj) {
      let _ = require('lodash');
      let set = _.find(obj, { uid: window.parent.user.uid });
      set.settings = settings;

      window.parent.db.SetObject('setStore', set, function (res) {
        window.parent.user.profile.profile = set.profile;
        window.parent.user.settings = settings;
      });
      let data_obj = {
        proj: 'd2d',
        user: window.parent.user.constructor.name.toLowerCase(),
        func: 'setsup',
        psw: window.parent.user.psw,
        uid: window.parent.user.uid,
        //profile:set.profile
      };
      data_obj['settings'] = settings;
      //data_obj['profile'] = set.profile;
      window.parent.network.SendMessage(data_obj, function (data) {});
    });
  }
}

//////////////////
// WEBPACK FOOTER
// ./src/supplier/supplier.offer.frame.js
// module id = 752
// module chunks = 3
