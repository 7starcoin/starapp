import React from 'react';

export default class SystemFunctions {

    static staticVar = [];

    static formatNumber(number, decimals = 0, dec_point = '.', separator = ' ') {
        number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
        let n = !isFinite(+number) ? 0 : +number,
            prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
            sep = (typeof separator === 'undefined') ? ',' : separator,
            dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
            s = '',
            toFixedFix = function (n, prec) {
                var k = Math.pow(10, prec);
                return '' + (Math.round(n * k) / k)
                    .toFixed(prec);
            };
        s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
            .split('.');
        if (s[0].length > 3) {
            s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
        }
        if ((s[1] || '')
            .length < prec) {
            s[1] = s[1] || '';
            s[1] += new Array(prec - s[1].length + 1)
                .join('0');
        }
        return s.join(dec);
    }

    static saveStaticVar(name, value) {
        this.staticVar[name] = value;
    }

    static getStaticVar(name) {
        return this.staticVar[name];
    }

    static isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    static openTab(url) {
        // Create link in memory
        let a = window.document.createElement("a");
        a.target = '_blank';
        a.href = url;

        // Dispatch fake click
        let e = window.document.createEvent("MouseEvents");
        e.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    };

    static cloneObj(obj) {
        let copy;

        if (null == obj || "object" != typeof obj) return obj;

        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        if (obj instanceof Array) {
            copy = [];
            for (let i = 0, len = obj.length; i < len; i++) {
                copy[i] = this.cloneObj(obj[i]);
            }
            return copy;
        }

        if (obj instanceof Object) {
            copy = {};
            for (let attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = this.cloneObj(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    static in_array(arr, obj) {
        return (arr.indexOf(obj) !== -1);
    }

    static isEmptyObject(obj) {
        for (let i in obj) {
            if (obj.hasOwnProperty(i)) {
                return false;
            }
        }
        return true;
    }

    static timeConvert(timestamp) {
        let date = new Date(timestamp);
        let minutes = "0" + date.getMinutes();
        let month = "0" + (date.getMonth() + 1);
        let year = date.getFullYear() % 100;
        return date.getDate() + '.' + month.substr(-2) + '.' + year + ' ' + date.getHours().toString() + ':' + minutes.substr(-2).toString();
    }

    static timeConvertDays(timestamp) {
        let date = new Date(timestamp);
        let month = "0" + (date.getMonth() + 1);
        let year = date.getFullYear() % 100;
        return date.getDate() + '.' + month.substr(-2) + '.' + year;
    }

    static timeConvertHMS(timestamp) {
        let date = new Date(timestamp);
        let minutes = "0" + date.getMinutes();
        let seconds = "0" + date.getSeconds();
        return date.getHours().toString() + ':' + minutes.substr(-2).toString() + ':' + seconds.substr(-2).toString();
    }

    static rand(min, max, round = 0) {
        return this.round(min - 0.5 + Math.random() * (max - min + 1), round);
    }

    static wordDeclensionNumeric(num, w1, w2, w3){
        if (num % 10 === 1 && (num % 100 < 10 || num % 100 > 20)) {
            return w1;
        } else if (num % 10 > 1 && num % 10 < 5 && (num % 100 < 10 || num % 100 > 20)) {
            return w2;
        } else {
            return w3;
        }
    }

    static reduceNumber(num){
        if (!this.isNumeric(num)){
            return null;
        }
        if (num >= 1000000000) {
            return (Math.floor(num / 10000000) / 100) + 'KKK';
        } else if (num >= 1000000) {
            return (Math.floor(num / 10000) / 100) + 'KK';
        } else if (num >= 1000) {
            return (Math.floor(num / 10) / 100) + 'K';
        } else {
            return num;
        }
    }

    static calcCloseData(end) {
        let date = new Date();
        let cur = date.getTime() / 1000;
        if (end < cur) {
            return '...';
        }
        let r = end - cur;
        return this.secondsToTextTimeout(r);
    }

    static secondsToTextTimeout(r){
        let days = Math.floor(r / 86400);
        r -= days * 86400;
        let hours = Math.floor(r / 3600);
        r -= hours * 3600;
        let minutes = Math.floor(r / 60);
        r -= minutes * 60;
        r = Math.round(r);
        if (r >= 60) {
            minutes++;
            r = 0;
        }

        if (days > 0){
            minutes = 0;
            r = 0;
        } else if (hours > 0){
            r = 0;
        }

        return ((days > 0 ? days + ' д. ' : '') + (hours > 0 ? hours + ' ч. ' : '') + (minutes > 0 ? minutes + ' ' + ' м. ' : '') + (r > 0 ? r + ' ' + ' с. ' : '')).trim();
    }

    static getClassicTimestamp() {
        return Math.round((new Date()).getTime() / 1000);
    }

    static round(num, count){
        return parseFloat(parseFloat(num).toFixed(count));
    }

    static getTimeOutMinutes(end){
        let date = new Date();
        let cur = date.getTime() / 1000;
        if (end == null || end < cur){
            return '...';
        }
        let r = end - cur;
        let minutes = Math.floor(r / 60);
        r -= minutes * 60;
        r = Math.round(r);
        if (r >= 60) {
            minutes++;
            r = 0;
        }
        return minutes + ':' + ('0' + r).substr(-2).toString();
    }
}
