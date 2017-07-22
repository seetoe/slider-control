$(function() {
    function rememberAllOldValues() {
        $('#slider-table .prorate-slider').each(function() {
            $(this).data('oldVal', $(this).val());
        });
        $('#slider-table .prorate-value').each(function () {
            $(this).data('oldVal', $(this).val());
        });
    }

    function init() {
        rememberAllOldValues();
    }

    function syncCorrespondingTextBox(slider, value) {
        var correspondingTextBox = slider.next('.prorate-value');
        correspondingTextBox.data('oldVal', correspondingTextBox.val());
        correspondingTextBox.val(value);
    }

    function syncCorrespondingSlider(textbox, value) {
        var correspondingSlider = textbox.prev('.prorate-slider');
        correspondingSlider.val(value);
        correspondingSlider.trigger('change');
    }

    function getUnlockedItems(currentItem) {
        var unlockedSliders = $('input[type="range"]:not([readonly])');
        return unlockedSliders;
    }

    function getPreviousUnlockedItem(unlockedItems, currentItem) {
        var currentItemIndex = unlockedItems.index(currentItem);
        var previousItemIndex = currentItemIndex - 1;
        if (previousItemIndex > -1) {
            return unlockedItems.eq(previousItemIndex);
        }
        else {
            return null;
        }
    }

    function getNextUnlockedItem(unlockedItems, currentItem) {
        var currentItemIndex = unlockedItems.index(currentItem);
        var nextItemIndex = currentItemIndex + 1;
        if (nextItemIndex < unlockedItems.length) {
            return unlockedItems.eq(nextItemIndex);
        }
        else {
            return null;
        }
    }

    function isEditLocked(item) {
        var correspondingLockCheckbox = item.siblings('.prorate-lock');
        return correspondingLockCheckbox.attr('checked') == "checked" ? true : false;
    }

    var isValueGreaterThanZero = function(item) {
        return item.val() > 0;
    }

    var isValueLessThanHundred = function(item) {
        return item.val() < 100;
    }

    var isValidPercentageValue = function(value) {
        return value >= 0 && value <= 100;
    }

    function findItemToEqualize(startingItem, currentItem, direction, isEqualizeAllowedCondition, hasFlipped)
    {
        var unlockedItems = getUnlockedItems();
        // if no items to equalize
        if (unlockedItems.not(startingItem).length == 0) {
            return null;
        }

        if (direction == "forward") {
            var nextItem = getNextUnlockedItem(unlockedItems, currentItem);
            // if reach end then try other direction
            if (!nextItem && !hasFlipped) {
                hasFlipped = true;
                return findItemToEqualize(startingItem, startingItem, "back", isEqualizeAllowedCondition, hasFlipped);
            }
            // else next item does not satisfy edit conditions, keep searching
            else if (nextItem && isEqualizeAllowedCondition(nextItem) == false) {
                return findItemToEqualize(startingItem, nextItem, direction, isEqualizeAllowedCondition, hasFlipped);
            }
            else {
                return nextItem;
            }
        }
        else if (direction == "back") {
            var previousItem = getPreviousUnlockedItem(unlockedItems, currentItem);
            // if reach end then try other direction
            if (!previousItem && !hasFlipped) {
                hasFlipped = true;
                return findItemToEqualize(startingItem, startingItem, "forward", isEqualizeAllowedCondition, hasFlipped);
            }
            else if (previousItem && isEqualizeAllowedCondition(previousItem) == false) {
                return findItemToEqualize(startingItem, previousItem, direction, isEqualizeAllowedCondition, hasFlipped);
            }
            else {
                return previousItem;
            }
        }
    }

    // equalize other values to maintain sum
    function equalizeProrateFactorValues(changedItem, delta) {
        if (delta == 0) {
            return false;
        }

        var itemToEqualize;

        // if current change is an increase
        if (delta > 0) {
            itemToEqualize = findItemToEqualize(changedItem, changedItem, "forward", isValueGreaterThanZero, false);
        }
        // if current change is a decrease
        else if (delta < 0) {
            itemToEqualize = findItemToEqualize(changedItem, changedItem, "back", isValueLessThanHundred, false);
        }

        if (itemToEqualize) {
            var equalizeValue = parseInt(itemToEqualize.val()) + (delta * -1);
            if (isValidPercentageValue(equalizeValue)) {
                itemToEqualize.val(equalizeValue);
                itemToEqualize.data('oldVal', equalizeValue);
                syncCorrespondingTextBox(itemToEqualize, equalizeValue);
                return true;
            }
            else {
                var remainder = 0;
                if (delta > 0) {
                    remainder = delta - itemToEqualize.val();
                }
                else if (delta < 0) {
                    remainder = itemToEqualize.val() - delta;
                }
                itemToEqualize.val(0);
                itemToEqualize.data('oldVal', 0);
                syncCorrespondingTextBox(itemToEqualize, 0);

                // recursive call to distribute remainder value
                if (remainder != 0) {
                    equalizeProrateFactorValues(itemToEqualize, remainder);
                }
            }
        }
        return false;
    }

    // on slider change
    $('#slider-table .prorate-slider').on('input change', function (e) {
        var oldValue = $(this).data('oldVal');
        var newValue = $(this).val(); 
        var delta = parseInt(newValue) - parseInt(oldValue);
        var hasEqualized = equalizeProrateFactorValues($(this), delta);
        // if equalize successful, keep new value and store old value
        if (hasEqualized) {
            syncCorrespondingTextBox($(this), newValue);
            $(this).data('oldVal', newValue);
        }
        // else return to original value if no available sliders to equalize
        else {
            $(this).val(oldValue);
        }
    });

    // on text box change
    $('#slider-table .prorate-value').on('change', function (e) {
        var oldValue = $(this).data('oldVal');
        var newValue = $(this).val();
        if (newValue >= 0 && newValue <= 100) {
            syncCorrespondingSlider($(this), newValue);
        }
        else {
            $(this).val(oldValue);
        }
    });

    // on lock change
    $('#slider-table .prorate-lock').on('change', function (e) {
        var correspondingSlider = $(this).parent().prev().find('.prorate-slider');
        var correspondingTextBox = correspondingSlider.next('.prorate-value');
        if (correspondingSlider.attr('readonly')) {
            correspondingSlider.removeAttr('readonly');
            correspondingTextBox.removeAttr('readonly');
        }
        else {
            correspondingSlider.attr('readonly', true);
            correspondingTextBox.atttr('readonly', true);
        }
    });

    init();
});