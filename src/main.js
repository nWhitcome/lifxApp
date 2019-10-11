var socket = io(); 

const store = new Vuex.Store({
	state: {
		testArt: ['basementPic.jpg', 'deskPic.jpg', 'tetonsPic.jpg'],
		testTrackInfo: [['Bars and Stages', 'It Came From the Basement', 'Tetrad'], ['Desk', 'Desk', 'Nathan Whitcome'], ['Tetons', 'Summer 2018', 'Nathan Whitcome']],
		currentTrackInfo: [],
		testCurrentArtId: 0,
		musicPlaying: false,
		currentColors: [],
		logState: false,
		currentArt: '',
		imageKeyVal: 0,
		finishedDownloading: false,
		albUrl: "",
	},
	mutations:{
		updateArt (state, newIndex){
			state.testCurrentArtId = newIndex;
		},
		updatePlaying (state, data){
			state.musicPlaying = data;
		},
		updateColors (state, colors){
			state.currentColors = colors;
		},
		updateLogState (state, loggedIn){
			state.logState = loggedIn;
		},
		updateTrackInfo (state, trackInfo){
			state.currentTrackInfo = trackInfo;
		},
		updateAlbUrl (state, index){
			state.albUrl = index;
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
		<i id="add_button" class="unselectable">add</i>
	</div>
	`
})

Vue.component('bottom_bar', {
	data: function () {
		return {
		}
	},
	methods: {
	},
	template: `
	<div id="bottom_bar">
		<current_song></current_song>
	</div>
	`
})

Vue.component('color_display', {
	methods: {
	},
	computed: {
		currentArtId (){
			return this.$store.state.currentColors;
		},
	},
	template: `
	<div id="colorDisplay">
		<div v-for="item in currentArtId" class="colorBox" v-bind:style="{backgroundColor: item}">
		</div>
	</div>
	`
})

const album_art = {
	props:['albPath'],
	template: `
		<div style="width: 400px; height: 400px;">
			<img id="albumArt" :src="albPath">
		</div>
	`
}

Vue.component('current_song', {
	computed: {
		currentAlbumInfo (){
			return this.$store.state.currentTrackInfo;
		},
		playOrPause (){
			return this.$store.state.musicPlaying;
		},
	},
	methods: {
		previousSong(event){
			socket.emit('changeSong', 'back');
		},
		nextSong(event){
			socket.emit('changeSong', 'forward');
		},
		invertPlaying(event){
			socket.emit('togglePlayback');
			console.log("changing")
		}
	},
	template: `
		<div id="album_info">
			<div id="trackInfo">
				<p class="albumInfoText"><b>{{ currentAlbumInfo[0] }}</b></p>
				<p class="albumInfoText" style="font-size: 14px;">{{ currentAlbumInfo[2] }} - {{ currentAlbumInfo[1] }}</p>
			</div>
			<div id="songNavigation" class="unselectable">
				<i class="iSmaller" @click="previousSong()">skip_previous</i>
				<i class="iNav" v-if="playOrPause == true" @click="invertPlaying">pause</i>
				<i class="iNav" v-else @click="invertPlaying">play_arrow</i>
				<i class="iSmaller" @click="nextSong()">skip_next</i>
			</div>
		</div>
	`
})

new Vue({
	el: '#app',
	components: { album_art },
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
			this.$store.commit('updateLogState', data);
		}.bind(this));
		socket.on('updateLogin', function(data){
			console.log("updating state")
			this.$store.commit('updateLogState', data);
		}.bind(this));
		socket.on('updateColors', function(data){
			this.$store.commit('updateColors', data)
		}.bind(this));
		socket.on('currentSongInfo', function(data){
			this.$store.commit('updateTrackInfo', data)
		}.bind(this));
		socket.on('albArt', function(data){
			this.$store.commit('updateAlbUrl', data)
		}.bind(this));
		socket.on('playState', function(data){
			this.$store.commit('updatePlaying', data)
		}.bind(this));
	},
	template: `
	<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
		<div v-if="this.$store.state.logState == true" id="centerAll">
		<top_bar></top_bar>
		<bottom_bar>
		</bottom_bar>
		<div id="leftCenter">
			<div id="albumInfoFlex">
				<album_art :albPath="this.$store.state.albUrl"></album_art>
				<color_display></color_display>
			</div>
		</div>
		<!--<div id="rightCenter">
			<div id="bulbGroupHeading"><b>Bulb Groups</b></div>
			<div class="bulb_holder">
				<div class="bulb_outer">
					<i class="bulb_icon unselectable">wb_incandescent</i>
				</div>
				<div class="bulb_outer">
					<i class="bulb_icon unselectable">wb_incandescent</i>
				</div>
				<div class="bulb_outer">
					<i class="bulb_icon unselectable">wb_incandescent</i>
				</div>
			</div>
			<div class="bulb_holder">
				<div class="bulb_outer">
					<i class="bulb_icon unselectable">wb_incandescent</i>
				</div>
			</div>
		</div>-->
		</div>
		<div id="centerAll" style="flex-direction: column;" v-else>
			<h1 style="color: white; font-size: 30px;">Log in with Spotify</h1>
			<a id="spotifyLogin" href="/login">Login</a>
		</div>
	</div>
	`
});