var options = (function() {
	var selectedBackColor;
	var selectedFrontColor;
	var backColorPicker;
	var frontColorPicker;

	return {
		init: init,
		clearStorage: clearStorage,
		saveOptions: saveOptions
	};

	function showSaveSuccessMessage() {
		var statusArea = $('#status-message');

		statusArea.text('Okay, got it!').fadeIn(function() {
			setTimeout(function() {
				statusArea.fadeOut();
			}, 2000);
		});
	}

	function saveOptions() {
		chrome.runtime.getBackgroundPage(function(background) {
			var promise = background.options.save({
				backColor: selectedBackColor,
				frontColor: selectedFrontColor,
				threadRemovalTimeSeconds: $('#frequency').val() * 86400,
				border: $('#border').is(':checked')
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
			var backColor = background.options.getBackColor();
			backColorPicker.colpickSetColor(backColor);

			var frontColor = background.options.getFrontColor();
			frontColorPicker.colpickSetColor(frontColor);

			var seconds = background.options.getThreadRemovalTimeSecs();
			var frequency = $('#frequency');
			frequency.val(seconds / 86400);
			frequency.trigger('input');

			var border = background.options.get_has_border();
			$('#border').prop('checked', border);
		});
	}

	function init() {
		backColorPicker = $('#back_color').colpick({
			flat: true,
			layout: 'rgbhex',
			submit: false,
			onChange: function(hsb, hex) {
				selectedBackColor = '#' + hex;
			}
		});

		frontColorPicker = $('#front_color').colpick({
			flat: true,
			layout: 'rgbhex',
			submit: false,
			onChange: function(hsb, hex) {
				selectedFrontColor = '#' + hex;
			}
		});

		restoreOptions();
	}
})();

$(document).ready(function() {
	options.init();

	$('#save-options').click(function() {
		options.save_options();
	});

	$('#clear-options').click(function() {
		options.clear_storage();
	});
});

$('#frequency').on('input', function() {
	var frequency = $(this).val();
	var frequencyNumber = $('#frequency_number');
	var frequencyUnit = $('#frequency_unit');

	switch (parseInt(frequency, 10)) {
		case 1:
			frequencyNumber.text(frequency);
			frequencyUnit.text('day');
			break;
		case 7:
			frequencyNumber.text(1);
			frequencyUnit.text('week');
			break;
		case 14:
			frequencyNumber.text(2);
			frequencyUnit.text('weeks');
			break;
		default:
			frequencyNumber.text(frequency);
			frequencyUnit.text('days');
	}
});
