'use strict'

import {DeliverSettings} from "./deliver.settings.old";
import {DB} from "../map/storage/db"

import 'bootstrap'

$(document).on('readystatechange', function () {

    if (!window.EventSource) {

        alert({'ru':'В этом браузере нет поддержки EventSource','en':'No SSE support in the browser'}[window.sets.lang]).addClass('show');
        return;
    }

    if (document.readyState !== 'complete') {
        return;
    }
    // parent

    window.db = new DB('Deliver', function () {
        window.ds = new DeliverSettings(window.db);
    });

    var readURL = function(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $('.avatar').attr('src', e.target.result);
                $('.avatar').siblings('input:file').attr('changed',true);
            }
            reader.readAsDataURL(input.files[0]);
        }
    }


    $(".file-upload").on('change', function(){
        readURL(this);
    });
});