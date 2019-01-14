var socket = io('http://localhost:3000'); 

const store = new Vuex.Store({
	state: {
		testArt: ['src/testArt/basementPic.jpg', 'src/testArt/deskPic.jpg', 'src/testArt/tetonsPic.jpg'],
		testTrackInfo: [['Bars and Stages', 'It Came From the Basement', 'Tetrad'], ['Desk', 'Desk', 'Nathan Whitcome'], ['Tetons', 'Summer 2018', 'Nathan Whitcome']],
		testCurrentArtId: 0,
		musicPlaying: false,
	},
	mutations:{
		updateArt (state, newIndex){
			state.testCurrentArtId = newIndex;
			socket.emit('getColors', this.state.testArt[this.state.testCurrentArtId])
		},
		updatePlaying (state){
			state.musicPlaying = !state.musicPlaying;
		},
	},
})


Vue.component('top_bar', {
	data: function () {
		return {
		}
	},
	methods: {
	},
	template: `
	<div id="top_bar">
	</div>
	`
})

const album_art = {
	computed: {
		currentArtId (){
			return this.$store.state.testArt[this.$store.state.testCurrentArtId];
		},
		currentAlbumInfo (){
			return this.$store.state.testTrackInfo[this.$store.state.testCurrentArtId];
		},
	},
	methods: {
	},
	template: `
		<div>
			<img id="albumArt" :src="currentArtId">
		</div>
	`
}

const current_song = {
	data: function () {
		return {
			playOrPause: 'play_arrow'
		}
	},
	computed: {
		currentAlbumInfo (){
			return this.$store.state.testTrackInfo[this.$store.state.testCurrentArtId];
		},
	},
	methods: {
		testNextSong(event){
			var currentId = this.$store.state.testCurrentArtId;
			var testAlbumArt = this.$store.state.testArt;
			if(currentId + 1 > testAlbumArt.length - 1)
				this.$store.commit('updateArt', 0)
			else
				this.$store.commit('updateArt', currentId + 1)
		},
		testPreviousSong(event){
			var currentId = this.$store.state.testCurrentArtId;
			var testAlbumArt = this.$store.state.testArt;
			if(currentId - 1 < 0)
				this.$store.commit('updateArt', testAlbumArt.length - 1)
			else
				this.$store.commit('updateArt', currentId - 1)
		},
		invertPlaying(event){
			if(this.playOrPause == 'play_arrow')
				this.playOrPause = 'pause';
			else if(this.playOrPause == 'pause')
				this.playOrPause = 'play_arrow';
			updatePlaying();
		}
	},
	template: `
		<div id="album_info">
			<div id="trackInfo">
				<p class="albumInfoText"><b>{{ currentAlbumInfo[0] }}</b></p>
				<p class="albumInfoText" style="color: #DDD; font-size: 25px;">{{ currentAlbumInfo[2] }} - {{ currentAlbumInfo[1] }}</p>
			</div>
			<div id="songNavigation" class="unselectable">
				<i style="font-size: 80px;" @click="testPreviousSong()">skip_previous</i>
				<i style="font-size: 80px;" @click="invertPlaying">{{ playOrPause }}</i>
				<i style="font-size: 80px;" @click="testNextSong()">skip_next</i>
			</div>
		</div>
	`
}

new Vue({
	el: '#app',
	components: { album_art, current_song },
	store,
	created: function () {
		window.addEventListener('resize', this.handleResize)
		this.handleResize();
	},
	methods: {
		handleResize() {
			this.winWidth = window.innerWidth;
			this.winHeight = window.innerHeight;
		}
	},
	mounted: function(){
		socket.on('connect', function(data){
			console.log('connected');
		}.bind(this));
	},
	template: `
	<div style="width: 100%; height: 100%;">
		<top_bar></top_bar>
		<div id="albumInfoFlex">
			<album_art></album_art>
			<current_song></current_song>
		</div>
	</div>
	`
});