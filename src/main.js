var socket = io('http://localhost:3000'); 

const store = new Vuex.Store({
	state: {
		testArt: ['basementPic.jpg', 'deskPic.jpg', 'tetonsPic.jpg'],
		testTrackInfo: [['Bars and Stages', 'It Came From the Basement', 'Tetrad'], ['Desk', 'Desk', 'Nathan Whitcome'], ['Tetons', 'Summer 2018', 'Nathan Whitcome']],
		testCurrentArtId: 0,
		musicPlaying: false,
		currentColors: [],
	},
	mutations:{
		updateArt (state, newIndex){
			state.testCurrentArtId = newIndex;
		},
		updatePlaying (state){
			state.musicPlaying = !state.musicPlaying;
		},
		updateColors (state, colors){
			state.currentColors = colors;
			console.log(colors);
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
	computed: {
		currentArtId (){
			return 'src/testArt/' + this.$store.state.testArt[this.$store.state.testCurrentArtId];
		},
		currentAlbumInfo (){
			return this.$store.state.testTrackInfo[this.$store.state.testCurrentArtId];
		},
	},
	methods: {
		logValues (value){
			console.log(value);
			socket.emit('getColors', 'src/testArt/' + this.$store.state.testArt[this.$store.state.testCurrentArtId])
		}
	},
	template: `
		<div>
			<img id="albumArt" @load="logValues('loaded')" :src="currentArtId">
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
				<i class="iSmaller" @click="testPreviousSong()">skip_previous</i>
				<i @click="invertPlaying">{{ playOrPause }}</i>
				<i class="iSmaller" @click="testNextSong()">skip_next</i>
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
		socket.on('updateColors', function(data){
			this.$store.commit('updateColors', data)
		}.bind(this));
	},
	template: `
	<div id="centerAll">
		<div id="leftCenter">
			<top_bar></top_bar>
			<div id="albumInfoFlex">
				<album_art></album_art>
				<current_song></current_song>
				<color_display></color_display>
			</div>
		</div>
		<div id="rightCenter">
			<h1>TEST</h1>
		</div>
	</div>
	`
});