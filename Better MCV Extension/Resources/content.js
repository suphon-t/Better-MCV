function main() {
    let fromPopState = false;
    let fromLoadSubPage = false;
    
    function pushPath(path) {
        history.pushState({}, undefined, `/?q=courseville${path}`);
    }
    
    function getCourseMatch() {
        const search = window.location.search;
        const params = queryString.parse(search);
        const query = params.q;
        if (!query) {
            return null;
        }
        const courseMatch = query.match(/courseville\/course\/([0-9]+)(\/(\w+))?/);
        if (!courseMatch) {
            return null;
        } else {
            return {
                cv_cid: courseMatch[1],
                sub_page: courseMatch[3],
            };
        }
    }
    
    function loadSubPage(courseMatch) {
        try {
            fromLoadSubPage = true;
            const { cv_cid, sub_page } = courseMatch;
            if (!sub_page) {
                return;
            }
            const dummy = document.createElement('a');
            $(dummy).attr('cv_cid', cv_cid);
            $(dummy).attr('sub_page', sub_page);
            $(dummy).attr('ocv_mode', '0');
            clickSubpageButton.call(dummy);
        } finally {
            fromLoadSubPage = false;
        }
    }
    
    $(document).ready(() => {
        console.log('ready');
        
        // remove on close dialog
        $._data(window, 'events').beforeunload.forEach(listener => {
            $(window).unbind('beforeunload', listener);
        });
        
        // remove hash link on course icons
        const oldPrepareCourseIcon = prepareCourseIcon;
        prepareCourseIcon = () => {
            oldPrepareCourseIcon();
            $(".courseville-courseicon").attr('href', 'javascript:void(0)');
        }
        prepareCourseIcon();
        
        // save current screen to url for courses and course pages
        const oldCoursevilleAjaxPost = coursevilleAjaxPost;
        coursevilleAjaxPost = (url, params, target, finisher, extras) => {
            oldCoursevilleAjaxPost(url, params, target, finisher, extras);
            if (!fromPopState && !fromLoadSubPage && typeof params === 'string') {
                // console.log('coursevilleAjaxPost', url, params, target, finisher, extras);
                params = queryString.parse(params.replace('&undefined', ''));
                switch (finisher) {
                    case 'afterClickCourseIcon':
                        pushPath(`/course/${params.cv_cid}`);
                        break;
                    case 'afterClickSubpageButton':
                        pushPath(`/course/${params.cv_cid}/${params.sub_page}`);
                        break;
                    case 'afterClickTabButton':
                        history.pushState({}, undefined, `/`);
                        break;
                }
            }
        }
        
        function afterLoadCourse(rp, extras) {
            afterClickCourseIcon(rp, extras);
            loadSubPage(getCourseMatch());
        }
        window.afterLoadCourse = afterLoadCourse;
        
        function loadCourse(cv_cid) {
            $("#courseville-main-spinner").show();
            $("#courseville-panel-mid-inner").hide("slow");
            var params = "ocv_mode=0&cv_cid="+cv_cid;
            var url = $("#base-url").val()+"?q=courseville/ajax/course";
            coursevilleAjaxPost(url,params,"courseville-panel-mid-inner","afterLoadCourse");
        }
        
        // restore correct pages from url
        window.onpopstate = () => {
            try {
                fromPopState = true;
                const courseMatch = getCourseMatch();
                const dummy = document.createElement('a');
                if (courseMatch === null) {
                    $(dummy).attr('data-page', 'home');
                    $(dummy).attr('data-status-msg', 'Loading content.');
                    clickTabButton.call(dummy);
                } else {
                    const { cv_cid, sub_page } = courseMatch;
                    const currentCourse = $('#course_info').attr('cv_cid');
                    if (currentCourse !== cv_cid) {
                        loadCourse(cv_cid);
                    } else if (sub_page !== undefined) {
                        loadSubPage(courseMatch);
                    } else {
                        loadSubPage({ cv_cid, sub_page: 'home' });
                    }
                }
                // console.log(params.q);
            } finally {
                fromPopState = false;
            }
        }
    });
}

const script = document.createElement('script');
script.appendChild(document.createTextNode(`(${main})();`));
document.documentElement.appendChild(script);
script.remove()
