var options = (function() {
	var $frequency;
	var $border;
	var $selectedBackColor;
	var $selectedFrontColor;
	var $backColorPicker;
	var $frontColorPicker;
	var $customCSSTextArea;
	var $customCSSClassName;
	var $shouldRedirect;

	return {
		init: init,
		updateClassNames: updateClassNames,
		clearStorage: clearStorage,
		saveOptions: saveOptions
	};

	function updateClassNames() {
		chrome.runtime.getBackgroundPage(function(background) {
			var className = $customCSSClassName.val().trim();
			var invalid = !background.options.isValidCSSClassName(className);

			if (invalid) {
				className = background.options.getDefaultCSSClassName();
			}

			$customCSSClassName.toggleClass('invalid', invalid);
			$('.class-name').text(className);
		});
	}

	function showSaveSuccessMessage() {
		var $statusArea = $('#status-message');

		$statusArea.text('Okay, got it!').fadeIn(function() {
			setTimeout(function() {
				$statusArea.fadeOut();
			}, 2000);
		});
	}

	function saveOptions() {
		chrome.runtime.getBackgroundPage(function(background) {
			var promise = background.options.save({
				backColor: $selectedBackColor,
				frontColor: $selectedFrontColor,
				threadRemovalTimeSeconds: $frequency.val() * 86400,
				border: $border.is(':checked'),
                shouldRedirect: $shouldRedirect.is(':checked'),
				useCustomCSS: $('#use-custom-css').is(':checked'),
				customCSS: $customCSSTextArea.val(),
				customCSSClassName: $customCSSClassName.val()
			});

			promise.then(showSaveSuccessMessage);
		});
	}

	function clearStorage() {
		chrome.runtime.getBackgroundPage(function(background) {
			background.storage.clear().then(function() {
				restoreOptions();
			});
		});
	}

	function restoreOptions() {
		chrome.runtime.getBackgroundPage(function(background) {
			var useCustomCSS = background.options.getUseCustomCSS();
			$(useCustomCSS ? '#use-custom-css' : '#use-color-picker').trigger('click');

			var customCSS = background.options.getCustomCSS();
			$customCSSTextArea.val(customCSS);

			var customCSSClassName = background.options.getCustomCSSClassName();
			$customCSSClassName.val(customCSSClassName);
			$customCSSClassName.trigger('input');

			var backColor = background.options.getBackColor();
			$backColorPicker.colpickSetColor(backColor);

			var frontColor = background.options.getFrontColor();
			$frontColorPicker.colpickSetColor(frontColor);

			var seconds = background.options.getThreadRemovalTimeSecs();
			$frequency.val(seconds / 86400);
			$frequency.trigger('input');

			var border = background.options.getHasBorder();
			$border.prop('checked', border);
            
			var shouldRedirect = background.options.getShouldRedirect();
			$shouldRedirect.prop('checked', shouldRedirect);
		});
	}

	function init() {
		$customCSSTextArea = $('textarea[name="css"]');
		$customCSSClassName = $('input[name="class-name"]');
		$border = $('input[name="border"]');
		$shouldRedirect = $('input[name="redirect"]');
		$frequency = $('input[name="frequency"]');

		$backColorPicker = $('#back-color').colpick({
			flat: true,
			layout: 'rgbhex',
			submit: false,
			onChange: function(hsb, hex) {
				$selectedBackColor = '#' + hex;
			}
		});

		$frontColorPicker = $('#front-color').colpick({
			flat: true,
			layout: 'rgbhex',
			submit: false,
			onChange: function(hsb, hex) {
				$selectedFrontColor = '#' + hex;
			}
		});

		restoreOptions();
	}
})();

$(document).ready(function() {
	options.init();

	$('input[name="save-options"]').click(options.saveOptions);
	$('input[name="clear-options"]').click(options.clearStorage);
	$('input[name="class-name"]').on('input', options.updateClassNames);

	$('input[name="frequency"]').on('input', function() {
		var frequency = $(this).val();
		var $frequencyNumber = $('#frequency-number');
		var $frequencyUnit = $('#frequency-unit');

		switch (parseInt(frequency, 10)) {
			case 1:
				$frequencyNumber.text(frequency);
				$frequencyUnit.text('day');
				break;
			case 7:
				$frequencyNumber.text(1);
				$frequencyUnit.text('week');
				break;
			case 14:
				$frequencyNumber.text(2);
				$frequencyUnit.text('weeks');
				break;
			default:
				$frequencyNumber.text(frequency);
				$frequencyUnit.text('days');
		}
	});

	$('input[name="style-mode"]').click(function() {
		var selection = $(this).val();

		$('.tab').each(function(i, tab) {
			if (tab.id === selection) {
				$(tab).removeClass('hidden');
			} else {
				$(tab).addClass('hidden');
			}
		});
	});

	$('#year').text(new Date().getFullYear());
});
