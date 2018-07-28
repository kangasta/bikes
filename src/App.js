import React, { Component } from 'react';
import LocationUtils from './LocationUtils';
import {
	CSBackground,
	CSCenterBox,
	CSCentered,
	CSElement,
	CSFooter,
	CSError,
	CSLoading,
	CSList,
	CSTitle,
	CSWhiteSpace
} from 'chillisalmon';

import './Theme.css';


class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			data: {
				loading: 'Waiting location'
			}
		};
	}

	componentDidMount() {
		this.updateCoords(true).then(()=>{
			this.sendQueryAndUpdateState();
		});

		this.setState({queryIntervalId: setInterval(() => {
			this.sendQueryAndUpdateState();
		}, 10000)});
		this.setState({coordsIntervalId: setInterval(() => {
			this.updateCoords();
		}, 30000)});
	}

	updateCoords(set_loading=false) {
		return LocationUtils.getCoords()
			.then((coords)=>{
				this.setState({coords: coords});
				if (set_loading) this.setState({
					data: {loading: 'Loading data'}
				});
			})
			.catch((error_json)=>{
				this.setState({data: error_json});
			});
	}

	componentWillUnmount() {
		clearInterval(this.state.queryIntervalId);
		clearInterval(this.state.coordsIntervalId);
	}

	getQuery(lat, lon, r=2000) {
		return '{nearest(lat: ' + lat.toString() + ', lon: ' + lon.toString() + ', maxDistance: ' + r.toString() + ', filterByPlaceTypes:BICYCLE_RENT) { edges { node { place { ... on BikeRentalStation { stationId name bikesAvailable realtime } } distance } } } }';
	}

	sendQueryAndUpdateState() {
		const APIurl = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';

		if (this.state.hasOwnProperty('coords')) {
			fetch(APIurl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/graphql'
				},
				body: this.getQuery(
					this.state.coords.lat, this.state.coords.lon, 2000)
			})
				.then(response => response.json())
				.then((responseJson) => {
					if (responseJson.hasOwnProperty('errors')){
						this.setState({data: {error: 'Error from HSL API.'}});
					}
					return responseJson.data;
				})
				.then((data)=>{
					this.setState({data: data});
				});
		}
	}

	render() {
		if (this.state.data.hasOwnProperty('loading')) {
			return (
				<div className='App'>
					<CSCenterBox>
						<CSLoading>{this.state.data.loading}</CSLoading>
					</CSCenterBox>
					<CSFooter>
						<a className='effect-link' href='https://github.com/kangasta/bikes'>kangasta / bikes</a>
						<span className='divider'>|</span>
						<a className='effect-link' href='https://digitransit.fi/en/developers/'>data source</a>
					</CSFooter>
					<CSBackground/>
				</div>
			);
		}

		var bikeStationArr;
		try {
			bikeStationArr = this.state.data.nearest.edges;
		}
		catch(e) {
			return (
				<div className='App'>
					<CSCenterBox>
						<CSError>Could not render data</CSError>
					</CSCenterBox>
					<CSFooter>
						<a className='effect-link' href='https://github.com/kangasta/bikes'>kangasta / bikes</a>
						<span className='divider'>|</span>
						<a className='effect-link' href='https://digitransit.fi/en/developers/'>data source</a>
					</CSFooter>
					<CSBackground/>
				</div>
			);
		}

		return (
			<div className='App'>
				<CSCentered>
					<CSTitle>Bikes</CSTitle>
					<CSList>
						{bikeStationArr.map((a,i)=><CSElement
							key={i.toString()}
							className='bike-station-item'
							head={a.node.place.bikesAvailable || '0'}
							title={a.node.place.name}>{a.node.distance < 1000 ? a.node.distance.toString() + ' m' : (Math.round(a.node.distance/100)/10).toString() + ' km'}
						</CSElement>)}
					</CSList>
					<CSWhiteSpace/>
				</CSCentered>
				<CSFooter>
					<a className='effect-link' href='https://github.com/kangasta/bikes'>kangasta / bikes</a>
					<span className='divider'>|</span>
					<a className='effect-link' href='https://digitransit.fi/en/developers/'>data source</a>
				</CSFooter>
				<CSBackground/>
			</div>
		);
	}
}

export default App;
