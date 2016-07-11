'use strict';

app.controller('controller', ['$scope', '$timeout', '$document', 'FocusUtil', 'FocusConstant', 'focusController', 'CONSTANT', function ($scope, $timeout, $document, FocusUtil, FocusConstant, focusController, CONSTANT) {

    /* CONSTANT values definition */
    $scope.CATEGORY = CONSTANT.CATEGORY;
    $scope.DEPTH = {
        INDEX: 1,
        DETAIL: 2,
        PLAYER: 3,
        SETTING: 4
    };

    /* Initial values are defined. */
    $scope.currentCategory = $scope.CATEGORY.COLORS;
    $scope.currentDepth = $scope.DEPTH.INDEX;
    $scope.isOverviewDark = true;
    $scope.showMediaController = false;
    var lastDepth = $scope.currentDepth;
    var items = CONSTANT.ITEMS;
    $scope.dataCategory = [items, items, items, items];
    $scope.relatedPlaylist = [items];

    $document.on('ready', function(){
        $timeout(function(){
            /* Fill up the array for each list component. */
            updateCategoryListData(CONSTANT.PREPARED_DATA.COLORS, $scope.CATEGORY.COLORS, true);
            updateCategoryListData(CONSTANT.PREPARED_DATA.ALPHABETS, $scope.CATEGORY.ALPHABETS, true)
            updateCategoryListData(CONSTANT.PREPARED_DATA.NUMBERS, $scope.CATEGORY.NUMBERS, true);
            $scope.isInitCompleted = true;  // 'Welcome' page will be disappear by this line.

            $timeout(function () { // Set 'focus' to specific element by 'focus' controller.
                focusController.focus($('#' + $scope.CATEGORY.COLORS + '-' + CONSTANT.PREPARED_DATA.COLORS[0].id));
            }, CONSTANT.EFFECT_DELAY_TIME);
        }, 3000);
    });

    var lastFocusedGroup;
    var currentItemData;

    var isScrolling = false;
    $scope.onScrollStart = function () {
        isScrolling = true;
    };
    $scope.onScrollFinish = function () {
        isScrolling = false;
        updateOverview();
    };

    $scope.toggleIsPlaying = function(isPlaying){ // Change button shape by '$scope.isPlaying' ('Play' <-> 'Pause')
        $scope.$applyAsync(function(){
            $scope.isPlaying = isPlaying;
        });
    };

    // The callback function which is called when each list component get the 'focus'.
    $scope.focus = function ($event, category, data, $index) {
        if ($scope.currentDepth === $scope.DEPTH.INDEX) {
            var scrollCount = category;
            // Translate each list component to up or down.
            moveContainer(category, 'list-category', -CONSTANT.SCROLL_HEIGHT_OF_INDEX * scrollCount);
            if (!data || !data.item || data.item.loaded === false) {
                return;
            }
            currentItemData = data.item;
            isScrolling === false && updateOverview();
            lastFocusedGroup = FocusUtil.getData($event.currentTarget).group;
        }
    };

    // The callback function which is called when each list component lose the 'focus'.
    $scope.blur = function ($event, category, data) {
        $scope.isOverviewDark = true;
    };

    // The callback function which is called when user select one item of the list component.
    $scope.selected = function ($event, category, item, $index) {
        var depth;
        if (item.loaded === false) {
            return;
        }
        if(category === $scope.CATEGORY.RELATED_PLAY_LIST){
            depth = $scope.DEPTH.PLAYER;
            launchPlayer($scope.relatedPlaylist[$index].talk);
        } else {
            depth = $scope.DEPTH.DETAIL;
            $scope.relatedPlaylist = $scope.dataCategory[category];
            $timeout(function(){
                $('#list-related-talks').trigger('reload');
            }, 0);
            updateOverview();
        }
        depth && changeDepth(depth);
    };

    $scope.buttonFocusInDetail = function ($event, $originalEvent) {
        $scope.isOverviewDark = false;
    };

    $scope.selectPlayButton = function(){
        launchPlayer($scope.overview);
        changeDepth($scope.DEPTH.PLAYER);
    };

    focusController.addBeforeKeydownHandler(function(context){
        if($scope.currentDepth === $scope.DEPTH.PLAYER){
            if($scope.showMediaController === false){
                $scope.setMediaControllerTimer();
                return false;
            } else {
                $scope.setMediaControllerTimer();
            }
        }
        switch (context.event.keyCode) {
            case CONSTANT.KEY_CODE.RETURN:
            case CONSTANT.KEY_CODE.ESC:
                $scope.back();
                break;
        }
    });

    var getPlayerControls = function(){
        return {
            play: function(){
                $timeout(function(){
                    $('#player .icon-caph-play').parent().trigger('selected');
                }, 500);
            },
            pause: function(){
                $('#player .icon-caph-pause').parent().trigger('selected');
            },
            restart: function(){
                $('#player .icon-caph-prev').parent().trigger('selected');
            },
            rewind: function(){
                $('#player .icon-caph-rewind').parent().trigger('selected');
            },
            forward: function(){
                $('#player .icon-caph-forward').parent().trigger('selected');
            },
            next: function(){
                $('#player .icon-caph-next').parent().trigger('selected');
            }
        };
    };

    var launchPlayer = function() {
        $scope.setMediaControllerTimer();
        if($scope.setting.autoPlay){
            getPlayerControls().play();
        }
        focusController.focus('btnPlayerPlay');
    };

    var mediaControllerTimer;
    $scope.setMediaControllerTimer = function(){
        $scope.showMediaController = true;
        if(mediaControllerTimer){
            $timeout.cancel(mediaControllerTimer);
        }
        mediaControllerTimer = $timeout(function(){
            $scope.showMediaController = false;
            mediaControllerTimer = null;
        }, CONSTANT.MEDIA_CONTROLLER_TIMEOUT);
    };

    // 'Changing depth' means the scene is changed.
    var changeDepth = function(depth, callback) {
        lastDepth = $scope.currentDepth;
        $scope.currentDepth = depth;
        $timeout(function () {
            focusController.setDepth(depth);
            if(depth === $scope.DEPTH.DETAIL){
                focusController.focus('btnPlay');
            }
            callback && callback();
        }, CONSTANT.EFFECT_DELAY_TIME);
    };

    // Update and reload data for each list component.
    function updateCategoryListData(response, category, reload) {
        $scope.dataCategory[category] = response;
        $timeout(function(){
            reload && $('#list-' + category).trigger('reload');
        }, 0);
    };

    // Change data on overview.
    function updateOverview() {
        $scope.overview = currentItemData;
        $scope.isOverviewDark = false;
    }

    // Translate specific element using css property 'transform'.
    var moveContainer = function(category, regionId, targetTop) {
        if (category === $scope.currentCategory) {
            return;
        }
        $('#' + regionId).css({
            transform: 'translate3d(0, ' + targetTop + 'px, 0)'
        });
        $scope.currentCategory = category;
    };

    $scope.back = function(){
        if ($scope.currentDepth === $scope.DEPTH.INDEX) {
            return;
        }
        var focusClass;
        var targetDepth;
        switch ($scope.currentDepth) {
            case $scope.DEPTH.DETAIL:
                $scope.relatedPlaylist = [CONSTANT.ITEM];
                moveContainer(null, 'move-container', 0);
                targetDepth = $scope.DEPTH.INDEX;
                break;
            case $scope.DEPTH.PLAYER:
                getPlayerControls().pause();
                targetDepth = lastDepth;
                focusClass = '.btn-resume';
                break;
            default:
                targetDepth = $scope.DEPTH.INDEX;
                break;
        }
        $scope.currentDepth = targetDepth;
        $timeout(function () {
            if (targetDepth === $scope.DEPTH.INDEX) {
                focusController.setDepth(targetDepth, lastFocusedGroup);
            } else {
                focusController.setDepth(targetDepth);
            }
        }, CONSTANT.EFFECT_DELAY_TIME);
        focusController.focus($(focusClass));
    };

    $scope.setting = {
        show: false,
        center: true,
        focusOption: {
            depth: $scope.DEPTH.SETTING
        },
        onSelectButton: function(buttonIndex, $event){
            $scope.setting.show = false;
        },
        setSubTitle: function($event, $checked){
            $scope.setting.subTitle = $checked;
        },
        setAutoPlay: function($event, $checked){
            $scope.setting.autoPlay = $checked;
        },
        subTitle: false,
        autoPlay: true
    };
}
]);