// fullscreen toggle adapted from https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API#Toggling_fullscreen_mode
fullscreen = {
	modal: null,
	init: function(){

	},


	isFullscreen: function(){
		return !(!document.fullscreenElement&& !document.mozFullScreenElement&& !document.webkitFullscreenElement&& !document.msFullscreenElement);
	},

	toggleFullscreen: function(){
		if(!this.isFullscreen()){
			this.createModal();
		} else {
			this.exitFullscreen();
		}
	},

	requestFullscreen: function(){
		if (document.body.requestFullscreen) {
			document.body.requestFullscreen();
		} else if (document.body.msRequestFullscreen) {
			document.body.msRequestFullscreen();
		} else if (document.body.mozRequestFullScreen) {
			document.body.mozRequestFullScreen();
		} else if (document.body.webkitRequestFullscreen) {
			document.body.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	},
	exitFullscreen: function(){
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	},

	confirmFullscreen: function(){
		this.requestFullscreen();
		this.removeModal();
	},
	cancelFullscreen: function(){
		this.removeModal();
	},

	createModal: function(){
		// create fullscreen modal and add it to the document
		this.modal = document.createElement("section");
		this.modal.id = "fullscreenModal";

		var header = document.createElement("h1");
		var btnYes = document.createElement("button");
		var btnNo = document.createElement("button");

		header.innerHTML = "Go Fullscreen?";
		btnYes.innerHTML = "Yes";
		btnNo.innerHTML = "No";

		btnYes.onclick = this.confirmFullscreen.bind(this);
		btnNo.onclick = this.cancelFullscreen.bind(this);

		this.modal.appendChild(header);
		this.modal.appendChild(btnYes);
		this.modal.appendChild(btnNo);

		document.body.appendChild(this.modal);
	},
	removeModal: function(){
		// remove the fullscreen modal
		document.body.removeChild(this.modal);
		this.modal = null;
	}
};